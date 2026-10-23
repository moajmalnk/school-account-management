import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  FamilyCard,
  FamilyFeatureTile,
  FamilyHeader,
  FamilyPillButton,
  FamilySectionTitle,
  FamilySkeleton,
} from "@/components/family/FamilyChrome";
import { familyHome } from "@/lib/api/family";
import { useFamily } from "@/lib/family-session";
import { usePwa } from "@/lib/pwa";

const ILLUSTRATIONS = {
  attendance: "/family/illustrations/attendance.svg",
  leave: "/family/illustrations/leave.svg",
  fees: "/family/illustrations/fees.svg",
  hero: "/family/illustrations/hero-student.svg",
} as const;

export function FamilyHome() {
  const { student, confirmLeave } = useFamily();
  const navigate = useNavigate();
  const pwa = usePwa();
  const quickRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof familyHome>> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!student) return;
    let cancelled = false;
    setData(null);
    familyHome(student.id)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load home");
      });
    return () => {
      cancelled = true;
    };
  }, [student]);

  if (!student) {
    return (
      <FamilyCard className="mx-4 mt-4">
        <p className="text-sm">No student is linked to this account yet. Ask the school to add your phone on the student profile.</p>
      </FamilyCard>
    );
  }
  if (error) return <p className="px-4 pt-4 text-sm text-[var(--family-pink-deep)]">{error}</p>;
  if (!data) {
    return (
      <>
        <FamilyHeader variant="plain" />
        <FamilySkeleton />
      </>
    );
  }

  const hasSchoolBanner = Boolean(data.banner?.title || data.banner?.body || data.banner?.imageUrl);

  return (
    <>
      <FamilyHeader unread={data.unread} variant="plain" />
      <div className="space-y-5 px-4 pb-6">
        {hasSchoolBanner && data.banner?.imageUrl ? (
          <FamilyCard className="overflow-hidden p-0">
            <img src={data.banner.imageUrl} alt="" className="h-44 w-full object-cover" />
            {data.banner.title || data.banner.body ? (
              <div className="p-4">
                {data.banner.title ? <p className="text-lg font-bold">{data.banner.title}</p> : null}
                {data.banner.body ? <p className="mt-1 text-sm text-[var(--family-ink-muted)]">{data.banner.body}</p> : null}
              </div>
            ) : null}
          </FamilyCard>
        ) : (
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E8E4FF] via-[#DCE8FF] to-[#FFF3C4] p-5 shadow-[var(--family-shadow)]">
            <div className="relative z-10 max-w-[58%] space-y-3">
              <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-[var(--family-ink)]">
                {data.banner?.title || "Learn Today, Build Tomorrow"}
              </h1>
              <p className="text-[12px] font-medium leading-relaxed text-[var(--family-ink-muted)]">
                {data.banner?.body || "Small steps every day make big dreams come true."}
              </p>
              <FamilyPillButton
                className="h-10 px-4 text-xs"
                onClick={() => quickRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Keep Going
                <ArrowRight className="h-3.5 w-3.5" />
              </FamilyPillButton>
            </div>
            <img
              src={ILLUSTRATIONS.hero}
              alt=""
              className="pointer-events-none absolute -bottom-2 -right-1 h-[150px] w-[150px] object-contain"
            />
          </section>
        )}

        {pwa.showBanner && !pwa.isInstalled ? (
          <button
            type="button"
            onClick={() => void pwa.install()}
            className="w-full rounded-2xl bg-[var(--family-lavender)] px-4 py-3 text-left text-sm font-semibold text-[var(--family-lavender-deep)]"
          >
            Add Feezo Family to your home screen
          </button>
        ) : null}

        <div ref={quickRef}>
          <FamilySectionTitle
            action={
              <button
                type="button"
                className="text-xs font-bold text-[var(--family-lavender-deep)]"
                onClick={() => {
                  if (!confirmLeave()) return;
                  void navigate({ href: "/family/academics" });
                }}
              >
                See All ›
              </button>
            }
          >
            Quick access
          </FamilySectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <FamilyFeatureTile
              label="Attendance"
              href="/family/attendance"
              illustration={ILLUSTRATIONS.attendance}
              tone="mint"
              className="min-h-[140px]"
            />
            <FamilyFeatureTile
              label="Leave"
              href="/family/leave"
              illustration={ILLUSTRATIONS.leave}
              tone="lavender"
              className="min-h-[140px]"
            />
            <FamilyFeatureTile
              label="Fees"
              href="/family/fees"
              illustration={ILLUSTRATIONS.fees}
              tone="cream"
              className="min-h-[140px]"
            />
          </div>
        </div>

        <div className="pb-2">
          <FamilySectionTitle>Quick connect</FamilySectionTitle>
          <div className="flex w-full items-center gap-3 rounded-[24px] border border-[#DCE6F5]/80 bg-gradient-to-r from-[#EEF4FF] via-[#F4F7FF] to-[#EAF3FF] px-3.5 py-3.5 shadow-[var(--family-shadow)] dark:border-white/10 dark:from-[var(--family-sky)] dark:via-[var(--family-surface)] dark:to-[var(--family-lavender)]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[var(--family-sky-deep)] shadow-sm ring-1 ring-[#E4EAF8] dark:bg-[var(--family-surface)] dark:ring-white/10">
              {data.school.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold tracking-tight text-[var(--family-ink)]">
                {data.school.name}
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-medium text-[var(--family-ink-muted)]">
                Reach the school office
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {data.school.whatsapp ? (
                <a
                  href={data.school.whatsapp}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--family-whatsapp)] text-white shadow-[0_6px_14px_-6px_rgba(37,211,102,0.7)] transition active:scale-95"
                  aria-label="WhatsApp the school"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              ) : null}
              {data.school.call ? (
                <a
                  href={data.school.call}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--family-call)] text-white shadow-[0_6px_14px_-6px_rgba(59,130,246,0.65)] transition active:scale-95"
                  aria-label="Call the school"
                >
                  <Phone className="h-4 w-4" />
                </a>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
