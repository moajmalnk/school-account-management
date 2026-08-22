import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Eraser, Redo2, Undo2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };
type Stroke = Point[];

const INK = "#1D4ED8";
const INK_WIDTH = 2.7;

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

function applyPen(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = INK_WIDTH;
}

function drawStroke(ctx: CanvasRenderingContext2D, points: Stroke) {
  if (points.length === 0) return;
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, INK_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (points.length === 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
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
  const historyRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  const syncButtons = useCallback(() => {
    const ink = historyRef.current.length > 0 || (currentStrokeRef.current?.length ?? 0) > 0;
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(redoRef.current.length > 0);
    setHasInk(ink);
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    applyPen(ctx);
    for (const stroke of historyRef.current) drawStroke(ctx, stroke);
    if (currentStrokeRef.current) drawStroke(ctx, currentStrokeRef.current);
  }, []);

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
    applyPen(ctx);
    paint();
  }, [paint]);

  useEffect(() => {
    if (!open) return;
    historyRef.current = [];
    redoRef.current = [];
    currentStrokeRef.current = null;
    drawing.current = false;
    syncButtons();
    const id = window.requestAnimationFrame(sizeCanvas);
    window.addEventListener("resize", sizeCanvas);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", sizeCanvas);
    };
  }, [open, sizeCanvas, syncButtons]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const point = pointFromEvent(e);
    currentStrokeRef.current = [point];
    redoRef.current = [];
    paint();
    syncButtons();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !currentStrokeRef.current) return;
    const next = pointFromEvent(e);
    const prev = currentStrokeRef.current[currentStrokeRef.current.length - 1];
    if (prev && Math.hypot(next.x - prev.x, next.y - prev.y) < 0.6) return;
    currentStrokeRef.current.push(next);
    paint();
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentStrokeRef.current && currentStrokeRef.current.length > 0) {
      historyRef.current = [...historyRef.current, currentStrokeRef.current];
    }
    currentStrokeRef.current = null;
    paint();
    syncButtons();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const undo = useCallback(() => {
    if (drawing.current || historyRef.current.length === 0) return;
    const next = historyRef.current.slice(0, -1);
    const removed = historyRef.current[historyRef.current.length - 1];
    historyRef.current = next;
    redoRef.current = [...redoRef.current, removed];
    paint();
    syncButtons();
  }, [paint, syncButtons]);

  const redo = useCallback(() => {
    if (drawing.current || redoRef.current.length === 0) return;
    const restored = redoRef.current[redoRef.current.length - 1];
    redoRef.current = redoRef.current.slice(0, -1);
    historyRef.current = [...historyRef.current, restored];
    paint();
    syncButtons();
  }, [paint, syncButtons]);

  const clearPad = () => {
    if (!hasInk) return;
    historyRef.current = [];
    redoRef.current = [];
    currentStrokeRef.current = null;
    paint();
    syncButtons();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, redo, undo]);

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
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(100vw-1.5rem,560px)] gap-0 overflow-hidden rounded-2xl border border-black/5 bg-white p-0 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-zinc-900"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Sign with your mouse or finger, then use the signature on receipts.
        </DialogDescription>
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
              {title}
            </div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
              Sign in blue ink · used on receipts, slips, and vouchers
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={wrappingRef}
          className="relative mx-5 h-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner dark:border-white/10"
        >
          <div className="pointer-events-none absolute inset-x-8 bottom-9 border-b border-slate-200 dark:border-slate-300/40" />
          <span className="pointer-events-none absolute bottom-3 left-8 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-300 dark:text-slate-400">
            Sign here
          </span>
          <canvas
            ref={canvasRef}
            className="relative z-10 h-full w-full touch-none cursor-crosshair"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerLeave={endStroke}
            onPointerCancel={endStroke}
          />
          {!hasInk && (
            <p className="pointer-events-none absolute inset-0 z-20 grid place-items-center pb-6 text-[12px] text-slate-400">
              Draw the authorised signature here
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-5 pt-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (⌘Z)"
                aria-label="Undo last stroke"
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 border-r border-slate-200 px-3 text-[12px] font-semibold text-[#1D4ED8] transition-colors hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent dark:border-white/10 dark:hover:bg-blue-950/40 dark:disabled:text-zinc-600",
                )}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (⇧⌘Z)"
                aria-label="Redo last stroke"
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 px-3 text-[12px] font-semibold text-[#1D4ED8] transition-colors hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent dark:hover:bg-blue-950/40 dark:disabled:text-zinc-600",
                )}
              >
                <Redo2 className="h-3.5 w-3.5" />
                Redo
              </button>
            </div>
            <button
              type="button"
              onClick={clearPad}
              disabled={!hasInk}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-full px-3"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={useSignature}
              disabled={!hasInk}
              className="h-10 rounded-full bg-[#0F766E] px-3.5 text-white hover:bg-[#0D9488] disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Use signature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
