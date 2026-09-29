import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink,
  Lightbulb,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { VideoSlot } from "@/components/help/VideoSlot";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BRAND } from "@/lib/brand";
import { parseHelpHref } from "@/lib/help/access";
import { HELP_CATEGORIES, HELP_VIDEOS, type HelpGuide } from "@/lib/help/guides";
import { cn } from "@/lib/utils";

const FEEDBACK_KEY = "feezo_help_feedback_v1";

type Feedback = "up" | "down";

function readFeedback(): Record<string, Feedback> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FEEDBACK_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, Feedback>) : {};
  } catch {
    return {};
  }
}

export function GuideView({
  guide,
  related,
  onOpenChange,
  onOpenGuide,
}: {
  guide: HelpGuide | null;
  related: HelpGuide[];
  onOpenChange: (open: boolean) => void;
  onOpenGuide: (guideId: string) => void;
}) {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback | undefined>();

  useEffect(() => {
    setFeedback(guide ? readFeedback()[guide.id] : undefined);
  }, [guide]);

  const vote = (value: Feedback) => {
    if (!guide) return;
    setFeedback(value);
    try {
      window.localStorage.setItem(
        FEEDBACK_KEY,
        JSON.stringify({ ...readFeedback(), [guide.id]: value }),
      );
    } catch {
      /* storage unavailable */
    }
  };

  const openScreen = () => {
    if (!guide?.openTo) return;
    const { to, search } = parseHelpHref(guide.openTo.href);
    void navigate({ to: to as "/tenant/dashboard", search } as never);
  };

  const category = guide ? HELP_CATEGORIES.find((c) => c.id === guide.category) : undefined;

  return (
    <Sheet open={Boolean(guide)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        {guide && (
          <>
            <header className="shrink-0 border-b border-slate-200/80 px-5 pb-4 pt-5 pr-14 dark:border-white/10 sm:px-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#0F766E] dark:text-[#2DD4BF]">
                {category?.title}
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] normal-case tracking-normal text-slate-500 dark:bg-white/10 dark:text-zinc-400">
                  <Clock className="h-3 w-3" />
                  {guide.minutes} min
                </span>
              </div>
              <SheetTitle className="mt-1.5 text-[20px] font-bold leading-tight tracking-tight text-slate-900 dark:text-zinc-50">
                {guide.title}
              </SheetTitle>
              <p className="mt-1 text-[13px] leading-snug text-slate-500 dark:text-zinc-400">
                {guide.summary}
              </p>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              <VideoSlot videoId={HELP_VIDEOS[guide.id]} title={guide.title} />

              {guide.warning && (
                <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12.5px] leading-snug text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{guide.warning}</span>
                </div>
              )}

              <ol className="space-y-5">
                {guide.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0F766E] font-mono text-[12px] font-bold text-white dark:bg-teal-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <h3 className="pt-0.5 text-[14px] font-semibold text-slate-900 dark:text-zinc-50">
                        {step.title}
                      </h3>
                      <p className="text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">
                        {step.body}
                      </p>
                      {step.image && (
                        <a
                          href={step.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-900"
                          aria-label={`Open screenshot for ${step.title} in a new tab`}
                        >
                          <img
                            src={step.image}
                            alt={`Screenshot: ${step.title}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full"
                          />
                        </a>
                      )}
                      {step.tip && (
                        <div className="flex gap-2 rounded-lg bg-[#F0FDFA] px-3 py-2 text-[12px] leading-snug text-[#115E59] dark:bg-teal-950/35 dark:text-teal-200">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span>{step.tip}</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {guide.id === "mobile-app" && (
                <div className="flex flex-wrap gap-2">
                  {[
                    { href: BRAND.playStoreUrl, label: "Get it on Google Play" },
                    { href: BRAND.appStoreUrl, label: "Download on the App Store" },
                  ].map((store) => (
                    <a
                      key={store.href}
                      href={store.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-[12.5px] font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      {store.label}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              )}

              {related.length > 0 && (
                <section>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Related guides
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {related.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onOpenGuide(r.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-[#2DD4BF]"
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4 text-[12px] text-slate-500 dark:border-white/10 dark:text-zinc-400">
                <span className="mr-1">
                  {feedback ? "Thanks for the feedback." : "Was this helpful?"}
                </span>
                {(
                  [
                    { value: "up", icon: ThumbsUp, label: "Yes" },
                    { value: "down", icon: ThumbsDown, label: "No" },
                  ] as const
                ).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => vote(value)}
                    aria-pressed={feedback === value}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-full border px-3 font-semibold transition-colors",
                      feedback === value
                        ? "border-[#0F766E] bg-[#0F766E] text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
                {feedback === "down" && (
                  <span className="basis-full pt-1">
                    Still stuck? Use the contact options at the bottom of the Support page.
                  </span>
                )}
              </section>
            </div>

            {guide.openTo && (
              <footer className="shrink-0 border-t border-slate-200/80 bg-white/80 px-5 py-3.5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/80 sm:px-6">
                <button
                  type="button"
                  onClick={openScreen}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0F766E] px-5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-10px_rgba(15,118,110,0.45)] transition-colors hover:bg-[#0D9488]"
                >
                  {guide.openTo.label}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </footer>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
