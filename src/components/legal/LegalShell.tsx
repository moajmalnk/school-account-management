import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { BRAND } from "@/lib/brand";

export function LegalShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#F4F6F9] px-4 py-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex flex-col items-start gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-3 rounded-xl border border-white/70 bg-white/80 px-3 py-2.5 shadow-[0_14px_44px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-opacity hover:opacity-90"
          >
            <FeezoBrand
              subtitle="Unified Control"
              markClassName="h-10 w-10"
              className="text-left"
            />
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-medium text-black/55">
            <a href={BRAND.legal.privacyPath} className="hover:text-black hover:underline">
              Privacy Policy
            </a>
            <a href={BRAND.legal.dataDeletionPath} className="hover:text-black hover:underline">
              Data deletion
            </a>
            <Link to="/login" className="hover:text-black hover:underline">
              Sign in
            </Link>
          </nav>
        </div>

        <article className="rounded-[28px] border border-white/80 bg-white px-5 py-7 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)] sm:px-8 sm:py-9">
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-black sm:text-[1.85rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-[14px] leading-relaxed text-black/55">{subtitle}</p>
          ) : null}
          <div className="mt-6 space-y-5 text-[14px] leading-relaxed text-black/75">{children}</div>
        </article>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-black/40">
          {BRAND.name} · {BRAND.legal.supportEmail}
        </p>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-[15px] font-semibold tracking-tight text-black">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
