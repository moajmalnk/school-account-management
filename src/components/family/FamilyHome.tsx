import { useNavigate } from "@tanstack/react-router";
import { CalendarCheck, IndianRupee, MessageCircle, Phone, Plane } from "lucide-react";
import { useEffect, useState } from "react";

import { FamilyCard, FamilyHeader, FamilySkeleton } from "@/components/family/FamilyChrome";
import { familyHome } from "@/lib/api/family";
import { useFamily } from "@/lib/family-session";
import { usePwa } from "@/lib/pwa";

export function FamilyHome() {
  const { student } = useFamily();
  const pwa = usePwa();
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
  if (error) return <p className="px-4 pt-4 text-sm text-rose-600">{error}</p>;
  if (!data) {
    return (
      <>
        <FamilyHeader />
        <FamilySkeleton />
      </>
    );
  }

  return (
    <>
      <FamilyHeader unread={data.unread} />
      <div className="space-y-5 px-4 pb-4">
        {data.banner?.title || data.banner?.body || data.banner?.imageUrl ? (
          <FamilyCard className="overflow-hidden p-0">
            {data.banner?.imageUrl ? (
              <img src={data.banner.imageUrl} alt="" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 flex-col justify-end bg-gradient-to-br from-[#0F766E] to-[#115E59] p-4 text-white">
                <p className="text-lg font-semibold">{data.banner?.title}</p>
                {data.banner?.body ? <p className="mt-1 text-sm text-white/85">{data.banner.body}</p> : null}
              </div>
            )}
            {data.banner?.imageUrl && (data.banner.title || data.banner.body) ? (
              <div className="p-4">
                {data.banner.title ? <p className="text-lg font-semibold">{data.banner.title}</p> : null}
                {data.banner.body ? <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">{data.banner.body}</p> : null}
              </div>
            ) : null}
          </FamilyCard>
        ) : null}
        {pwa.showBanner && !pwa.isInstalled ? (
          <button
            type="button"
            onClick={() => void pwa.install()}
            className="w-full rounded-2xl bg-teal-50 px-4 py-3 text-left text-sm font-medium text-[#0F766E] dark:bg-teal-950"
          >
            Add Feezo Family to your home screen
          </button>
        ) : null}
        <div>
          <h2 className="mb-2 text-sm font-semibold">Quick access</h2>
          <div className="grid grid-cols-3 gap-3">
            <QuickTile to="/family/attendance" icon={CalendarCheck} label="Attendance" />
            <QuickTile to="/family/leave" icon={Plane} label="Leave" />
            <QuickTile to="/family/fees" icon={IndianRupee} label="Fees" />
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Quick connect</h2>
          <FamilyCard className="flex items-center gap-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold dark:bg-zinc-800">
              {data.school.name.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{data.school.name}</span>
            {data.school.whatsapp ? (
              <a href={data.school.whatsapp} className="rounded-full bg-teal-50 p-2 text-[#0F766E]" aria-label="WhatsApp the school">
                <MessageCircle className="h-4 w-4" />
              </a>
            ) : null}
            {data.school.call ? (
              <a href={data.school.call} className="rounded-full bg-teal-50 p-2 text-[#0F766E]" aria-label="Call the school">
                <Phone className="h-4 w-4" />
              </a>
            ) : null}
          </FamilyCard>
        </div>
      </div>
    </>
  );
}

function QuickTile({
  to,
  icon: Icon,
  label,
}: {
  to: "/family/attendance" | "/family/leave" | "/family/fees";
  icon: typeof Phone;
  label: string;
}) {
  const navigate = useNavigate();
  const { confirmLeave } = useFamily();
  return (
    <a
      href={to}
      onClick={(event) => {
        if (!confirmLeave()) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        void navigate({ href: to });
      }}
      className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-4 text-xs font-medium dark:border-white/10 dark:bg-zinc-900"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10">
        <Icon className="h-5 w-5" />
      </span>
      {label}
    </a>
  );
}
