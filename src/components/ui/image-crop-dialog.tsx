"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area, type MediaSize, type Point, type Size } from "react-easy-crop";
import { ImagePlus, Loader2, Minus, Plus, Scan, X } from "lucide-react";
import "react-easy-crop/react-easy-crop.css";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FALLBACK_MIN_ZOOM = 0.15;
const MAX_ZOOM = 4;
/** Used until the dialog finishes layout so the cropper can mount immediately. */
const FALLBACK_STAGE: Size = { width: 472, height: 340 };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Could not load image")));
    img.src = src;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function containZoom(media: Size, crop: Size) {
  if (!media.width || !media.height || !crop.width || !crop.height) return 1;
  return Math.min(crop.width / media.width, crop.height / media.height);
}

function coverZoom(media: Size, crop: Size) {
  if (!media.width || !media.height || !crop.width || !crop.height) return 1;
  return Math.max(crop.width / media.width, crop.height / media.height);
}

/** Size the crop frame to the stage so wide logos are not locked to a tiny square. */
function cropSizeForStage(stage: Size, aspect: number, padding = 48): Size | null {
  if (stage.width < 64 || stage.height < 64) return null;
  const maxW = Math.max(72, stage.width - padding);
  const maxH = Math.max(72, stage.height - padding);
  if (maxW / maxH > aspect) {
    return { width: maxH * aspect, height: maxH };
  }
  return { width: maxW, height: maxW / aspect };
}

/** Rasterize a crop that may extend past the image (letterboxing / padding). */
async function rasterizeCrop(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number,
  outputHeight: number,
  mimeType: "image/jpeg" | "image/png",
  background: string,
  quality = 0.92,
): Promise<string> {
  const image = await loadImage(imageSrc);
  const width = Math.max(64, Math.round(outputWidth));
  const height = Math.max(64, Math.round(outputHeight));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image canvas");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (background !== "transparent") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  const sx = pixelCrop.x;
  const sy = pixelCrop.y;
  const sw = pixelCrop.width;
  const sh = pixelCrop.height;
  const srcX = Math.max(0, sx);
  const srcY = Math.max(0, sy);
  const srcW = Math.min(image.width, sx + sw) - srcX;
  const srcH = Math.min(image.height, sy + sh) - srcY;

  if (srcW > 0 && srcH > 0 && sw > 0 && sh > 0) {
    const scaleX = width / sw;
    const scaleY = height / sh;
    ctx.drawImage(
      image,
      srcX,
      srcY,
      srcW,
      srcH,
      (srcX - sx) * scaleX,
      (srcY - sy) * scaleY,
      srcW * scaleX,
      srcH * scaleY,
    );
  }

  return mimeType === "image/png"
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL(mimeType, quality);
}

export type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  title?: string;
  description?: string;
  /** Crop aspect ratio. Use 1 for square logos. */
  aspect?: number;
  /** Square output edge when aspect === 1; max edge otherwise. */
  outputSize?: number;
  outputMime?: "image/jpeg" | "image/png";
  /**
   * `contain` lets the full image sit inside the frame (logos / wordmarks).
   * `cover` fills the frame (profile photos).
   */
  fit?: "contain" | "cover";
  /** Fill color when the image does not cover the crop. `"transparent"` requires PNG. */
  background?: string;
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
  outputMime = "image/jpeg",
  fit = "cover",
  background,
  confirmLabel = "Apply",
  onOpenChange,
  onConfirm,
  onRetake,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(fit === "contain" ? FALLBACK_MIN_ZOOM : 1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [stage, setStage] = useState<Size>({ width: 0, height: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const stageObserverRef = useRef<ResizeObserver | null>(null);
  const didFitRef = useRef(false);
  const fitZoomRef = useRef(1);

  const fill = background ?? (outputMime === "image/png" ? "transparent" : "#FFFFFF");

  const cropSize = useMemo(
    () => cropSizeForStage(stage, aspect) ?? cropSizeForStage(FALLBACK_STAGE, aspect),
    [stage, aspect],
  );

  useEffect(() => {
    if (!open) return;
    didFitRef.current = false;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMinZoom(fit === "contain" ? FALLBACK_MIN_ZOOM : 1);
    setCroppedAreaPixels(null);
    setBusy(false);
    setReady(false);
    setMediaSize(null);
  }, [open, imageSrc, fit]);

  const attachStage = useCallback((el: HTMLDivElement | null) => {
    stageObserverRef.current?.disconnect();
    stageObserverRef.current = null;
    stageRef.current = el;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      setStage((prev) =>
        prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height },
      );
    };
    measure();
    const raf = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    stageObserverRef.current = observer;
    const prevDisconnect = observer.disconnect.bind(observer);
    observer.disconnect = () => {
      window.cancelAnimationFrame(raf);
      prevDisconnect();
    };
  }, []);

  useEffect(() => () => stageObserverRef.current?.disconnect(), []);

  const onMediaLoaded = useCallback((media: MediaSize) => {
    setMediaSize((prev) =>
      prev &&
      prev.width === media.width &&
      prev.height === media.height &&
      prev.naturalWidth === media.naturalWidth &&
      prev.naturalHeight === media.naturalHeight
        ? prev
        : media,
    );
  }, []);

  useEffect(() => {
    if (!mediaSize || !cropSize) return;
    const contain = containZoom(mediaSize, cropSize);
    const cover = coverZoom(mediaSize, cropSize);

    if (fit === "contain") {
      const nextMin = Math.max(FALLBACK_MIN_ZOOM, contain * 0.6);
      const nextFit = clamp(contain * 0.9, nextMin, MAX_ZOOM);
      fitZoomRef.current = nextFit;
      setMinZoom(nextMin);
      if (!didFitRef.current) {
        didFitRef.current = true;
        setCrop({ x: 0, y: 0 });
        setZoom(nextFit);
      } else {
        setZoom((z) => clamp(z, nextMin, MAX_ZOOM));
      }
    } else {
      const nextMin = Math.max(FALLBACK_MIN_ZOOM, cover);
      fitZoomRef.current = clamp(cover, nextMin, MAX_ZOOM);
      setMinZoom(nextMin);
      if (!didFitRef.current) {
        didFitRef.current = true;
        setCrop({ x: 0, y: 0 });
        setZoom(fitZoomRef.current);
      } else {
        setZoom((z) => clamp(z, nextMin, MAX_ZOOM));
      }
    }
    setReady(true);
  }, [mediaSize, cropSize, fit]);

  useEffect(() => {
    if (!open || !imageSrc || ready) return;
    const t = window.setTimeout(() => setReady(true), 800);
    return () => window.clearTimeout(t);
  }, [open, imageSrc, ready]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const nudgeZoom = (delta: number) => {
    setZoom((z) => clamp(Number((z + delta).toFixed(3)), minZoom, MAX_ZOOM));
  };

  const handleFit = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(fitZoomRef.current);
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || busy) return;
    setBusy(true);
    try {
      const isSquare = aspect === 1;
      const outW = isSquare
        ? outputSize
        : Math.max(
            64,
            Math.round(
              croppedAreaPixels.width *
                Math.min(
                  1,
                  outputSize / Math.max(croppedAreaPixels.width, croppedAreaPixels.height),
                ),
            ),
          );
      const outH = isSquare
        ? outputSize
        : Math.max(
            64,
            Math.round(
              croppedAreaPixels.height *
                Math.min(
                  1,
                  outputSize / Math.max(croppedAreaPixels.width, croppedAreaPixels.height),
                ),
            ),
          );
      const dataUrl = await rasterizeCrop(
        imageSrc,
        croppedAreaPixels,
        outW,
        outH,
        outputMime,
        fill,
      );
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
          "max-w-[min(100vw-1.5rem,520px)] gap-0 overflow-hidden rounded-2xl border border-black/5 bg-white p-0 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.5)]",
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0">
            <DialogTitle className="text-[16px] font-semibold tracking-tight text-slate-900">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-[12px] leading-relaxed text-slate-500">
              {description}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mx-5 overflow-hidden rounded-xl bg-[#111827]">
          <div ref={attachStage} className="relative h-[min(52vh,340px)] w-full">
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={minZoom}
                maxZoom={MAX_ZOOM}
                aspect={aspect}
                cropSize={cropSize ?? undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onMediaLoaded={onMediaLoaded}
                showGrid
                objectFit="contain"
                restrictPosition={fit === "cover"}
                roundCropAreaPixels
                style={{
                  containerStyle: { background: "#111827" },
                  cropAreaStyle: {
                    border: "2px solid #2DD4BF",
                    borderRadius: 12,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
                  },
                }}
              />
            ) : null}
            {!ready && (
              <div className="absolute inset-0 grid place-items-center bg-[#111827] text-[12px] text-white/50">
                Preparing preview…
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => nudgeZoom(-0.08)}
              disabled={zoom <= minZoom + 0.001}
              aria-label="Zoom out"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="range"
              min={minZoom}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#0F766E] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0F766E] [&::-webkit-slider-thumb]:shadow-sm"
            />
            <button
              type="button"
              onClick={() => nudgeZoom(0.08)}
              disabled={zoom >= MAX_ZOOM - 0.001}
              aria-label="Zoom in"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFit}
              aria-label="Fit entire image"
              title="Fit entire image"
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Scan className="h-3.5 w-3.5" />
              Fit
            </button>
          </div>
          <div className="mt-1.5 text-center text-[10px] font-medium tabular-nums tracking-wide text-slate-400">
            {Math.round(zoom * 100)}%
            {fit === "contain" ? " · zoom out to show the full image" : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            {onRetake ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetake}
                className="rounded-full"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Replace
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleConfirm()}
                disabled={busy || !croppedAreaPixels}
                className="rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488]"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
