import { resolveMediaUrl } from "@/lib/media";

function markInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const DEFAULT_INK = "#1E293B";
/** Official stamp ink — blue by default, like a rubber seal. */
export const DEFAULT_SEAL_INK = "#1D4ED8";

const SEAL_SIZE = 320;
const SEAL_CX = 160;
const SEAL_CY = 160;
const SEAL_TEXT_R = 125.5;
const SEAL_LOGO_R = 78;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function collapseText(value: string, maxChars: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

function polar(deg: number, r = SEAL_TEXT_R): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return {
    x: +(SEAL_CX + r * Math.cos(rad)).toFixed(2),
    y: +(SEAL_CY + r * Math.sin(rad)).toFixed(2),
  };
}

function starPath(cx: number, cy: number, outerR: number): string {
  const innerR = outerR * 0.38;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? outerR : innerR;
    pts.push(`${+(cx + rad * Math.cos(ang)).toFixed(2)},${+(cy + rad * Math.sin(ang)).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

function fontForArc(text: string, arcLen: number, max: number, min: number, ratio: number): number {
  if (!text) return max;
  return Math.max(min, Math.min(max, arcLen / (text.length * ratio)));
}

function trackingForArc(text: string, arcLen: number, fontSize: number, ratio: number): number {
  if (text.length < 2) return 0;
  const used = text.length * fontSize * ratio;
  if (used >= arcLen * 0.9) return 0;
  return +((arcLen * 0.86 - used) / text.length).toFixed(2);
}

export type DefaultSealExtras = {
  details?: string;
  logoHref?: string;
  id?: string;
  /** Hide initials when a logo will be composited on top (PDF raster). */
  hideCenter?: boolean;
};

export function sealDetailsLine(details?: string, fallback = "Official Seal"): string {
  return collapseText(details || "", 46) || fallback;
}

export function defaultSealSvg(
  schoolName: string,
  color = DEFAULT_SEAL_INK,
  extras: DefaultSealExtras = {},
): string {
  const name = collapseText(schoolName.trim() || "School", 42);
  const details = sealDetailsLine(extras.details);
  const initials = markInitials(schoolName.trim() || "School") || "SC";
  const fill = escapeXml(color);
  const uid = extras.id || "seal";
  const topId = `${uid}-top`;
  const botId = `${uid}-bot`;
  const clipId = `${uid}-clip`;

  const gap = 20;
  const topStart = polar(180 + gap);
  const topEnd = polar(360 - gap);
  const botStart = polar(180 - gap);
  const botEnd = polar(gap);

  const arcLen = (SEAL_TEXT_R * ((180 - gap * 2) * Math.PI)) / 180;
  const nameSize = fontForArc(name, arcLen, 22, 11, 0.58);
  const detailSize = fontForArc(details, arcLen, 13.5, 8.5, 0.52);
  const nameTrack = trackingForArc(name, arcLen, nameSize, 0.55);
  const detailTrack = trackingForArc(details, arcLen, detailSize, 0.5);

  const leftStar = polar(180);
  const rightStar = polar(0);
  const showLogo = Boolean(extras.logoHref) && !extras.hideCenter;
  const showInitials = !showLogo && !extras.hideCenter;
  const centerSize = initials.length > 2 ? 36 : 52;

  const logo = extras.logoHref
    ? `<image href="${escapeXml(extras.logoHref)}" x="82" y="82" width="156" height="156" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${SEAL_SIZE} ${SEAL_SIZE}" width="${SEAL_SIZE}" height="${SEAL_SIZE}">
  <defs>
    <path id="${topId}" d="M ${topStart.x},${topStart.y} A ${SEAL_TEXT_R},${SEAL_TEXT_R} 0 0 1 ${topEnd.x},${topEnd.y}"/>
    <path id="${botId}" d="M ${botStart.x},${botStart.y} A ${SEAL_TEXT_R},${SEAL_TEXT_R} 0 0 0 ${botEnd.x},${botEnd.y}"/>
    <clipPath id="${clipId}"><circle cx="${SEAL_CX}" cy="${SEAL_CY}" r="${SEAL_LOGO_R}"/></clipPath>
  </defs>
  <circle cx="${SEAL_CX}" cy="${SEAL_CY}" r="160" fill="#fff"/>
  <!-- Outer stamp ring (thick) -->
  <circle cx="${SEAL_CX}" cy="${SEAL_CY}" r="154" fill="none" stroke="${fill}" stroke-width="9"/>
  <!-- Inner twin rings -->
  <circle cx="${SEAL_CX}" cy="${SEAL_CY}" r="145.5" fill="none" stroke="${fill}" stroke-width="2.4"/>
  <circle cx="${SEAL_CX}" cy="${SEAL_CY}" r="140.5" fill="none" stroke="${fill}" stroke-width="1.4"/>
  <!-- Logo / emblem ring -->
  <circle cx="${SEAL_CX}" cy="${SEAL_CY}" r="99.5" fill="none" stroke="${fill}" stroke-width="2.2"/>
  <circle cx="${SEAL_CX}" cy="${SEAL_CY}" r="94.5" fill="none" stroke="${fill}" stroke-width="1.1" opacity="0.85"/>
  <text fill="${fill}" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${nameSize.toFixed(1)}" font-weight="800" letter-spacing="${nameTrack}" text-anchor="middle">
    <textPath href="#${topId}" xlink:href="#${topId}" startOffset="50%">${escapeXml(name)}</textPath>
  </text>
  <text fill="${fill}" font-family="'Arial Narrow', 'Helvetica Condensed', Arial, sans-serif" font-size="${detailSize.toFixed(1)}" font-weight="600" letter-spacing="${detailTrack}" text-anchor="middle">
    <textPath href="#${botId}" xlink:href="#${botId}" startOffset="50%">${escapeXml(details)}</textPath>
  </text>
  <path d="${starPath(leftStar.x, leftStar.y, 7.6)}" fill="${fill}"/>
  <path d="${starPath(rightStar.x, rightStar.y, 7.6)}" fill="${fill}"/>
  ${showLogo ? logo : ""}
  ${
    showInitials
      ? `<text x="${SEAL_CX}" y="${SEAL_CY + centerSize * 0.36}" text-anchor="middle" fill="${fill}" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${centerSize}" font-weight="800">${escapeXml(initials)}</text>`
      : ""
  }
</svg>`;
}

export function defaultSignatureSvg(principalName: string, color = DEFAULT_INK): string {
  const label = (principalName.trim() || "Authorised Signatory").slice(0, 42);
  const size = label.length > 28 ? 28 : label.length > 18 ? 34 : 42;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160" width="480" height="160">
  <text x="8" y="96" font-family="'Palatino Linotype', Palatino, 'Snell Roundhand', 'Apple Chancery', cursive" font-size="${size}" font-style="italic" fill="${escapeXml(color)}">${escapeXml(label)}</text>
  <path d="M12 122 C 150 138, 330 108, 468 124" fill="none" stroke="#94A3B8" stroke-width="1.1"/>
</svg>`;
}

export function defaultSealDataUrl(
  schoolName: string,
  color?: string,
  extras?: DefaultSealExtras,
): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(defaultSealSvg(schoolName, color, extras))}`;
}

export function defaultSignatureDataUrl(principalName: string, color?: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(defaultSignatureSvg(principalName, color))}`;
}

export function resolveSealDisplaySrc(
  schoolName: string,
  sealUrl?: string,
  color?: string,
  extras?: DefaultSealExtras,
): string {
  const custom = resolveMediaUrl(sealUrl) ?? (sealUrl?.trim() || undefined);
  return custom || defaultSealDataUrl(schoolName, color, extras);
}

export function resolveSignatureDisplaySrc(
  principalName: string,
  signatureUrl?: string,
  color?: string,
): string {
  const custom = resolveMediaUrl(signatureUrl) ?? (signatureUrl?.trim() || undefined);
  return custom || defaultSignatureDataUrl(principalName, color);
}

export async function svgMarkupToPng(
  svg: string,
  width: number,
  height: number,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not rasterize mark"));
      el.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load seal logo"));
    img.src = src;
  });
}

/** Rasterize the default circular seal, compositing the tenant logo in the center. */
export async function defaultSealToPng(
  schoolName: string,
  extras: DefaultSealExtras & { logoDataUrl?: string; size?: number; color?: string } = {},
): Promise<{ dataUrl: string; width: number; height: number }> {
  const size = extras.size ?? SEAL_SIZE;
  const hasLogo = Boolean(extras.logoDataUrl);
  const ring = await svgMarkupToPng(
    defaultSealSvg(schoolName, extras.color ?? DEFAULT_SEAL_INK, {
      details: extras.details,
      hideCenter: hasLogo,
      id: extras.id,
    }),
    size,
    size,
  );
  if (!hasLogo) return ring;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return ring;

  const ringImg = await loadHtmlImage(ring.dataUrl);
  ctx.drawImage(ringImg, 0, 0, size, size);

  try {
    const logo = await loadHtmlImage(extras.logoDataUrl!);
    const scale = size / SEAL_SIZE;
    const cx = SEAL_CX * scale;
    const cy = SEAL_CY * scale;
    const r = SEAL_LOGO_R * scale;
    const box = r * 2;
    const srcW = logo.naturalWidth || logo.width;
    const srcH = logo.naturalHeight || logo.height;
    const fit = Math.min(box / srcW, box / srcH);
    const drawW = srcW * fit;
    const drawH = srcH * fit;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();
  } catch {
    /* keep ring-only seal if logo cannot be drawn */
  }

  return { dataUrl: canvas.toDataURL("image/png"), width: size, height: size };
}
