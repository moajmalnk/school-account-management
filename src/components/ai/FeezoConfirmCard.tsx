import { Check, Loader2, X } from "lucide-react";

import type { FeezoPendingAction } from "@/lib/api/ai";
import { cn, glassInsetClass } from "@/lib/utils";

type Props = {
  action: FeezoPendingAction;
  locale: "en" | "ml";
  confirming: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function FeezoConfirmCard({ action, locale, confirming, onConfirm, onDismiss }: Props) {
  if (action.status === "confirmed") {
    return (
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
        {locale === "ml" ? "സ്ഥിരീകരിച്ചു" : "Confirmed"} — {action.summary}
      </div>
    );
  }
  if (action.status === "dismissed") {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400">
        {locale === "ml" ? "റദ്ദാക്കി" : "Cancelled"} — {action.summary}
      </div>
    );
  }

  return (
    <div
      className={cn(
        glassInsetClass,
        "space-y-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3 dark:border-amber-900/40 dark:bg-amber-950/30",
      )}
    >
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          {locale === "ml" ? "സ്ഥിരീകരണം ആവശ്യമാണ്" : "Verification required"}
        </div>
        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100">{action.summary}</p>
        <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-white/70 p-2 text-[10px] text-slate-600 dark:bg-zinc-950/50 dark:text-zinc-400">
          {JSON.stringify(action.payload, null, 2)}
        </pre>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={confirming}
          onClick={onConfirm}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d6a63] disabled:opacity-60"
        >
          {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {locale === "ml" ? "സ്ഥിരീകരിച്ച് ചെയ്യുക" : "Verify & Confirm"}
        </button>
        <button
          type="button"
          disabled={confirming}
          onClick={onDismiss}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
          {locale === "ml" ? "റദ്ദാക്കുക" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
