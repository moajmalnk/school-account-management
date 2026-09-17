import {
  Check,
  Copy,
  FileDown,
  MoreHorizontal,
  RefreshCw,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { apiAiFeedback, type FeezoLocale, type FeezoNavigation, type FeezoUiBlock } from "@/lib/api/ai";
import { downloadFeezoAiPdf } from "@/lib/feezo-ai-pdf";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type Props = {
  locale: FeezoLocale;
  messageId: string;
  content: string;
  blocks?: FeezoUiBlock[];
  navigations?: FeezoNavigation[];
  model?: string;
  onRegenerate?: () => void;
  /** Always show the toolbar (e.g. latest reply). Others reveal on hover. */
  alwaysVisible?: boolean;
};

function blocksToPlain(blocks?: FeezoUiBlock[]): string {
  if (!blocks?.length) return "";
  const lines: string[] = [];
  for (const b of blocks) {
    if (b.type === "text" && b.text) lines.push(b.text);
    if (b.type === "cards") {
      for (const c of b.items) {
        lines.push([c.title, c.value, c.subtitle].filter(Boolean).join(" — "));
      }
    }
    if (b.type === "table") {
      if (b.title) lines.push(b.title);
      lines.push(b.columns.join(" | "));
      for (const row of b.rows) {
        lines.push(row.map((c) => (c == null ? "" : String(c))).join(" | "));
      }
    }
    if (b.type === "buttons") {
      lines.push(b.items.map((i) => i.label).join(" · "));
    }
  }
  return lines.join("\n");
}

function fullExportText(content: string, blocks?: FeezoUiBlock[], navigations?: FeezoNavigation[]) {
  const parts = [content.trim(), blocksToPlain(blocks)];
  if (navigations?.length) {
    parts.push(navigations.map((n) => n.label || n.to).join(" · "));
  }
  return parts.filter(Boolean).join("\n\n");
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

const actionBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-35";

export function FeezoMessageActions({
  locale,
  messageId,
  content,
  blocks,
  navigations,
  model,
  onRegenerate,
  alwaysVisible = false,
}: Props) {
  const { schoolDetails, activeBranch } = useTenantStore();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);

  const persistFeedback = async (next: "up" | "down" | null) => {
    if (feedbackBusy) return;
    const prev = feedback;
    setFeedback(next);
    setFeedbackBusy(true);
    try {
      await apiAiFeedback({
        messageId,
        rating: next,
        content: content.slice(0, 1000),
        locale,
        model,
      });
      if (next === "up") {
        toast.success(locale === "ml" ? "നന്ദി — ഫീഡ്‌ബാക്ക് രേഖപ്പെടുത്തി" : "Thanks — feedback saved");
      } else if (next === "down") {
        toast.message(locale === "ml" ? "ഫീഡ്‌ബാക്ക് രേഖപ്പെടുത്തി" : "Feedback noted");
      }
    } catch {
      setFeedback(prev);
      toast.error(locale === "ml" ? "ഫീഡ്‌ബാക്ക് സേവ് ചെയ്യാനായില്ല" : "Could not save feedback");
    } finally {
      setFeedbackBusy(false);
    }
  };

  const t = {
    copy: locale === "ml" ? "പകർത്തുക" : "Copy",
    copied: locale === "ml" ? "പകർത്തി" : "Copied",
    pdf: locale === "ml" ? "PDF ഡൗൺലോഡ്" : "Download PDF",
    like: locale === "ml" ? "നല്ല മറുപടി" : "Good response",
    dislike: locale === "ml" ? "മോശം മറുപടി" : "Bad response",
    regen: locale === "ml" ? "വീണ്ടും ജനറേറ്റ്" : "Regenerate",
    share: locale === "ml" ? "ഷെയർ" : "Share",
    more: locale === "ml" ? "കൂടുതൽ" : "More",
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const exportText = fullExportText(content, blocks, navigations);

  const handleCopy = () => {
    void copyText(exportText)
      .then(() => {
        setCopied(true);
        toast.success(t.copied);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => toast.error(locale === "ml" ? "പകർത്താൻ കഴിഞ്ഞില്ല" : "Could not copy"));
  };

  const handlePdf = () => {
    try {
      downloadFeezoAiPdf({
        locale,
        content,
        blocks,
        schoolName: schoolDetails.name,
        branchName: activeBranch?.name,
      });
      toast.success(locale === "ml" ? "PDF സേവ് ചെയ്തു" : "PDF downloaded");
    } catch {
      toast.error(locale === "ml" ? "PDF പരാജയപ്പെട്ടു" : "PDF download failed");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Feezo AI", text: exportText });
        return;
      }
      await copyText(exportText);
      toast.success(locale === "ml" ? "ഷെയർ ചെയ്യാൻ പകർത്തി" : "Copied for sharing");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(locale === "ml" ? "ഷെയർ പരാജയപ്പെട്ടു" : "Share failed");
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 transition-opacity duration-150",
        alwaysVisible
          ? "opacity-100"
          : "opacity-100 sm:opacity-0 sm:group-hover/msg:opacity-100 sm:group-focus-within/msg:opacity-100",
      )}
    >
      <button type="button" className={actionBtn} title={copied ? t.copied : t.copy} aria-label={t.copy} onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5 text-[#0F766E]" strokeWidth={2.25} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
      </button>

      <button type="button" className={actionBtn} title={t.pdf} aria-label={t.pdf} onClick={handlePdf}>
        <FileDown className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      <span className="mx-0.5 h-3.5 w-px bg-slate-200 dark:bg-zinc-700" aria-hidden />

      <button
        type="button"
        disabled={feedbackBusy}
        className={cn(actionBtn, feedback === "up" && "bg-[#0F766E]/10 text-[#0F766E] hover:bg-[#0F766E]/15 hover:text-[#0F766E]")}
        title={t.like}
        aria-label={t.like}
        aria-pressed={feedback === "up"}
        onClick={() => void persistFeedback(feedback === "up" ? null : "up")}
      >
        <ThumbsUp className={cn("h-3.5 w-3.5", feedback === "up" && "fill-current")} strokeWidth={2} />
      </button>

      <button
        type="button"
        disabled={feedbackBusy}
        className={cn(
          actionBtn,
          feedback === "down" && "bg-rose-50 text-rose-600 hover:bg-rose-50 hover:text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
        )}
        title={t.dislike}
        aria-label={t.dislike}
        aria-pressed={feedback === "down"}
        onClick={() => void persistFeedback(feedback === "down" ? null : "down")}
      >
        <ThumbsDown className={cn("h-3.5 w-3.5", feedback === "down" && "fill-current")} strokeWidth={2} />
      </button>

      {onRegenerate ? (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-200 dark:bg-zinc-700" aria-hidden />
          <button type="button" className={actionBtn} title={t.regen} aria-label={t.regen} onClick={onRegenerate}>
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </>
      ) : null}

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className={actionBtn}
          title={t.more}
          aria-label={t.more}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10 cursor-default"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div
              id={menuId}
              role="menu"
              className="absolute bottom-9 left-0 z-20 min-w-[11.5rem] overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-white/10 dark:bg-zinc-900 dark:ring-white/5"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => {
                  setMenuOpen(false);
                  handleCopy();
                }}
              >
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                {t.copy}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => {
                  setMenuOpen(false);
                  handlePdf();
                }}
              >
                <FileDown className="h-3.5 w-3.5 text-slate-400" />
                {t.pdf}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => {
                  setMenuOpen(false);
                  void handleShare();
                }}
              >
                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                {t.share}
              </button>
              {onRegenerate ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  onClick={() => {
                    setMenuOpen(false);
                    onRegenerate();
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  {t.regen}
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
