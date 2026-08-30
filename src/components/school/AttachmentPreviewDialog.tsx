import { Download, FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PreviewableAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(mimeType: string, name: string) {
  return mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
}

function isPdfAttachment(mimeType: string, name: string) {
  return mimeType === "application/pdf" || /\.pdf$/i.test(name);
}

function isTextAttachment(mimeType: string, name: string) {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/csv" ||
    /\.(csv|txt|json|md|log|tsv)$/i.test(name)
  );
}

function decodeDataUrlText(dataUrl: string): string | null {
  try {
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return null;
    const meta = dataUrl.slice(0, comma);
    const payload = dataUrl.slice(comma + 1);
    if (meta.includes(";base64")) {
      const binary = atob(payload);
      try {
        return decodeURIComponent(
          Array.from(binary, (c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
        );
      } catch {
        return binary;
      }
    }
    return decodeURIComponent(payload);
  } catch {
    return null;
  }
}

export function AttachmentPreviewDialog({
  file,
  open,
  onOpenChange,
}: {
  file: PreviewableAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!file) return null;

  const image = isImageAttachment(file.mimeType, file.name);
  const pdf = isPdfAttachment(file.mimeType, file.name);
  const textLike = isTextAttachment(file.mimeType, file.name);
  const textBody = textLike ? decodeDataUrlText(file.dataUrl) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex w-[calc(100%-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0",
          "max-h-[min(920px,calc(100dvh-1rem))] rounded-2xl border-[#E5E5E5] bg-white text-black sm:w-[calc(100%-2rem)] sm:rounded-3xl",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-[#E5E5E5] bg-[#F4F4F5] px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="truncate text-[16px] font-semibold tracking-tight text-black sm:text-[18px]">
            {file.name}
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] text-black/55">
            {formatBytes(file.size)}
            {file.mimeType ? ` · ${file.mimeType}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-[#FAFAFA] p-3 sm:p-5">
          {image ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <img
                src={file.dataUrl}
                alt={file.name}
                className="max-h-[min(70dvh,640px)] w-auto max-w-full rounded-xl border border-[#E5E5E5] bg-white object-contain shadow-sm"
              />
            </div>
          ) : pdf ? (
            <iframe
              title={file.name}
              src={file.dataUrl}
              className="h-[min(70dvh,640px)] w-full rounded-xl border border-[#E5E5E5] bg-white"
            />
          ) : textBody != null ? (
            <pre className="max-h-[min(70dvh,640px)] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[#E5E5E5] bg-white p-3 font-mono text-[11px] leading-relaxed text-black/80 sm:p-4 sm:text-[12px]">
              {textBody}
            </pre>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#E5E5E5] bg-white px-4 py-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F4F4F5] text-black/45">
                <FileText className="h-7 w-7" />
              </span>
              <div>
                <div className="text-[14px] font-semibold text-black">Preview not available</div>
                <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-black/55">
                  This file type can’t be shown inline. You can still download a copy if needed.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-12 gap-2 border-t border-[#E5E5E5] bg-[#F4F4F5] px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <div className="col-span-5 sm:col-span-4">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5" />
              Close
            </Button>
          </div>
          <div className="col-span-7 sm:col-span-8 sm:flex sm:justify-end">
            <Button
              asChild
              className="w-full rounded-full bg-black text-white hover:bg-black/85 sm:w-auto"
            >
              <a href={file.dataUrl} download={file.name}>
                <Download className="h-3.5 w-3.5" />
                Download file
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
