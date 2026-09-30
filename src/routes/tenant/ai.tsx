import { createFileRoute, redirect } from "@tanstack/react-router";

import { FEEZO_OPEN_PARAM } from "@/lib/feezo-ai-bridge";

type AiSearch = {
  /** Full return path incl. query, e.g. /tenant/finance?tab=fees */
  from?: string;
};

function optionalFrom(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t.startsWith("/tenant")) return undefined;
  // Block nested ai loops
  if (t === "/tenant/ai" || t.startsWith("/tenant/ai?")) return undefined;
  return t;
}

/** Legacy URL: opens the Feezo panel over the `from` page (or the dashboard). */
export const Route = createFileRoute("/tenant/ai")({
  validateSearch: (search: Record<string, unknown>): AiSearch => ({
    from: optionalFrom(search.from),
  }),
  beforeLoad: ({ search }) => {
    const base = search.from ?? "/tenant/dashboard";
    const sep = base.includes("?") ? "&" : "?";
    throw redirect({ href: `${base}${sep}${FEEZO_OPEN_PARAM}=1`, replace: true });
  },
});
