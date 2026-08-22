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

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  placeholder = "Message",
  disabled = false,
  busy = false,
  ticketId,
  autoFocus = false,
  initialDraft = "",
  editingMessageId = null,
  onCancelEdit,
  onSend,
}: {
  placeholder?: string;
  disabled?: boolean;
  busy?: boolean;
  ticketId?: string;
  autoFocus?: boolean;
  initialDraft?: string;
  editingMessageId?: string | null;
  onCancelEdit?: () => void;
  onSend: (input: { body: string; attachments: SupportAttachment[] }) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initialDraft);
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
  const showSend = editingMessageId ? draft.trim() !== "" : canSend;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fitInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  };

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft, editingMessageId]);

  useEffect(() => {
    fitInput();
  }, [draft]);

  const submit = async () => {
    if (editingMessageId) {
      if (!draft.trim() || disabled || sending || recording) return;
      setUploading(true);
      try {
        await onSend({ body: draft.trim(), attachments: [] });
        setDraft("");
        onCancelEdit?.();
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not save";
        toast.error("Could not save", { description: msg });
      } finally {
        setUploading(false);
      }
      return;
    }
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
      onCancelEdit?.();
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
        className={cn("relative flex flex-col gap-2", disabled && "opacity-60")}
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
        {editingMessageId ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-[#F0FDFA]/80 px-3 py-2 text-[12px] dark:bg-teal-950/40">
            <span className="font-medium text-[#0F766E] dark:text-teal-300">Editing message</span>
            <button
              type="button"
              onClick={() => {
                setDraft("");
                setPending([]);
                onCancelEdit?.();
              }}
              className="font-semibold text-black/55 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        ) : null}
        {pending.length ? (
          <div className="flex flex-wrap gap-2 px-0.5">
            {pending.map((item) => (
              <div
                key={item.localId}
                className="relative flex items-center gap-2 rounded-2xl bg-white px-2 py-1.5 shadow-sm dark:bg-zinc-900"
              >
                {item.previewUrl && isSupportImage(item) ? (
                  <img src={item.previewUrl} alt="" className="h-11 w-11 rounded-lg object-cover" />
                ) : item.previewUrl && isSupportVoice(item) ? (
                  <VoiceNotePlayer src={item.previewUrl} durationMs={item.durationMs} />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F4F6F9] text-[#0F766E] dark:bg-white/10">
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
                      <span className="block text-[10px] text-black/45 dark:text-zinc-400">{formatSupportBytes(item.size)}</span>
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

        <div className="flex items-end gap-1.5">
          <div
            className={cn(
              "flex min-h-11 min-w-0 flex-1 items-end rounded-[26px] border bg-white py-0.5 pl-0.5 pr-2 shadow-sm dark:bg-zinc-950",
              dragOver
                ? "border-[#0F766E] bg-[#F0FDFA] dark:bg-teal-950/30"
                : "border-black/10 dark:border-white/10",
            )}
          >
            {recording ? (
              <div className="flex min-h-10 w-full items-center gap-2 px-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                <span className="min-w-0 flex-1 font-mono text-[13px] tabular-nums text-black/60 dark:text-zinc-300">
                  {formatSupportDuration(recordMs)}
                </span>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-black/45 dark:text-zinc-400"
                  onClick={() => stopRecording(true)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <ToolHint label="Photo or file">
                  <button
                    type="button"
                    disabled={disabled || sending || Boolean(editingMessageId)}
                    onClick={() => fileRef.current?.click()}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-black/40 hover:bg-black/5 hover:text-[#0F766E] disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-teal-300"
                    aria-label="Attach"
                  >
                    <Paperclip className="h-[18px] w-[18px]" />
                  </button>
                </ToolHint>
                <Popover open={shotOpen} onOpenChange={setShotOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={disabled || sending || shotBusy || Boolean(editingMessageId)}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-black/40 hover:bg-black/5 hover:text-[#0F766E] disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-teal-300"
                      aria-label="Photo"
                    >
                      {shotBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-[18px] w-[18px]" />}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-52 p-1.5">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/10"
                      onClick={() => void captureScreenshot()}
                    >
                      <Monitor className="h-4 w-4 text-[#0F766E]" />
                      Capture screen
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
                      Choose photo
                    </button>
                  </PopoverContent>
                </Popover>
                <textarea
                  ref={inputRef}
                  value={draft}
                  rows={1}
                  autoFocus={autoFocus}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  placeholder={placeholder}
                  disabled={disabled || sending}
                  className="max-h-28 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-5 text-black outline-none placeholder:text-black/35 disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </>
            )}
          </div>
          {recording ? (
            <button
              type="button"
              onClick={() => stopRecording()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
              aria-label="Stop recording"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : showSend ? (
            <button
              type="submit"
              disabled={!showSend}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0F766E] text-white shadow-sm hover:bg-[#0D9488] disabled:opacity-40"
              aria-label={editingMessageId ? "Save edit" : "Send"}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || sending}
              onClick={() => void startRecording()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0F766E] text-white shadow-sm hover:bg-[#0D9488] disabled:opacity-40"
              aria-label="Voice message"
            >
              <Mic className="h-[18px] w-[18px]" />
            </button>
          )}
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
