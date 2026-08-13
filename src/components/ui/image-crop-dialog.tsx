"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Camera, Check, X } from "lucide-react";
import "react-easy-crop/react-easy-crop.css";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

async function createCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number,
  mimeType = "image/jpeg",
  quality = 0.92,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Could not load image")));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const size = Math.max(64, Math.round(outputSize));
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image canvas");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  return canvas.toDataURL(mimeType, quality);
}

async function createCroppedImageFree(
  imageSrc: string,
  pixelCrop: Area,
  maxEdge = 1600,
  mimeType = "image/jpeg",
  quality = 0.92,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Could not load image")));
    img.src = imageSrc;
  });

  const scale = Math.min(1, maxEdge / Math.max(pixelCrop.width, pixelCrop.height));
  const width = Math.max(64, Math.round(pixelCrop.width * scale));
  const height = Math.max(64, Math.round(pixelCrop.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image canvas");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  return canvas.toDataURL(mimeType, quality);
}

export type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  title?: string;
  description?: string;
  /** Crop aspect ratio. Use 1 for square logos. */
  aspect?: number;
  /** Square output edge when aspect === 1. */
  outputSize?: number;
  confirmLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dataUrl: string) => void;
  /** Opens file picker / camera again. */
  onRetake?: () => void;
};

export function ImageCropDialog({
  open,
  imageSrc,
  title = "Adjust image",
  description = "Drag to reposition, then zoom and confirm.",
  aspect = 1,
  outputSize = 512,
  onOpenChange,
  onConfirm,
  onRetake,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setBusy(false);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || busy) return;
    setBusy(true);
    try {
      const dataUrl =
        aspect === 1
          ? await createCroppedImage(imageSrc, croppedAreaPixels, outputSize)
          : await createCroppedImageFree(imageSrc, croppedAreaPixels, outputSize);
      onConfirm(dataUrl);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-w-[min(100vw-1.5rem,420px)] gap-0 overflow-hidden rounded-[28px] border-0 bg-white p-0 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)]",
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>

        <div className="relative h-[min(62vh,360px)] w-full bg-[#E8E8ED]">
          <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            {title}
          </div>
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
              objectFit="horizontal-cover"
              style={{
                containerStyle: { background: "#E8E8ED" },
                cropAreaStyle: {
                  border: "2px solid rgba(59,130,246,0.95)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
                },
              }}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="shrink-0 text-[12px] font-medium text-black/55">Zoom:</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E5E5E5] accent-[#0F766E] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0F766E]"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onRetake && (
              <button
                type="button"
                onClick={onRetake}
                aria-label="Choose another photo"
                className="grid h-11 w-11 place-items-center rounded-full border border-[#E5E5E5] bg-white text-[#0F766E] shadow-sm transition-colors hover:bg-[#F4F4F5]"
              >
                <Camera className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Cancel"
              className="grid h-11 w-11 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/70 shadow-sm transition-colors hover:bg-[#F4F4F5]"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={busy || !croppedAreaPixels}
              aria-label="Confirm crop"
              className="grid h-11 w-11 place-items-center rounded-full bg-[#0F766E] text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.65)] transition-colors hover:bg-[#0D9488] disabled:opacity-50"
            >
              <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
