import { useMemo, useState } from "react";
import { Download, FileText, X } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  formatSupportBytes,
  isSupportImage,
  isSupportVoice,
  type SupportAttachment,
} from "@/lib/api/support";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

import { VoiceNotePlayer } from "./VoiceNotePlayer";

export function SupportMessageContent({
  body,
  attachments,
  inverted = false,
}: {
  body?: string;
  attachments?: SupportAttachment[] | null;
  inverted?: boolean;
}) {
  const items = attachments ?? [];
  const [lightbox, setLightbox] = useState<SupportAttachment | null>(null);
  const images = useMemo(() => items.filter(isSupportImage), [items]);
  const voices = useMemo(() => items.filter(isSupportVoice), [items]);
  const files = useMemo(
    () => items.filter((item) => !isSupportImage(item) && !isSupportVoice(item)),
    [items],
  );
  const text = (body || "").trim();
  const lightboxSrc = lightbox ? resolveMediaUrl(lightbox.path) : undefined;

  return (
    <div className="space-y-2">
      {text ? <div className="whitespace-pre-wrap break-words">{text}</div> : null}

      {images.length ? (
        <div className={cn("grid gap-1.5", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {images.map((item) => {
            const src = resolveMediaUrl(item.path);
            if (!src) return null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightbox(item)}
                className="overflow-hidden rounded-xl bg-black/10 text-left"
                aria-label={`Open ${item.name}`}
              >
                <img src={src} alt={item.name} className="max-h-52 w-full object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}

      {voices.map((item) => {
        const src = resolveMediaUrl(item.path);
        if (!src) return null;
        return (
          <VoiceNotePlayer key={item.id} src={src} durationMs={item.durationMs} inverted={inverted} />
        );
      })}

      {files.map((item) => {
        const href = resolveMediaUrl(item.path);
        return (
          <a
            key={item.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] no-underline",
              inverted
                ? "bg-white/12 text-white hover:bg-white/18"
                : "bg-black/[0.05] text-slate-800 hover:bg-black/[0.08] dark:bg-white/10 dark:text-zinc-100",
            )}
          >
            <FileText className="h-4 w-4 shrink-0 opacity-80" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{item.name}</span>
              <span className={cn("block text-[10px]", inverted ? "text-white/70" : "text-black/45")}>
                {formatSupportBytes(item.size)}
              </span>
            </span>
            <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </a>
        );
      })}

      <Dialog open={Boolean(lightbox)} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-none bg-black/90 p-3 sm:rounded-2xl" showCloseButton={false}>
          <DialogTitle className="sr-only">{lightbox?.name || "Screenshot"}</DialogTitle>
          <DialogDescription className="sr-only">Full-size attachment preview</DialogDescription>
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
          {lightboxSrc ? (
            <img src={lightboxSrc} alt={lightbox?.name || ""} className="max-h-[80vh] w-full rounded-lg object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
