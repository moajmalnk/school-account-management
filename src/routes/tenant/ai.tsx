import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

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

export const Route = createFileRoute("/tenant/ai")({
  validateSearch: (search: Record<string, unknown>): AiSearch => ({
    from: optionalFrom(search.from),
  }),
  component: TenantAiPage,
});

/** Background surface while Feezo panel is open at /tenant/ai (survives refresh). */
function TenantAiPage() {
  return (
    <div className="mx-auto flex min-h-[min(60vh,520px)] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white shadow-lg shadow-teal-900/20">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
        Feezo AI
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
        Ask about school data, open reports, or propose changes — nothing saves until you verify.
      </p>
    </div>
  );
}
