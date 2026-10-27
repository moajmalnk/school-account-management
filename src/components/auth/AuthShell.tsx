import { Link } from "@tanstack/react-router";
import {
  FileBarChart2,
  Receipt,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { OrganicCard } from "@/components/ui/organic-card";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const FEATURES: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: "Student Management", icon: Users, tone: "bg-[#E6F7F1] text-[#0F766E]" },
  { label: "Fee Tracking", icon: Receipt, tone: "bg-[#F3E8FF] text-[#7C3AED]" },
  { label: "Reports & Analytics", icon: FileBarChart2, tone: "bg-[#EAF1FF] text-[#2563EB]" },
  { label: "Secure & Reliable", icon: ShieldCheck, tone: "bg-[#FFF3E8] text-[#EA580C]" },
];

function LegalNav({ className }: { className?: string }) {
  const linkClass = "inline whitespace-nowrap transition-colors hover:text-[#64748B]";
  return (
    <nav
      aria-label="Legal"
      className={cn(
        "flex w-full flex-nowrap items-center justify-center gap-x-2 text-[11.5px] leading-none text-[#94A3B8]",
        className,
      )}
    >
      <a href={BRAND.legal.termsPath} className={linkClass}>
        Terms
      </a>
      <span aria-hidden className="inline-block shrink-0 text-[#CBD5E1]">
        |
      </span>
      <a href={BRAND.legal.privacyPath} className={linkClass}>
        Privacy
      </a>
      <span aria-hidden className="inline-block shrink-0 text-[#CBD5E1]">
        |
      </span>
      <a href={BRAND.legal.refundPolicyPath} className={linkClass}>
        Refunds
      </a>
      <span aria-hidden className="inline-block shrink-0 text-[#CBD5E1]">
        |
      </span>
      <a href={BRAND.legal.dataDeletionPath} className={linkClass}>
        Data deletion
      </a>
    </nav>
  );
}

function LoginBrand({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 rounded-xl outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#0F766E]/30"
    >
      <img
        src={BRAND.mark}
        alt=""
        className={cn(
          "shrink-0 object-contain",
          size === "sm" ? "h-9 w-9" : "h-11 w-11 sm:h-12 sm:w-12",
        )}
      />
      <span className="min-w-0 leading-[1.05]">
        <span
          className={cn(
            "block font-bold tracking-tight text-[#0B1B33]",
            size === "sm" ? "text-[17px]" : "text-[20px] sm:text-[22px]",
          )}
          style={{ fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif' }}
        >
          Feezo
        </span>
        <span
          className={cn(
            "block font-semibold text-[#0F766E]",
            size === "sm" ? "text-[11px]" : "text-[12px] sm:text-[13px]",
          )}
        >
          Edu Books
        </span>
      </span>
    </Link>
  );
}

/** Four equal columns — icon centered above label, matching design row. */
function FeatureRow({ compact }: { compact?: boolean }) {
  return (
    <ul
      className={cn(
        "grid w-full",
        compact
          ? "mt-5 grid-cols-2 gap-x-4 gap-y-4"
          : "mt-7 max-w-[34rem] grid-cols-2 gap-4 sm:grid-cols-4",
      )}
    >
      {FEATURES.map(({ label, icon: Icon, tone }) => (
        <li key={label} className="flex min-w-0 flex-col items-center gap-2 text-center">
          <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", tone)}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
          <span
            className={cn(
              "w-full font-medium leading-snug text-[#475569]",
              compact ? "text-[11px] sm:text-[12px]" : "text-[11.5px] sm:text-[12px]",
            )}
          >
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function HeroBlock({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="relative mx-auto mt-4 w-full max-w-md px-1 sm:mt-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[6%] inset-y-[2%] -z-0 rounded-[50%] bg-[radial-gradient(ellipse_at_50%_55%,_#D8F3EA_0%,_#EAF9F4_45%,_transparent_72%)]"
        />
        <div
          className={cn(
            "relative z-[1] mx-auto aspect-[16/9] w-full max-h-[200px] overflow-hidden sm:max-h-[230px]",
            "[mask-image:radial-gradient(ellipse_80%_85%_at_50%_50%,#000_48%,transparent_100%),linear-gradient(#000_0%,#000_78%,transparent_100%)]",
            "[-webkit-mask-image:radial-gradient(ellipse_80%_85%_at_50%_50%,#000_48%,transparent_100%),linear-gradient(#000_0%,#000_78%,transparent_100%)]",
            "[mask-composite:intersect]",
            "[-webkit-mask-composite:source-in]",
          )}
        >
          <img
            src="/auth/login-hero.png?v=8"
            alt="Students collaborating on a laptop with school books and campus"
            className="pointer-events-none h-full w-full select-none object-cover object-[68%_42%]"
            width={1226}
            height={693}
            decoding="async"
            fetchPriority="low"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-8 w-full overflow-visible pt-2 lg:-mr-24 lg:mt-10 lg:pt-4 xl:-mr-32 xl:mt-12 xl:pt-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[6%] -z-0 rounded-[46%] bg-[radial-gradient(ellipse_at_55%_60%,_#D8F3EA_0%,_#E8F8F2_38%,_transparent_70%)] blur-[2px]"
      />
      <img
        src="/auth/login-hero.png?v=8"
        alt="Students collaborating on a laptop with school books and campus"
        className="pointer-events-none relative z-[1] h-auto w-full max-w-none origin-bottom-left select-none object-contain object-left-bottom drop-shadow-[0_18px_40px_rgba(15,80,60,0.08)] max-h-[300px] lg:max-h-[360px] lg:scale-[1.1] xl:max-h-[410px]"
        width={1226}
        height={693}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function WaveBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Keep center / hero zone lighter so the illustration glow blends */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_78%,_#F4FBF8_0%,_transparent_52%),radial-gradient(ellipse_at_92%_8%,_#DCF5EC_0%,_transparent_46%)]" />
      <div className="absolute -right-[12%] -top-[16%] h-[55%] w-[48%] rounded-[48%] bg-[#D8F5EC]/70" />
      <div className="absolute -bottom-[28%] -left-[16%] h-[62%] w-[60%] rounded-[50%] bg-[#D5F0E6]/50" />
      <div className="absolute bottom-[2%] left-[2%] h-[36%] w-[44%] rounded-[45%] bg-[#EEF9F4]/90 blur-lg" />
    </div>
  );
}

function WelcomeAccent() {
  return (
    <span
      className="absolute right-0 top-0 select-none text-[18px] font-semibold leading-none text-[#0F766E] sm:text-[20px]"
      style={{ fontFamily: '"Caveat", Georgia, cursive' }}
      aria-hidden
    >
      <svg
        className="absolute -right-3.5 -top-2.5 h-5 w-5 text-[#0F766E]/75"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M13 3.5l4.5-1.5M15.5 7.5H21M13.5 11.5l4 2.5" />
      </svg>
      Welcome Back!
    </span>
  );
}

function BrandPanel({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex min-h-0 w-full flex-col",
        compact ? "items-stretch gap-0 pb-1 pt-1" : "w-full max-w-[36rem] py-1",
      )}
    >
      <div className={cn("relative z-[1] w-full", compact && "mx-auto w-full max-w-md")}>
        <LoginBrand size={compact ? "sm" : "md"} />

        {/* Desktop: nudge copy below the logo without stretching the column */}
        <div className={cn(!compact && "mt-10 lg:mt-12")}>
          <h1
            className={cn(
              "font-bold tracking-tight text-[#0B1B33]",
              compact
                ? "mt-5 max-w-[18.5rem] text-[24px] leading-[1.2] sm:max-w-[22rem] sm:text-[28px]"
                : "max-w-[26rem] text-[30px] leading-[1.16] sm:text-[34px] xl:text-[38px]",
            )}
            style={{ fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif' }}
          >
            Simplifying <span className="text-[#0F766E]">School Management</span> Every Day
          </h1>
          <p
            className={cn(
              "mt-3 text-[#64748B]",
              compact
                ? "max-w-[20rem] text-[13.5px] leading-relaxed sm:max-w-md sm:text-[14px]"
                : "max-w-[28rem] text-[14.5px] leading-relaxed sm:text-[15px]",
            )}
          >
            Manage students, fees, accounts and more — all in one place.
          </p>

          <FeatureRow compact={compact} />
        </div>
      </div>

      <HeroBlock compact={compact} />
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  variant = "compact",
  welcomeAccent,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** `split` = marketing + form (login). `compact` = centered card (forgot/reset). */
  variant?: "split" | "compact";
  welcomeAccent?: boolean;
}) {
  if (variant === "compact") {
    return (
      <div className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#F3F5F7] px-4 py-[calc(1.25rem+env(safe-area-inset-top))] sm:py-16">
        <div className="w-full max-w-[400px]">
          <div className="mb-7 flex justify-center sm:mb-9">
            <Link
              to="/"
              className="rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#0F766E]/30"
            >
              <FeezoBrand
                subtitle="Unified Control"
                markClassName="h-10 w-10"
                className="text-left"
              />
            </Link>
          </div>

          <OrganicCard tone="white" cornerSide="tr" className="p-7 sm:p-8">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#0B1220] sm:text-[24px]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-black/50">{subtitle}</p>
            ) : null}
            {children}
          </OrganicCard>

          <LegalNav className="mt-7" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#F7FCFA]">
      <WaveBackdrop />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1180px] grid-cols-1 content-center gap-y-1 px-5 py-[calc(1rem+env(safe-area-inset-top))] sm:px-6 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-x-8 lg:gap-y-0 lg:px-10 lg:py-8 xl:grid-cols-[1.05fr_440px] xl:gap-x-12 xl:px-12">
        {/* Marketing — natural-height stack (avoids full-viewport stretch on tall screens) */}
        <div className="relative z-0 min-w-0 lg:pb-2">
          <div className="lg:hidden">
            <BrandPanel compact />
          </div>
          <div className="hidden lg:block">
            <BrandPanel />
          </div>
        </div>

        {/* Sign-in card + legal */}
        <div className="relative z-10 flex min-w-0 flex-col justify-center pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 lg:pb-0 lg:pt-0">
          <div className="mx-auto w-full max-w-[400px] sm:max-w-[420px] lg:max-w-none">
            <div className="w-full rounded-[24px] border border-[#EEF2F0] bg-white px-5 py-6 shadow-[0_24px_64px_-24px_rgba(15,50,40,0.28)] sm:rounded-[32px] sm:px-8 sm:py-8 lg:px-9 lg:py-9">
              <div className="relative pr-24 sm:pr-28">
                <h1
                  className="text-[24px] font-bold tracking-tight text-[#0B1B33] sm:text-[28px]"
                  style={{ fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif' }}
                >
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#64748B]">{subtitle}</p>
                ) : null}
                {welcomeAccent ? <WelcomeAccent /> : null}
              </div>
              {children}
            </div>

            <LegalNav className="mt-5 overflow-x-auto whitespace-nowrap text-center" />
          </div>
        </div>
      </div>
    </div>
  );
}
