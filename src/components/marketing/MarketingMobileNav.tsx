import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Grid3x3,
  LayoutDashboard,
  Settings2,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { MARKETING } from "@/lib/marketing-content";
import { handleMarketingSectionClick, preloadMarketingSections } from "@/lib/marketing-scroll";
import { cn } from "@/lib/utils";

const NAV_META: Record<
  (typeof MARKETING.nav)[number]["id"],
  { icon: typeof Sparkles; hint: string }
> = {
  problems: { icon: Sparkles, hint: "Stop chasing paper registers" },
  product: { icon: LayoutDashboard, hint: "Dashboard, students & fees" },
  features: { icon: Grid3x3, hint: "Everything in one workspace" },
  setup: { icon: Settings2, hint: "Live in minutes, not weeks" },
  pricing: { icon: Tag, hint: "14-day free trial included" },
};

function MenuToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="marketing-mobile-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      className="relative grid h-11 w-11 place-items-center rounded-xl border border-[var(--mkt-line)] bg-white/80 shadow-sm backdrop-blur-sm transition-colors hover:border-[var(--mkt-green)]/40 hover:bg-[var(--mkt-soft)] active:scale-95"
    >
      <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      <span className="relative flex h-4 w-5 flex-col justify-between">
        <motion.span
          className="block h-0.5 w-full origin-center rounded-full bg-[var(--mkt-ink)]"
          animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          className="block h-0.5 w-full rounded-full bg-[var(--mkt-ink)]"
          animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.15 }}
        />
        <motion.span
          className="block h-0.5 w-full origin-center rounded-full bg-[var(--mkt-ink)]"
          animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
    </button>
  );
}

export function MarketingMobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    preloadMarketingSections();
    setOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) close();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [close]);

  return (
    <div className="lg:hidden">
      <MenuToggle open={open} onClick={() => (open ? close() : openMenu())} />

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <>
                  <motion.button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-[110] bg-[#1A1C2C]/45 backdrop-blur-[6px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={close}
                  />

                  <motion.div
                    id="marketing-mobile-menu"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site navigation"
                    className="fixed inset-y-0 right-0 z-[120] flex w-[min(100vw,22rem)] flex-col overflow-hidden shadow-2xl"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background:
                        "linear-gradient(165deg, #ffffff 0%, #f8fff4 42%, #f4fbf0 100%)",
                    }}
                  >
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-70"
                style={{
                  background:
                    "radial-gradient(circle, rgba(143,202,74,0.35) 0%, transparent 68%)",
                }}
              />
              <div
                className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full opacity-50"
                style={{
                  background:
                    "radial-gradient(circle, rgba(107,168,50,0.22) 0%, transparent 70%)",
                }}
              />

              <div className="relative flex items-center justify-between border-b border-[var(--mkt-line)] px-5 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--mkt-muted)]">
                    Navigate
                  </p>
                  <p className="text-[15px] font-semibold text-[var(--mkt-ink)]">
                    Explore Feezo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[var(--mkt-line)] bg-white text-[var(--mkt-ink)] shadow-sm transition hover:border-[var(--mkt-green)]/40 hover:text-[var(--mkt-green)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="relative flex-1 overflow-y-auto px-3 py-4" aria-label="Page sections">
                <ul className="space-y-2">
                  {MARKETING.nav.map((item, index) => {
                    const meta = NAV_META[item.id];
                    const Icon = meta.icon;
                    return (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.06 + index * 0.05,
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <a
                          href={`#${item.id}`}
                          onClick={(event) => handleMarketingSectionClick(event, item.id, close)}
                          className={cn(
                            "group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200",
                            "border-transparent bg-white/55 hover:border-[var(--mkt-green)]/30 hover:bg-white hover:shadow-[0_8px_24px_rgba(143,202,74,0.14)]",
                            item.id === "product" &&
                              "border-[var(--mkt-green)]/25 bg-[var(--mkt-soft)]/80",
                          )}
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)] transition group-hover:scale-105 group-hover:bg-[var(--mkt-green)] group-hover:text-white">
                            <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-semibold text-[var(--mkt-ink)]">
                              {item.label}
                            </span>
                            <span className="block truncate text-[12px] text-[var(--mkt-muted)]">
                              {meta.hint}
                            </span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-[var(--mkt-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--mkt-green)]" />
                        </a>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              <motion.div
                className="relative border-t border-[var(--mkt-line)] bg-white/70 px-5 py-5 backdrop-blur-sm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.35 }}
              >
                <TrialSignupLink
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--mkt-green)] text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(143,202,74,0.35)] transition hover:bg-[var(--mkt-green-deep)] active:scale-[0.98]"
                  onClick={() => {
                    document.body.style.overflow = "";
                    close();
                  }}
                >
                  Start 14-day trial
                  <ArrowRight className="h-4 w-4" />
                </TrialSignupLink>
                <Link
                  to="/login"
                  onClick={() => {
                    document.body.style.overflow = "";
                    close();
                  }}
                  className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-[var(--mkt-line)] bg-white text-[14px] font-semibold text-[var(--mkt-ink)] transition hover:border-[var(--mkt-green)]/40 hover:text-[var(--mkt-green-deep)]"
                >
                  Sign in
                </Link>
              </motion.div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
