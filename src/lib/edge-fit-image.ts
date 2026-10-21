import { fetchMediaBlob, resolveMediaUrl } from "@/lib/media";

export type EdgeFittedImage = {
  src: string;
  /** True when the mark is close to square and should cover the frame. */
  cover: boolean;
};

const cache = new Map<string, EdgeFittedImage>();
const NEAR_WHITE = 248;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = src;
  });
}

function isMarginPixel(data: Uint8ClampedArray, index: number): boolean {
  const alpha = data[index + 3];
  if (alpha < 12) return true;
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  return r >= NEAR_WHITE && g >= NEAR_WHITE && b >= NEAR_WHITE;
}

/**
 * Drop the empty white or transparent margin baked in by logo letterboxing,
 * so a square mark fills its frame instead of floating inside it.
 */
export async function edgeFitImage(src: string): Promise<EdgeFittedImage> {
  const resolved = resolveMediaUrl(src) ?? src;
  const hit = cache.get(resolved);
  if (hit) return hit;

  let objectUrl: string | undefined;
  try {
    let drawable = resolved;
    if (!resolved.startsWith("data:") && !resolved.startsWith("blob:")) {
      const blob = await fetchMediaBlob(resolved);
      objectUrl = URL.createObjectURL(blob);
      drawable = objectUrl;
    }

    const image = await loadImage(drawable);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) return { src: resolved, cover: true };

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { src: resolved, cover: true };
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;

    let top = 0;
    let bottom = height - 1;
    let left = 0;
    let right = width - 1;

    const rowIsMargin = (y: number) => {
      for (let x = 0; x < width; x += 1) {
        if (!isMarginPixel(pixels, (y * width + x) * 4)) return false;
      }
      return true;
    };
    const colIsMargin = (x: number, y0: number, y1: number) => {
      for (let y = y0; y <= y1; y += 1) {
        if (!isMarginPixel(pixels, (y * width + x) * 4)) return false;
      }
      return true;
    };

    while (top < bottom && rowIsMargin(top)) top += 1;
    while (bottom > top && rowIsMargin(bottom)) bottom -= 1;
    while (left < right && colIsMargin(left, top, bottom)) left += 1;
    while (right > left && colIsMargin(right, top, bottom)) right -= 1;

    const cropW = right - left + 1;
    const cropH = bottom - top + 1;
    const aspect = cropW / cropH;
    const cover = aspect > 0.8 && aspect < 1.25;
    const unchanged =
      top <= 2 && left <= 2 && width - right <= 3 && height - bottom <= 3;

    if (unchanged || cropW < 8 || cropH < 8) {
      const fitted = { src: resolved, cover };
      cache.set(resolved, fitted);
      return fitted;
    }

    const out = document.createElement("canvas");
    out.width = cropW;
    out.height = cropH;
    const outCtx = out.getContext("2d");
    if (!outCtx) return { src: resolved, cover };
    outCtx.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/png"));
    if (!blob) return { src: resolved, cover };
    const fitted = { src: URL.createObjectURL(blob), cover };
    cache.set(resolved, fitted);
    return fitted;
  } catch {
    return { src: resolved, cover: true };
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
