import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Home, LogIn, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { MARKETING_THEME_VARS } from "@/components/marketing/marketing-theme";
import { MARKETING } from "@/lib/marketing-content";
import { handleMarketingSectionClick, preloadMarketingSections } from "@/lib/marketing-scroll";
import { LEGAL_PAGES, type LegalPageId } from "@/lib/legal-pages";
import { cn } from "@/lib/utils";

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
      aria-controls="legal-mobile-menu"
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

export function LegalMobileNav({ activePage }: { activePage?: LegalPageId }) {
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

  return (
    <>
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
                    id="legal-mobile-menu"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site menu"
                    className="fixed inset-y-0 right-0 z-[120] flex w-[min(100vw,22rem)] flex-col overflow-hidden shadow-2xl"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      ...MARKETING_THEME_VARS,
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

                    <div className="relative flex items-center justify-between border-b border-[var(--mkt-line)] px-5 py-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--mkt-muted)]">
                          Menu
                        </p>
                        <p className="text-[15px] font-semibold text-[var(--mkt-ink)]">
                          Feezo
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

                    <nav className="relative flex-1 overflow-y-auto px-3 py-4" aria-label="Site menu">
                      <p className="px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
                        Site
                      </p>
                      <ul className="mt-2 space-y-1">
                        <li>
                          <Link
                            to="/home"
                            onClick={close}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold text-[var(--mkt-ink)] transition hover:bg-white hover:shadow-sm"
                          >
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]">
                              <Home className="h-[18px] w-[18px]" strokeWidth={2.2} />
                            </span>
                            Home page
                          </Link>
                        </li>
                      </ul>

                      <p className="mt-5 px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
                        Legal
                      </p>
                      <ul className="mt-2 space-y-1">
                        {LEGAL_PAGES.map((page) => {
                          const isActive = activePage === page.id;
                          return (
                            <li key={page.id}>
                              <a
                                href={page.path}
                                onClick={close}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                  "flex items-center gap-3 rounded-2xl px-4 py-3 transition",
                                  isActive
                                    ? "bg-[var(--mkt-soft)]/80 text-[var(--mkt-green-deep)]"
                                    : "text-[var(--mkt-ink)] hover:bg-white hover:shadow-sm",
                                )}
                              >
                                <span
                                  className={cn(
                                    "grid h-10 w-10 place-items-center rounded-xl",
                                    isActive
                                      ? "bg-[var(--mkt-green)] text-white"
                                      : "bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]",
                                  )}
                                >
                                  <FileText className="h-[18px] w-[18px]" strokeWidth={2.2} />
                                </span>
                                <span className="text-[15px] font-semibold">{page.label}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>

                      <p className="mt-5 px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
                        Explore
                      </p>
                      <ul className="mt-2 space-y-1">
                        {MARKETING.nav.map((item) => (
                          <li key={item.id}>
                            <a
                              href={`/#${item.id}`}
                              onClick={(event) => {
                                handleMarketingSectionClick(event, item.id, close);
                              }}
                              className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-[14px] font-medium text-[var(--mkt-ink)] transition hover:bg-white hover:shadow-sm"
                            >
                              {item.label}
                              <ArrowRight className="h-3.5 w-3.5 text-[var(--mkt-muted)]" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>

                    <div className="relative border-t border-[var(--mkt-line)] bg-white/70 px-5 py-5 backdrop-blur-sm">
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
                        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--mkt-line)] bg-white text-[14px] font-semibold text-[var(--mkt-ink)] transition hover:border-[var(--mkt-green)]/40 hover:text-[var(--mkt-green-deep)]"
                      >
                        <LogIn className="h-4 w-4" aria-hidden />
                        Sign in
                      </Link>
                    </div>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
