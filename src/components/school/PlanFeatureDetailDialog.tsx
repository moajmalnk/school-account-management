import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, Check, Lock } from "lucide-react";

import { HelpFlowchart } from "@/components/help/HelpFlowchart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseHelpHref } from "@/lib/help/access";
import type { PlanFlags } from "@/lib/permissions";
import { getPlanFeatureDetail } from "@/lib/subscription-feature-details";
import { cn } from "@/lib/utils";

type PlanFeatureDetailDialogProps = {
  featureKey: keyof PlanFlags | null;
  featureLabel: string;
  included: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PlanFeatureDetailDialog({
  featureKey,
  featureLabel,
  included,
  open,
  onOpenChange,
}: PlanFeatureDetailDialogProps) {
  const navigate = useNavigate();
  const detail = featureKey ? getPlanFeatureDetail(featureKey) : null;

  const openHref = (href: string) => {
    const { to, search } = parseHelpHref(href);
    onOpenChange(false);
    void navigate({ to: to as "/tenant/dashboard", search } as never);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,840px)] w-[calc(100%-1.25rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-[22px] border border-[#E5E5E5] bg-white p-0 dark:border-white/10 dark:bg-zinc-950 sm:max-w-2xl">
        {detail ? (
          <>
            <DialogHeader className="shrink-0 space-y-0 border-b border-[#F0F0F0] px-5 py-5 text-left sm:px-6 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl",
                    included
                      ? "bg-[#0F766E] text-white"
                      : "bg-[#F4F4F5] text-black/40 ring-1 ring-[#E5E5E5] dark:bg-zinc-800 dark:text-zinc-400 dark:ring-white/10",
                  )}
                >
                  {included ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                  ) : (
                    <Lock className="h-3.5 w-3.5" strokeWidth={2.25} />
                  )}
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
                    included
                      ? "bg-[#CCFBF1] text-[#0F766E]"
                      : "bg-[#F4F4F5] text-black/45 dark:bg-zinc-800 dark:text-zinc-400",
                  )}
                >
                  {included ? "Included on your plan" : "Locked · upgrade to unlock"}
                </span>
              </div>
              <DialogTitle className="mt-3 text-[20px] font-semibold tracking-tight text-black dark:text-zinc-50">
                {featureLabel}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-[13.5px] leading-relaxed text-black/55 dark:text-zinc-400">
                {detail.summary}
              </DialogDescription>
            </DialogHeader>

            <div className="mobile-scrollbar-none min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
              <section className="space-y-3">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-black/40 dark:text-zinc-500">
                  How it flows
                </h3>
                <HelpFlowchart title={detail.flowTitle} mermaid={detail.mermaid} />
                <ol className="space-y-2.5">
                  {detail.steps.map((step, index) => (
                    <li
                      key={step.title}
                      className="flex gap-3 rounded-xl bg-[#FAFAFA] px-3.5 py-3 dark:bg-white/[0.03]"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#0F766E]/10 text-[11px] font-semibold tabular-nums text-[#0F766E] dark:bg-[#0F766E]/20 dark:text-[#5EEAD4]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold tracking-tight text-black dark:text-zinc-50">
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-black/55 dark:text-zinc-400">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {detail.images.length > 0 ? (
                <section className="space-y-3">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-black/40 dark:text-zinc-500">
                    In the product
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {detail.images.map((image) => (
                      <figure
                        key={image.src + image.caption}
                        className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#F8FAFA] dark:border-white/10 dark:bg-zinc-900"
                      >
                        <div className="aspect-[16/10] overflow-hidden bg-[#EEF6F5] dark:bg-zinc-800">
                          <img
                            src={image.src}
                            alt={image.caption}
                            className="h-full w-full object-cover object-top"
                            loading="lazy"
                          />
                        </div>
                        <figcaption className="px-3 py-2.5 text-[12px] leading-snug text-black/55 dark:text-zinc-400">
                          {image.caption}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              ) : null}

              {detail.references.length > 0 ? (
                <section className="space-y-3">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-black/40 dark:text-zinc-500">
                    References
                  </h3>
                  <ul className="overflow-hidden rounded-2xl border border-[#E5E5E5] dark:border-white/10">
                    {detail.references.map((ref) => (
                      <li
                        key={ref.label + ref.href}
                        className="border-b border-[#F0F0F0] last:border-b-0 dark:border-white/10"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]"
                          onClick={() => openHref(ref.href)}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#F0FDFA] text-[#0F766E] dark:bg-[#0F766E]/20 dark:text-[#5EEAD4]">
                            <BookOpen className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-black dark:text-zinc-50">
                              {ref.label}
                            </span>
                            <span className="mt-0.5 block truncate text-[11.5px] text-black/40 dark:text-zinc-500">
                              {ref.guideId ? `Help · ${ref.guideId}` : ref.href}
                            </span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-black/30 dark:text-zinc-600" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-[#F0F0F0] px-5 py-3.5 sm:px-6 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-xl border-[#E5E5E5] text-[13px] font-medium dark:border-white/10"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
