import type { CSSProperties } from "react";

/** Shared marketing CSS variables (also applied to portaled mobile menu). */
export const MARKETING_THEME_VARS = {
  // AA on white (≥4.5:1). Bright lime #8FCA4A is brand-only for fills/glows, not text.
  "--mkt-green": "#3F7A1F",
  "--mkt-green-deep": "#2F5F16",
  "--mkt-green-bright": "#8FCA4A",
  "--mkt-ink": "#1A1C2C",
  "--mkt-muted": "rgba(26, 28, 44, 0.72)",
  "--mkt-line": "rgba(26, 28, 44, 0.1)",
  "--mkt-soft": "#F4FBF0",
  "--mkt-glass": "rgba(255,255,255,0.72)",
  "--mkt-glass-border": "rgba(63,122,31,0.22)",
} as CSSProperties;
