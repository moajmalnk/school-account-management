import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Eraser, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

function trimTransparentPng(source: HTMLCanvasElement): string | null {
  const ctx = source.getContext("2d");
  if (!ctx) return null;
  const { width, height } = source;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha < 12) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return null;
  const pad = 16;
  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(width - sx, maxX - minX + 1 + pad * 2);
  const sh = Math.min(height - sy, maxY - minY + 1 + pad * 2);
  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const outCtx = out.getContext("2d");
  if (!outCtx) return null;
  outCtx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return out.toDataURL("image/png");
}

export function SignaturePadDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Draw signature",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dataUrl: string) => void;
  title?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrappingRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const last = useRef<Point | null>(null);
  const [strokes, setStrokes] = useState(0);

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrappingRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(320, Math.round(rect.width));
    const h = Math.max(160, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 2.4;
    ctx.clearRect(0, 0, w, h);
    last.current = null;
    drawing.current = false;
    setStrokes(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(sizeCanvas);
    window.addEventListener("resize", sizeCanvas);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", sizeCanvas);
    };
  }, [open, sizeCanvas]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const strokeTo = (from: Point, to: Point) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pointFromEvent(e);
    setStrokes((n) => n + 1);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const next = pointFromEvent(e);
    strokeTo(last.current, next);
    last.current = next;
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const clearPad = () => {
    sizeCanvas();
  };

  const useSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = trimTransparentPng(canvas);
    if (!dataUrl) {
      toast.error("Draw a signature first");
      return;
    }
    onConfirm(dataUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(100vw-1.5rem,560px)] gap-0 overflow-hidden rounded-2xl p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Sign with your mouse or finger, then use the signature on receipts.
        </DialogDescription>
        <div className="flex items-center justify-between gap-3 border-b border-[#EFEFEF] px-4 py-3">
          <div>
            <div className="text-[15px] font-semibold text-black">{title}</div>
            <p className="mt-0.5 text-[11px] text-black/50">
              Sign in the box · used on receipts, slips, and vouchers
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="grid h-9 w-9 place-items-center rounded-full text-black/50 hover:bg-[#F4F4F5]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          ref={wrappingRef}
          className="relative mx-4 mt-4 h-[200px] overflow-hidden rounded-xl border border-dashed border-[#CBD5E1] bg-[linear-gradient(180deg,#FAFAFA_0%,#FFFFFF_48%,#FAFAFA_100%)]"
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none cursor-crosshair"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerLeave={endStroke}
            onPointerCancel={endStroke}
          />
          {strokes === 0 && (
            <p className="pointer-events-none absolute inset-0 grid place-items-center text-[12px] text-black/35">
              Draw the authorised signature here
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3.5">
          <button
            type="button"
            onClick={clearPad}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 text-[12px] font-semibold text-black/70 hover:bg-[#F4F4F5]",
            )}
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 text-[12px] font-semibold text-black/70 hover:bg-[#F4F4F5]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={useSignature}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#0F766E] px-3.5 text-[12px] font-semibold text-white hover:bg-[#0D9488]"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Use signature
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
