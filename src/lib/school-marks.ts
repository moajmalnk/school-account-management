import { DEFAULT_BRAND_PRIMARY } from "@/lib/brand-theme";
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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rimCaption(schoolName: string): string {
  const name = (schoolName.trim() || "School").toUpperCase();
  const core = ` ${name}  ·  OFFICIAL SEAL  · `;
  let text = core;
  while (text.length < 52) text += core;
  return text.slice(0, 58);
}

export function defaultSealSvg(schoolName: string, color = DEFAULT_BRAND_PRIMARY): string {
  const initials = markInitials(schoolName.trim() || "School") || "SC";
  const rim = escapeXml(rimCaption(schoolName));
  const fill = escapeXml(color);
  const centerSize = initials.length > 2 ? 36 : 48;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <path id="school-seal-rim" d="M 160,160 m 0,-128 a 128,128 0 1,1 0,256 a 128,128 0 1,1 0,-256"/>
  </defs>
  <circle cx="160" cy="160" r="156" fill="#fff" fill-opacity="0.01"/>
  <circle cx="160" cy="160" r="152" fill="none" stroke="${fill}" stroke-width="6"/>
  <circle cx="160" cy="160" r="140" fill="none" stroke="${fill}" stroke-width="2.2"/>
  <circle cx="160" cy="160" r="92" fill="none" stroke="${fill}" stroke-width="1.6"/>
  <text fill="${fill}" font-family="Georgia, 'Times New Roman', Times, serif" font-size="14" font-weight="700" letter-spacing="2.2">
    <textPath href="#school-seal-rim" startOffset="0%">${rim}</textPath>
  </text>
  <text x="160" y="172" text-anchor="middle" fill="${fill}" font-family="Georgia, 'Times New Roman', Times, serif" font-size="${centerSize}" font-weight="700">${escapeXml(initials)}</text>
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

export function defaultSealDataUrl(schoolName: string, color?: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(defaultSealSvg(schoolName, color))}`;
}

export function defaultSignatureDataUrl(principalName: string, color?: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(defaultSignatureSvg(principalName, color))}`;
}

export function resolveSealDisplaySrc(
  schoolName: string,
  sealUrl?: string,
  color?: string,
): string {
  const custom = resolveMediaUrl(sealUrl) ?? (sealUrl?.trim() || undefined);
  return custom || defaultSealDataUrl(schoolName, color);
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
