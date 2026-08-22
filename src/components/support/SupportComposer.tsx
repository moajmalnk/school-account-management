import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Camera,
  FileText,
  ImageIcon,
  Loader2,
  Mic,
  Monitor,
  Paperclip,
  Send,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api/client";
import {
  SUPPORT_MAX_ATTACHMENTS,
  SUPPORT_MAX_BYTES,
  SUPPORT_VOICE_MAX_MS,
  classifySupportFile,
  formatSupportBytes,
  formatSupportDuration,
  isSupportImage,
  isSupportVoice,
  uploadSupportAttachment,
  type SupportAttachment,
  type SupportAttachmentKind,
} from "@/lib/api/support";
import { cn } from "@/lib/utils";

import { VoiceNotePlayer } from "./VoiceNotePlayer";

type PendingAttachment = {
  localId: string;
  kind: SupportAttachmentKind;
  name: string;
  mimeType: string;
  size: number;
  file: File;
  previewUrl?: string;
  durationMs?: number;
  uploaded?: SupportAttachment;
};

const FILE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,application/pdf,audio/*,.pdf,.webm,.ogg,.mp3,.m4a,.wav";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function ToolHint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="bg-slate-900 text-white">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

async function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not capture frame"))),
      "image/jpeg",
      0.86,
    );
  });
}

async function captureDisplayFrame(): Promise<File> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Screen capture is not available in this browser");
  }
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 8 },
    audio: false,
  });
  try {
    const track = stream.getVideoTracks()[0];
    if (!track) throw new Error("No screen was selected");
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    await new Promise((resolve) => {
      if (video.readyState >= 2) resolve(undefined);
      else video.onloadeddata = () => resolve(undefined);
    });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, video.videoWidth);
    canvas.height = Math.max(1, video.videoHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not capture screenshot");
    ctx.drawImage(video, 0, 0);
    const blob = await blobFromCanvas(canvas);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return new File([blob], `screenshot-${stamp}.jpg`, { type: "image/jpeg" });
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

function pickRecorderMime(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) ?? "";
}

function recorderExtension(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export function SupportComposer({
  placeholder = "Write a reply…",
  disabled = false,
  busy = false,
  ticketId,
  onSend,
}: {
  placeholder?: string;
  disabled?: boolean;
  busy?: boolean;
  ticketId?: string;
  onSend: (input: { body: string; attachments: SupportAttachment[] }) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const [shotBusy, setShotBusy] = useState(false);
  const [shotOpen, setShotOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const pendingRef = useRef(pending);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const addFiles = useCallback((files: File[], requested?: SupportAttachmentKind) => {
    if (!files.length) return;
    setPending((prev) => {
      const room = SUPPORT_MAX_ATTACHMENTS - prev.length;
      if (room <= 0) {
        toast.error("Limit reached", { description: `You can attach up to ${SUPPORT_MAX_ATTACHMENTS} items.` });
        return prev;
      }
      const next = [...prev];
      for (const file of files.slice(0, room)) {
        if (file.size > SUPPORT_MAX_BYTES) {
          toast.error("File too large", { description: `${file.name} is over 8 MB.` });
          continue;
        }
        const kind = classifySupportFile(file, requested);
        const previewUrl =
          file.type.startsWith("image/") || file.type.startsWith("audio/")
            ? URL.createObjectURL(file)
            : undefined;
        next.push({
          localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          kind,
          name: file.name || (kind === "screenshot" ? "Screenshot.jpg" : "attachment"),
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          file,
          previewUrl,
        });
      }
      return next;
    });
  }, []);

  const removePending = (localId: string) => {
    setPending((prev) => {
      const item = prev.find((entry) => entry.localId === localId);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((entry) => entry.localId !== localId);
    });
  };

  const stopRecording = useCallback((discard = false) => {
    const recorder = recorderRef.current;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    if (!recorder) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }
    if (discard) {
      recorder.ondataavailable = null;
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        chunksRef.current = [];
      };
    }
    if (recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;
  }, []);

  const startRecording = async () => {
    if (disabled || recording) return;
    if (pending.length >= SUPPORT_MAX_ATTACHMENTS) {
      toast.error("Limit reached", { description: `You can attach up to ${SUPPORT_MAX_ATTACHMENTS} items.` });
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice notes are not available in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        const durationMs = Math.max(400, Date.now() - startedAtRef.current);
        if (blob.size < 200) return;
        const ext = recorderExtension(recorder.mimeType || "");
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type || "audio/webm" });
        const previewUrl = URL.createObjectURL(blob);
        setPending((prev) => {
          if (prev.length >= SUPPORT_MAX_ATTACHMENTS) return prev;
          return [
            ...prev,
            {
              localId: `voice-${Date.now()}`,
              kind: "voice",
              name: file.name,
              mimeType: file.type,
              size: file.size,
              file,
              previewUrl,
              durationMs,
            },
          ];
        });
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setRecordMs(0);
      setRecording(true);
      recorder.start(200);
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setRecordMs(elapsed);
        if (elapsed >= SUPPORT_VOICE_MAX_MS) stopRecording();
      }, 200);
    } catch {
      toast.error("Microphone blocked", { description: "Allow microphone access to send a voice note." });
    }
  };

  const captureScreenshot = async () => {
    setShotOpen(false);
    setShotBusy(true);
    try {
      const file = await captureDisplayFrame();
      addFiles([file], "screenshot");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not capture the screen";
      if (!/abort|denied|cancel|notallowed/i.test(message)) {
        toast.error("Screenshot failed", { description: message });
      }
    } finally {
      setShotBusy(false);
    }
  };

  const onPaste = (event: React.ClipboardEvent) => {
    const files = Array.from(event.clipboardData?.files ?? []);
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    event.preventDefault();
    addFiles(images, "screenshot");
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    if (disabled) return;
    addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const sending = busy || uploading;
  const canSend = !disabled && !sending && !recording && (draft.trim() !== "" || pending.length > 0);

  const submit = async () => {
    if (!canSend) return;
    setUploading(true);
    try {
      const uploaded: SupportAttachment[] = [];
      const nextPending: PendingAttachment[] = [];
      for (const item of pending) {
        if (item.uploaded) {
          uploaded.push(item.uploaded);
          nextPending.push(item);
          continue;
        }
        const saved = await uploadSupportAttachment({
          file: item.file,
          kind: item.kind,
          ticketId,
          durationMs: item.durationMs,
        });
        uploaded.push(saved);
        nextPending.push({ ...item, uploaded: saved });
      }
      setPending(nextPending);
      await onSend({ body: draft.trim(), attachments: uploaded });
      pending.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setPending([]);
      setDraft("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not send";
      toast.error("Could not send", { description: msg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <TooltipProvider delayDuration={250}>
      <form
        className={cn(
          "relative rounded-2xl border bg-white shadow-sm transition-colors dark:bg-zinc-950",
          dragOver ? "border-[#0F766E] bg-[#F0FDFA]" : "border-[#E5E5E5] dark:border-white/10",
          disabled && "opacity-60",
        )}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onPaste={onPaste}
      >
        {pending.length ? (
          <div className="flex flex-wrap gap-2 border-b border-[#EFEFEF] px-3 pt-3 pb-2 dark:border-white/10">
            {pending.map((item) => (
              <div
                key={item.localId}
                className="relative flex items-center gap-2 rounded-xl bg-[#F4F6F9] px-2 py-1.5 dark:bg-white/5"
              >
                {item.previewUrl && isSupportImage(item) ? (
                  <img src={item.previewUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                ) : item.previewUrl && isSupportVoice(item) ? (
                  <VoiceNotePlayer src={item.previewUrl} durationMs={item.durationMs} />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#0F766E] dark:bg-zinc-900">
                      {item.kind === "screenshot" ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </span>
                    <span className="max-w-[140px]">
                      <span className="block truncate text-[12px] font-medium text-black dark:text-zinc-100">
                        {item.name}
                      </span>
                      <span className="block text-[10px] text-black/45">{formatSupportBytes(item.size)}</span>
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePending(item.localId)}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-800 text-white hover:bg-black"
                  aria-label={`Remove ${item.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {recording ? (
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-black dark:text-zinc-100">Recording</div>
              <div className="font-mono text-[12px] tabular-nums text-black/50">
                {formatSupportDuration(recordMs)} · max {formatSupportDuration(SUPPORT_VOICE_MAX_MS)}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full"
              onClick={() => stopRecording(true)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              onClick={() => stopRecording()}
            >
              <Square className="mr-1 h-3 w-3 fill-current" />
              Stop
            </Button>
          </div>
        ) : (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={placeholder}
            disabled={disabled || sending}
            className="min-h-[72px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        )}

        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <ToolHint label="Attach a file or photo">
              <button
                type="button"
                disabled={disabled || sending || recording}
                onClick={() => fileRef.current?.click()}
                className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 hover:text-[#0F766E] disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </ToolHint>
            <Popover open={shotOpen} onOpenChange={setShotOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={disabled || sending || recording || shotBusy}
                  className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 hover:text-[#0F766E] disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10"
                  aria-label="Screenshot"
                  title="Screenshot"
                >
                  {shotBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1.5">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => void captureScreenshot()}
                >
                  <Monitor className="h-4 w-4 text-[#0F766E]" />
                  Capture this screen
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => {
                    setShotOpen(false);
                    imageRef.current?.click();
                  }}
                >
                  <ImageIcon className="h-4 w-4 text-[#0F766E]" />
                  Upload an image
                </button>
                <p className="px-2.5 pb-1.5 pt-1 text-[11px] text-black/40">You can also paste a screenshot.</p>
              </PopoverContent>
            </Popover>
            <ToolHint label={recording ? "Stop recording" : "Voice message"}>
              <button
                type="button"
                disabled={disabled || sending}
                onClick={() => (recording ? stopRecording() : void startRecording())}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10",
                  recording ? "bg-red-50 text-red-600" : "text-black/45 hover:text-[#0F766E] dark:text-zinc-400",
                )}
                aria-label="Voice message"
              >
                <Mic className="h-4 w-4" />
              </button>
            </ToolHint>
          </div>
          <Button
            type="submit"
            disabled={!canSend}
            className="h-10 rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488]"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="mr-1.5 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={FILE_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.currentTarget.value = "";
          }}
        />
        <input
          ref={imageRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []), "screenshot");
            e.currentTarget.value = "";
          }}
        />
      </form>
    </TooltipProvider>
  );
}
