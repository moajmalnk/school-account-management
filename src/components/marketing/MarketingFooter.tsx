import { Link } from "@tanstack/react-router";
import type { MouseEvent, ReactNode } from "react";
import { Facebook, Github, Instagram, Linkedin, Twitter } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { FeezoMark } from "@/components/brand/FeezoBrand";
import { StoreBadge } from "@/components/marketing/StoreBadge";
import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { easeOutExpo, staggerContainer } from "@/components/marketing/motion";
import { BRAND } from "@/lib/brand";
import { MARKETING } from "@/lib/marketing-content";
import { handleMarketingSectionClick } from "@/lib/marketing-scroll";
import { cn } from "@/lib/utils";

const SOCIAL_LINKS = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Twitter", href: "#", icon: Twitter },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "Github", href: "#", icon: Github },
  { label: "LinkedIn", href: "#", icon: Linkedin },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy", to: "/privacy" as const },
  { label: "Data deletion", to: "/data-deletion" as const },
] as const;

const columnReveal = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: easeOutExpo },
  },
};

function FooterNavLink({
  href,
  children,
  onClick,
  className,
}: {
  href: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "group relative inline-flex w-fit items-center py-1 text-[14px] font-medium text-[var(--mkt-ink)]/80 transition-colors hover:text-[var(--mkt-green-deep)]",
        className,
      )}
    >
      <span className="relative">
        {children}
        <span
          className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--mkt-green)] transition-all duration-300 ease-out group-hover:w-full"
          aria-hidden
        />
      </span>
    </a>
  );
}

export function MarketingFooter() {
  const reduce = useReducedMotion();

  return (
    <footer
      className="relative overflow-hidden text-[var(--mkt-ink)]"
      style={{
        background:
          "linear-gradient(180deg, #f8fff4 0%, #ffffff 38%, #f4fbf0 100%)",
      }}
    >
      <motion.div
        className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-[var(--mkt-green)]/10 blur-3xl"
        animate={reduce ? undefined : { x: [0, 18, 0], y: [0, -12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[var(--mkt-green)]/8 blur-3xl"
        animate={reduce ? undefined : { x: [0, -14, 0], y: [0, 10, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <motion.div
          className="grid gap-12 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 lg:grid-cols-12 lg:gap-8 xl:gap-12"
          variants={staggerContainer}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-8% 0px", amount: 0.15 }}
        >
          {/* Brand */}
          <motion.div className="sm:col-span-2 lg:col-span-4" variants={columnReveal}>
            <Link
              to="/"
              className="inline-flex items-center gap-3 rounded-xl outline-offset-4 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              aria-label={`${BRAND.name} home`}
            >
              <FeezoMark className="h-11 w-11" />
              <div className="leading-tight">
                <div className="text-[20px] font-bold tracking-tight">
                  Fee<span className="text-[var(--mkt-green)]">zo</span>
                </div>
                <div className="text-[11px] font-semibold tracking-[0.14em] text-[var(--mkt-muted)] uppercase">
                  {BRAND.tagline}
                </div>
              </div>
            </Link>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-[var(--mkt-muted)]">
              School accounts simplified — fees, receipts, and reports in one clear platform.
            </p>
            <TrialSignupLink className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[var(--mkt-ink)] px-5 text-[13px] font-semibold text-white transition hover:bg-[var(--mkt-ink)]/90">
              Start free trial
            </TrialSignupLink>
          </motion.div>

          {/* Explore + Legal — always 2 columns on one row */}
          <motion.div
            className="grid grid-cols-2 gap-x-6 gap-y-0 sm:col-span-2 sm:gap-x-10 lg:col-span-4 lg:col-start-6 lg:gap-x-12"
            variants={columnReveal}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
                Explore
              </p>
              <nav className="mt-4 flex flex-col gap-2.5" aria-label="Footer navigation">
                {MARKETING.nav.map((item) => (
                  <FooterNavLink
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(event) => handleMarketingSectionClick(event, item.id)}
                    className={
                      item.id === "product"
                        ? "text-[var(--mkt-green)] hover:text-[var(--mkt-green-deep)]"
                        : undefined
                    }
                  >
                    {item.label}
                  </FooterNavLink>
                ))}
              </nav>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
                Legal
              </p>
              <nav className="mt-4 flex flex-col gap-2.5" aria-label="Legal">
                {LEGAL_LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group relative inline-flex w-fit py-1 text-[14px] font-medium text-[var(--mkt-ink)]/80 transition-colors hover:text-[var(--mkt-green-deep)]"
                  >
                    <span className="relative">
                      {item.label}
                      <span
                        className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--mkt-green)] transition-all duration-300 ease-out group-hover:w-full"
                        aria-hidden
                      />
                    </span>
                  </Link>
                ))}
                <a
                  href={`mailto:${BRAND.legal.supportEmail}`}
                  className="group relative inline-flex w-fit break-all py-1 text-[13px] font-medium text-[var(--mkt-ink)]/80 transition-colors hover:text-[var(--mkt-green-deep)] sm:text-[14px]"
                >
                  <span className="relative">
                    {BRAND.legal.supportEmail}
                    <span
                      className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--mkt-green)] transition-all duration-300 ease-out group-hover:w-full"
                      aria-hidden
                    />
                  </span>
                </a>
              </nav>
            </div>
          </motion.div>

          {/* App downloads */}
          <motion.div className="lg:col-span-3 lg:col-start-10 sm:col-span-2" variants={columnReveal}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
              Get the app
            </p>
            <p className="mt-3 max-w-[280px] text-[13px] leading-relaxed text-[var(--mkt-muted)] sm:max-w-none">
              Manage fees and accounts on the go — same workspace, mobile-ready.
            </p>
            <div className="mt-5 flex flex-row items-stretch gap-2.5 sm:gap-3">
              <StoreBadge variant="play" reduce={reduce} className="w-auto min-w-0 flex-1" />
              <StoreBadge variant="apple" reduce={reduce} className="w-auto min-w-0 flex-1" />
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className="mt-14 flex flex-col items-center justify-between gap-6 pt-8 sm:flex-row sm:gap-4"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.55, ease: easeOutExpo, delay: 0.12 }}
        >
          <p className="text-center text-[12px] font-medium text-[var(--mkt-muted)] sm:text-left">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social, index) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-[var(--mkt-muted)] shadow-[0_4px_16px_rgba(26,28,44,0.08)] transition-colors hover:text-[var(--mkt-green-deep)]"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 + index * 0.04, duration: 0.4, ease: easeOutExpo }}
                  whileHover={reduce ? undefined : { y: -2, scale: 1.06 }}
                  whileTap={reduce ? undefined : { scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
