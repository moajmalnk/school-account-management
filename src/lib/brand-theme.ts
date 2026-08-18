/** School look — colors, type, icons, and menus from Settings → System. */

export const DEFAULT_BRAND_PRIMARY = "#0F766E";
export const DEFAULT_BRAND_SECONDARY = "#0D9488";
export const DEFAULT_FONT_COLOR = "#0F172A";

export const FONT_FAMILY_OPTIONS = ["Inter", "Georgia", "Palatino", "Arial", "System"] as const;
export type FontFamilyOption = (typeof FONT_FAMILY_OPTIONS)[number];

export const FONT_SIZE_OPTIONS = ["Small", "Medium", "Large"] as const;
export type FontSizeOption = (typeof FONT_SIZE_OPTIONS)[number];

const FONT_STACK: Record<FontFamilyOption, string> = {
  Inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
  Georgia: 'Georgia, "Times New Roman", Times, serif',
  Palatino: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
  Arial: "Arial, Helvetica, sans-serif",
  System: "ui-sans-serif, system-ui, sans-serif",
};

const FONT_SIZE_PX: Record<FontSizeOption, string> = {
  Small: "14px",
  Medium: "16px",
  Large: "18px",
};

export type BrandPalette = {
  primary: string;
  secondary: string;
  fontFamily: FontFamilyOption;
  fontColor: string;
  fontSize: FontSizeOption;
  iconColor: string;
  menuColor: string;
  pdfFont: "helvetica" | "times";
  primaryRgb: [number, number, number];
  secondaryRgb: [number, number, number];
  darkRgb: [number, number, number];
  mutedRgb: [number, number, number];
  softRgb: [number, number, number];
};

export type BrandLookInput = {
  primary: string;
  secondary: string;
  fontFamily?: string;
  fontColor?: string;
  fontSize?: string;
  iconColor?: string;
  menuColor?: string;
};

export const BRAND_PRESETS: { name: string; primary: string; secondary: string }[] = [
  { name: "Teal", primary: "#0F766E", secondary: "#0D9488" },
  { name: "Navy", primary: "#1E3A5F", secondary: "#C9A227" },
  { name: "Maroon", primary: "#7F1D1D", secondary: "#B45309" },
  { name: "Forest", primary: "#166534", secondary: "#4ADE80" },
  { name: "Indigo", primary: "#3730A3", secondary: "#818CF8" },
];

const CSS_VARS = [
  "--school-primary",
  "--school-secondary",
  "--school-primary-dark",
  "--school-primary-muted",
  "--school-primary-soft",
  "--school-primary-ring",
  "--school-font-stack",
  "--school-font-size",
  "--school-font",
  "--school-icon",
  "--school-menu",
  "--school-menu-fg",
  "--primary",
  "--ring",
  "--sidebar-primary",
  "--sidebar-ring",
  "--chart-1",
  "--accent",
  "--accent-foreground",
  "--foreground",
  "--color-lime",
  "--color-lime-pale",
] as const;

let activeBrand: BrandPalette = lookFromInput({
  primary: DEFAULT_BRAND_PRIMARY,
  secondary: DEFAULT_BRAND_SECONDARY,
});

export function getActiveBrandPalette(): BrandPalette {
  return activeBrand;
}

export function normalizeHexColor(value: unknown, fallback = DEFAULT_BRAND_PRIMARY): string {
  if (typeof value !== "string") return fallback;
  let v = value.trim();
  if (!v) return fallback;
  if (v[0] !== "#") v = `#${v}`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return fallback;
  return v.toUpperCase();
}

export function normalizeFontFamily(value: unknown): FontFamilyOption {
  if (typeof value === "string" && (FONT_FAMILY_OPTIONS as readonly string[]).includes(value)) {
    return value as FontFamilyOption;
  }
  return "Inter";
}

export function normalizeFontSize(value: unknown): FontSizeOption {
  if (typeof value === "string" && (FONT_SIZE_OPTIONS as readonly string[]).includes(value)) {
    return value as FontSizeOption;
  }
  return "Medium";
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(normalizeHexColor(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function contrastOn(bg: string): string {
  const [r, g, b] = hexToRgb(bg);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#0F172A" : "#FFFFFF";
}

export function lookFromInput(input: BrandLookInput): BrandPalette {
  const primary = normalizeHexColor(input.primary, DEFAULT_BRAND_PRIMARY);
  const secondary = normalizeHexColor(input.secondary, DEFAULT_BRAND_SECONDARY);
  const fontFamily = normalizeFontFamily(input.fontFamily);
  const fontColor = normalizeHexColor(input.fontColor, DEFAULT_FONT_COLOR);
  const fontSize = normalizeFontSize(input.fontSize);
  const iconColor = normalizeHexColor(input.iconColor, primary);
  const menuColor = normalizeHexColor(input.menuColor, primary);
  const primaryRgb = hexToRgb(primary);
  const secondaryRgb = hexToRgb(secondary);
  return {
    primary,
    secondary,
    fontFamily,
    fontColor,
    fontSize,
    iconColor,
    menuColor,
    pdfFont: fontFamily === "Georgia" || fontFamily === "Palatino" ? "times" : "helvetica",
    primaryRgb,
    secondaryRgb,
    darkRgb: mixRgb(primaryRgb, [0, 0, 0], 0.22),
    mutedRgb: mixRgb(primaryRgb, [255, 255, 255], 0.82),
    softRgb: mixRgb(primaryRgb, [255, 255, 255], 0.92),
  };
}

/** Paint CSS variables so the workspace, invoices, and bills follow the school look. */
export function applyWorkspaceBrand(input: BrandLookInput): BrandPalette {
  const palette = lookFromInput(input);
  activeBrand = palette;
  if (typeof document === "undefined") return palette;

  const root = document.documentElement;
  root.classList.add("school-brand");
  const muted = rgbToHex(palette.mutedRgb);
  const soft = rgbToHex(palette.softRgb);
  const dark = rgbToHex(palette.darkRgb);
  const ring = rgbToHex(mixRgb(palette.primaryRgb, [255, 255, 255], 0.55));

  root.style.setProperty("--school-primary", palette.primary);
  root.style.setProperty("--school-secondary", palette.secondary);
  root.style.setProperty("--school-primary-dark", dark);
  root.style.setProperty("--school-primary-muted", muted);
  root.style.setProperty("--school-primary-soft", soft);
  root.style.setProperty("--school-primary-ring", ring);
  root.style.setProperty("--school-font-stack", FONT_STACK[palette.fontFamily]);
  root.style.setProperty("--school-font-size", FONT_SIZE_PX[palette.fontSize]);
  root.style.setProperty("--school-font", palette.fontColor);
  root.style.setProperty("--school-icon", palette.iconColor);
  root.style.setProperty("--school-menu", palette.menuColor);
  root.style.setProperty("--school-menu-fg", contrastOn(palette.menuColor));
  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--ring", palette.primary);
  root.style.setProperty("--sidebar-primary", palette.primary);
  root.style.setProperty("--sidebar-ring", palette.primary);
  root.style.setProperty("--chart-1", palette.primary);
  root.style.setProperty("--accent", muted);
  root.style.setProperty("--accent-foreground", palette.primary);
  root.style.setProperty("--color-lime", palette.primary);
  root.style.setProperty("--color-lime-pale", soft);
  if (root.classList.contains("dark")) {
    root.style.removeProperty("--foreground");
  } else {
    root.style.setProperty("--foreground", palette.fontColor);
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && !root.classList.contains("dark")) {
    meta.setAttribute("content", palette.primary);
  }
  return palette;
}

export function clearWorkspaceBrand(): void {
  activeBrand = lookFromInput({
    primary: DEFAULT_BRAND_PRIMARY,
    secondary: DEFAULT_BRAND_SECONDARY,
  });
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("school-brand");
  CSS_VARS.forEach((name) => root.style.removeProperty(name));
}

export function pdfFontName(): "helvetica" | "times" {
  return getActiveBrandPalette().pdfFont;
}
