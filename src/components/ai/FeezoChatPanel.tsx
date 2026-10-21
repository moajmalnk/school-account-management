import {
  BarChart3,
  BookOpen,
  CreditCard,
  Headset,
  Loader2,
  Maximize2,
  MessageSquarePlus,
  Mic,
  MicOff,
  Minimize2,
  Rocket,
  Search,
  Send,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FeezoConfirmCard } from "@/components/ai/FeezoConfirmCard";
import { SchoolLogo } from "@/components/ui/school-logo";
import { FeezoMessageActions } from "@/components/ai/FeezoMessageActions";
import { FeezoMessageRenderer } from "@/components/ai/FeezoMessageRenderer";
import { FeezoRichText } from "@/components/ai/FeezoRichText";
import type { useFeezoAssistant } from "@/components/ai/useFeezoAssistant";
import { useFeezoVoice } from "@/components/ai/useFeezoVoice";
import { buildFeezoFollowUps } from "@/lib/feezo-followups";
import { resolveMediaUrl } from "@/lib/media";
import { schoolInitials, useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type AssistantApi = ReturnType<typeof useFeezoAssistant>;

type Props = {
  assistant: AssistantApi;
};

type Tip = {
  label: string;
  description: string;
  prompt: string;
  icon: typeof Wallet;
};

const TIPS_EN: Tip[] = [
  {
    label: "Financial status",
    description: "Balances, collections & books snapshot",
    prompt: "What is our current financial status?",
    icon: Wallet,
  },
  {
    label: "Overdue fees",
    description: "Students with open overdue dues",
    prompt: "Show overdue fee students",
    icon: BarChart3,
  },
  {
    label: "Find anyone",
    description: "Search by name, phone, email or ID",
    prompt: "Find a student or staff by phone number or admission ID",
    icon: Search,
  },
  {
    label: "Receive payment",
    description: "Open fee collection for a student",
    prompt: "How do I receive a fee payment and send the WhatsApp receipt?",
    icon: CreditCard,
  },
  {
    label: "Set up my school",
    description: "Branches, class tier, fees & users",
    prompt: "Help me set up my school in Feezo step by step — school details, branches, class tier, fee categories, and users",
    icon: Rocket,
  },
  {
    label: "Staff & payroll",
    description: "Roster, attendance and salary report",
    prompt: "Open staff roster and explain how salary report works",
    icon: Users,
  },
];

const TIPS_ML: Tip[] = [
  {
    label: "സാമ്പത്തിക സ്ഥിതി",
    description: "ബാലൻസ്, കളക്ഷൻ, ബുക്കുകൾ",
    prompt: "ഇപ്പോഴത്തെ സാമ്പത്തിക സ്ഥിതി?",
    icon: Wallet,
  },
  {
    label: "കുടിശ്ശിക",
    description: "കുടിശ്ശികയുള്ള വിദ്യാർത്ഥികൾ",
    prompt: "കുടിശ്ശികയുള്ള വിദ്യാർത്ഥികൾ കാണിക്കൂ",
    icon: BarChart3,
  },
  {
    label: "ആരെയും കണ്ടെത്തുക",
    description: "പേര്, ഫോൺ, ഇമെയിൽ അല്ലെങ്കിൽ ID",
    prompt: "ഫോൺ നമ്പർ അല്ലെങ്കിൽ അഡ്മിഷൻ ID ഉപയോഗിച്ച് വിദ്യാർത്ഥി അല്ലെങ്കിൽ സ്റ്റാഫ് കണ്ടെത്തൂ",
    icon: Search,
  },
  {
    label: "ഫീസ് സ്വീകരിക്കുക",
    description: "പേയ്മെന്റ് + WhatsApp രസീത്",
    prompt: "ഫീസ് വാങ്ങി WhatsApp രസീത് അയക്കുന്നത് എങ്ങനെ?",
    icon: CreditCard,
  },
  {
    label: "സ്കൂൾ സെറ്റപ്പ്",
    description: "ബ്രാഞ്ച്, ക്ലാസ് ടയർ, ഫീസ്, യൂസർ",
    prompt: "എന്റെ സ്കൂൾ Feezo-ൽ സെറ്റപ്പ് ചെയ്യാൻ സഹായിക്കൂ — സ്കൂൾ വിവരങ്ങൾ, ബ്രാഞ്ചുകൾ, ക്ലാസ് ടയർ, ഫീസ്, യൂസർമാർ",
    icon: Rocket,
  },
  {
    label: "സ്റ്റാഫ് & ശമ്പളം",
    description: "റോസ്റ്റർ, അറ്റൻഡൻസ്, ശമ്പള റിപ്പോർട്ട്",
    prompt: "സ്റ്റാഫ് റോസ്റ്റർ തുറക്കൂ, ശമ്പള റിപ്പോർട്ട് എങ്ങനെ പ്രവർത്തിക്കുന്നു എന്ന് വിശദീകരിക്കൂ",
    icon: Users,
  },
];

const FULLSCREEN_KEY = "feezo.ai.fullscreen.v1";

function FeezoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-[0.7rem] bg-gradient-to-br from-[#0F766E] to-[#0D5C56] text-white shadow-sm shadow-teal-950/20 ring-1 ring-white/25",
        className,
      )}
    >
      <Sparkles className="h-[42%] w-[42%]" strokeWidth={2.35} />
    </div>
  );
}

/** School / company avatar — logo when set, otherwise initials. */
function SchoolMark({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string;
  className?: string;
}) {
  const src = resolveMediaUrl(logoUrl);
  const initials = schoolInitials(name || "School");
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[0.7rem] text-[11px] font-bold text-white shadow-sm shadow-teal-950/15 ring-1 ring-slate-200/80 dark:ring-white/15",
        !src && "bg-gradient-to-br from-[#0F766E] to-[#0D5C56]",
        className,
      )}
      title={name}
      aria-hidden
    >
      {src ? <SchoolLogo src={src} className="absolute inset-0" /> : initials}
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#0F766E]/80 dark:bg-teal-400/80"
          style={{
            animation: "feezo-dot 1.05s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
      <style>{`@keyframes feezo-dot{0%,80%,100%{opacity:.28;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}`}</style>
    </span>
  );
}

export function FeezoChatPanel({ assistant }: Props) {
  const {
    open,
    setOpen,
    locale,
    setLocale,
    messages,
    busy,
    confirmingId,
    send,
    applyNavigation,
    confirmAction,
    dismissAction,
    newChat,
    regenerate,
  } = assistant;

  const { schoolDetails, activeBranch, academicYear } = useTenantStore();
  const schoolName = schoolDetails.name?.trim() || "Your school";
  const campusName = activeBranch?.name?.trim() || "";
  const schoolTagline = schoolDetails.tagline?.trim() || "";

  const [draft, setDraft] = useState("");
  const [interim, setInterim] = useState("");
  const [mounted, setMounted] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => {
    try {
      return sessionStorage.getItem(FULLSCREEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const descId = useId();

  const draftRef = useRef("");
  draftRef.current = draft;

  const voice = useFeezoVoice({
    locale,
    enabled: open,
    getDraft: () => draftRef.current,
    onDraft: (text) => setDraft(text),
    onInterim: (text) => setInterim(text),
    onWake: () => setOpen(true),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(FULLSCREEN_KEY, fullscreen ? "1" : "0");
    } catch {
      // ignore
    }
  }, [fullscreen]);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open, interim]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, fullscreen]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draft]);

  if (!mounted || !open) return null;

  const tips = locale === "ml" ? TIPS_ML : TIPS_EN;
  const title = locale === "ml" ? "ഫീസോ AI" : "Feezo AI";
  const profileLine = [schoolName, campusName].filter(Boolean).join(" · ");
  const subtitle = profileLine
    ? academicYear
      ? `${profileLine} · ${academicYear}`
      : profileLine
    : locale === "ml"
      ? "സ്കൂൾ അസിസ്റ്റന്റ്"
      : "School operations assistant";

  const statusLabel = voice.listening
    ? locale === "ml"
      ? "കേൾക്കുന്നു"
      : "Listening"
    : busy
      ? locale === "ml"
        ? "പ്രവർത്തിക്കുന്നു"
        : "Working"
      : locale === "ml"
        ? "തയ്യാർ"
        : "Ready";

  const iconBtn =
    "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100";

  const helpLinkBtn =
    "inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-teal-300/70 hover:text-[#0F766E] dark:border-white/[0.08] dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:text-teal-300";

  const contentMax = fullscreen ? "mx-auto w-full max-w-3xl" : "";

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {!fullscreen ? (
        <button
          type="button"
          aria-label="Close Feezo"
          className="pointer-events-auto absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] dark:bg-black/65"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          "pointer-events-auto absolute flex flex-col overflow-hidden",
          "border border-slate-200/90 bg-[#F4F7FA] shadow-[0_28px_90px_-28px_rgba(15,23,42,0.55)]",
          "dark:border-white/[0.09] dark:bg-[#0A0E13] dark:shadow-black/70",
          fullscreen
            ? "inset-0 h-dvh w-screen rounded-none border-0"
            : cn(
                "inset-x-3 bottom-[calc(60px+1rem+env(safe-area-inset-bottom,0px))] h-[min(82dvh,700px)] rounded-2xl",
                "md:inset-x-auto md:bottom-6 md:right-6 md:h-[min(78vh,740px)] md:w-[min(460px,calc(100vw-3rem))]",
              ),
        )}
      >
        {/* Brand accent */}
        <div className="h-[3px] shrink-0 bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#0F766E]" />

        {/* Header — school profile + Feezo AI */}
        <header
          className={cn(
            "flex shrink-0 items-center gap-2.5 border-b border-slate-200/80 bg-white/95 px-3.5 py-3 backdrop-blur-md dark:border-white/[0.07] dark:bg-[#0F141B]/95 sm:gap-3 sm:px-4",
            fullscreen && "pt-[max(0.75rem,env(safe-area-inset-top))]",
          )}
        >
          <div className="relative shrink-0">
            <SchoolMark name={schoolName} logoUrl={schoolDetails.logoUrl} className="h-10 w-10" />
            <span
              className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-md bg-gradient-to-br from-[#0F766E] to-[#0D5C56] text-white shadow-sm ring-2 ring-white dark:ring-[#0F141B]"
              title="Feezo AI"
            >
              <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2
                id={titleId}
                className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50"
              >
                {title}
              </h2>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                  voice.listening
                    ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200/80 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30"
                    : busy
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30"
                      : "bg-teal-50 text-teal-700 ring-1 ring-teal-200/80 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    voice.listening ? "bg-rose-500" : busy ? "bg-amber-500" : "bg-teal-500",
                  )}
                />
                {statusLabel}
              </span>
            </div>
            <p
              id={descId}
              className="mt-0.5 truncate text-[11px] font-medium text-slate-600 dark:text-zinc-300"
              title={subtitle}
            >
              {subtitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                voice.stop(false);
                newChat();
                setDraft("");
                setInterim("");
                inputRef.current?.focus();
              }}
              disabled={busy}
              title={locale === "ml" ? "പുതിയ ചാറ്റ്" : "New chat"}
              aria-label={locale === "ml" ? "പുതിയ ചാറ്റ്" : "New chat"}
              className={iconBtn}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              title={
                fullscreen
                  ? locale === "ml"
                    ? "ചെറുതാക്കുക"
                    : "Exit full screen"
                  : locale === "ml"
                    ? "പൂർണ്ണ സ്ക്രീൻ"
                    : "Full screen"
              }
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
              className={iconBtn}
            >
              {fullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>

            <div className="mx-1 flex items-center rounded-lg bg-slate-100/90 p-0.5 dark:bg-white/[0.06]">
              {(["en", "ml"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  aria-pressed={locale === code}
                  title={
                    code === "ml"
                      ? "Dictate in Malayalam"
                      : "Dictate in English"
                  }
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition",
                    locale === code
                      ? "bg-white text-[#0F766E] shadow-sm dark:bg-zinc-800 dark:text-teal-300"
                      : "text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300",
                  )}
                >
                  {code}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className={iconBtn}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollerRef}
          className={cn(
            "relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-4 sm:px-4",
            // Keep scrollable; hide chrome so the panel stays clean.
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {/* Soft wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-500/[0.04] to-transparent dark:from-teal-400/[0.05]"
          />

          {messages.length === 0 ? (
            <div
              className={cn(
                // min-h-full centers short content; without fixed h-full the panel can grow & scroll.
                "relative flex min-h-full flex-col justify-center gap-5 pb-2 pt-1",
                contentMax,
              )}
            >
              <div className="text-center">
                <div className="mx-auto flex w-fit flex-col items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/80">
                  <div className="relative">
                    <SchoolMark
                      name={schoolName}
                      logoUrl={schoolDetails.logoUrl}
                      className="h-14 w-14 text-[13px] shadow-md shadow-teal-900/15"
                    />
                    <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-lg bg-gradient-to-br from-[#0F766E] to-[#0D5C56] text-white shadow ring-2 ring-white dark:ring-zinc-900">
                      <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                  </div>
                  <div className="min-w-0 max-w-[16rem]">
                    <p className="truncate text-[14px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
                      {schoolName}
                    </p>
                    {campusName || academicYear ? (
                      <p className="mt-0.5 truncate text-[11.5px] text-slate-500 dark:text-zinc-400">
                        {[campusName, academicYear].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                    {schoolTagline ? (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-400 dark:text-zinc-500">
                        {schoolTagline}
                      </p>
                    ) : null}
                  </div>
                </div>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
                  {locale === "ml" ? "എങ്ങനെ സഹായിക്കാം?" : "How can I help today?"}
                </h3>
                <p className="mx-auto mt-2 max-w-[320px] text-[12.5px] leading-relaxed text-slate-500 dark:text-zinc-400">
                  {locale === "ml"
                    ? `${schoolName}-ന് വേണ്ടി ഫീസ്, വിദ്യാർത്ഥികൾ, സ്റ്റാഫ്, റിപ്പോർട്ടുകൾ — സ്ഥിരീകരണത്തിന് ശേഷം മാത്രം സേവ്.`
                    : `Ask about fees, students, staff, or setup for ${schoolName}. Nothing saves until you verify.`}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {tips.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <button
                      key={tip.prompt}
                      type="button"
                      onClick={() => void send(tip.prompt)}
                      className={cn(
                        "group flex items-start gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3 py-3 text-left transition",
                        "hover:border-teal-300/70 hover:bg-[#F0FDFA] hover:shadow-sm",
                        "dark:border-white/[0.08] dark:bg-zinc-900/70 dark:hover:border-teal-500/35 dark:hover:bg-teal-950/25",
                      )}
                    >
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-teal-50 text-[#0F766E] ring-1 ring-teal-100 group-hover:bg-teal-100/80 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12px] font-semibold text-slate-800 dark:text-zinc-100">
                          {tip.label}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] leading-snug text-slate-500 dark:text-zinc-400">
                          {tip.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[11.5px]">
                <button
                  type="button"
                  onClick={() => applyNavigation({ to: "/tenant/support" })}
                  className={helpLinkBtn}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {locale === "ml" ? "സഹായ ഗൈഡുകൾ" : "Help guides"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyNavigation({ to: "/tenant/settings", search: { tab: "support" } })
                  }
                  className={helpLinkBtn}
                >
                  <Headset className="h-3.5 w-3.5" />
                  {locale === "ml" ? "സപ്പോർട്ട് ടീമുമായി ചാറ്റ്" : "Chat with our team"}
                </button>
              </div>
            </div>
          ) : (
            <div className={cn("relative space-y-4 pb-2", contentMax)}>
              {messages.map((m, i) => {
                const isLastAssistant =
                  m.role === "assistant" &&
                  !messages.slice(i + 1).some((x) => x.role === "assistant");
                const isUser = m.role === "user";
                const priorUser = isUser
                  ? null
                  : [...messages.slice(0, i)].reverse().find((x) => x.role === "user");
                const followUps =
                  isLastAssistant && !busy
                    ? buildFeezoFollowUps({
                        locale,
                        userText: priorUser?.content ?? "",
                        assistantText: m.content,
                        navigations: m.navigations,
                      })
                    : [];

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "group/msg flex gap-2.5",
                      isUser ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    {isUser ? (
                      <SchoolMark
                        name={schoolName}
                        logoUrl={schoolDetails.logoUrl}
                        className="mt-0.5 h-7 w-7 text-[9px]"
                      />
                    ) : (
                      <FeezoMark className="mt-0.5 h-7 w-7 shrink-0" />
                    )}

                    <div
                      className={cn(
                        "flex min-w-0 max-w-[86%] flex-col",
                        fullscreen && "max-w-[min(86%,40rem)]",
                        isUser ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                          isUser
                            ? "rounded-2xl rounded-tr-md bg-[#0F766E] text-white shadow-sm shadow-teal-950/15"
                            : "rounded-2xl rounded-tl-md border border-slate-200/90 bg-white text-slate-800 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-100",
                        )}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        ) : (
                          <FeezoRichText text={m.content} />
                        )}
                        {!isUser ? (
                          <>
                            <FeezoMessageRenderer
                              blocks={m.blocks}
                              navigations={m.navigations}
                              onNavigate={(nav) => {
                                applyNavigation(nav);
                                if (!fullscreen) setOpen(false);
                              }}
                            />
                            {(m.pendingActions ?? []).length > 0 ? (
                              <div className="mt-2.5 space-y-2">
                                {(m.pendingActions ?? []).map((pa) => (
                                  <FeezoConfirmCard
                                    key={pa.id}
                                    action={pa}
                                    locale={locale}
                                    confirming={confirmingId === pa.id}
                                    onConfirm={() => void confirmAction(pa)}
                                    onDismiss={() => dismissAction(pa.id)}
                                  />
                                ))}
                              </div>
                            ) : null}
                          </>
                        ) : null}
                      </div>

                      {!isUser ? (
                        <div className="mt-1.5 w-full space-y-2.5 px-0.5">
                          <FeezoMessageActions
                            locale={locale}
                            messageId={m.id}
                            content={m.content}
                            blocks={m.blocks}
                            navigations={m.navigations}
                            model={m.model}
                            alwaysVisible={isLastAssistant}
                            onRegenerate={busy ? undefined : () => void regenerate(m.id)}
                          />
                          {followUps.length > 0 ? (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-zinc-500">
                                {locale === "ml" ? "നിർദ്ദേശിത ചോദ്യങ്ങൾ" : "Suggested questions"}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {followUps.map((chip) => (
                                  <button
                                    key={chip.prompt}
                                    type="button"
                                    disabled={busy}
                                    title={chip.prompt}
                                    onClick={() => void send(chip.prompt)}
                                    className={cn(
                                      "max-w-full rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-left text-[11.5px] font-medium leading-snug text-slate-700 shadow-sm transition",
                                      "hover:border-teal-300/80 hover:bg-[#F0FDFA] hover:text-[#0F766E]",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/25",
                                      "disabled:pointer-events-none disabled:opacity-45",
                                      "dark:border-white/[0.1] dark:bg-zinc-900/80 dark:text-zinc-200",
                                      "dark:hover:border-teal-500/40 dark:hover:bg-teal-950/30 dark:hover:text-teal-200",
                                    )}
                                  >
                                    {chip.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {busy ? (
                <div className="flex items-start gap-2.5">
                  <FeezoMark className="mt-0.5 h-7 w-7 shrink-0" />
                  <div className="inline-flex items-center gap-2.5 rounded-2xl rounded-tl-md border border-slate-200/90 bg-white px-3.5 py-2.5 text-[12.5px] text-slate-500 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-400">
                    <ThinkingDots />
                    <span>
                      {locale === "ml" ? "ഫീസോ ചിന്തിക്കുന്നു…" : "Analyzing your request…"}
                    </span>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0F766E] dark:text-teal-400" />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Composer */}
        <div
          className={cn(
            "shrink-0 border-t border-slate-200/80 bg-white/95 px-3.5 pt-3 backdrop-blur-md dark:border-white/[0.07] dark:bg-[#0F141B]/95",
            "pb-[max(0.9rem,env(safe-area-inset-bottom))]",
          )}
        >
          <div className={cn(contentMax)}>
            {voice.listening || interim ? (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-teal-200/60 bg-teal-50/80 px-2.5 py-1.5 text-[11px] text-teal-800 dark:border-teal-500/25 dark:bg-teal-950/40 dark:text-teal-200">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                </span>
                <span className="min-w-0 truncate">
                  {interim
                    ? interim
                    : locale === "ml"
                      ? "മലയാളം കേൾക്കുന്നു"
                      : "Listening in English"}
                </span>
              </div>
            ) : null}
            {voice.error ? (
              <div className="mb-2 text-[11px] text-rose-600 dark:text-rose-400">{voice.error}</div>
            ) : null}

            <div
              className={cn(
                "flex items-end gap-1.5 rounded-2xl border bg-slate-50/90 p-1.5 transition dark:bg-zinc-900/80",
                "border-slate-200/90 focus-within:border-teal-400/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/15",
                "dark:border-white/[0.09] dark:focus-within:border-teal-500/40 dark:focus-within:bg-zinc-900 dark:focus-within:ring-teal-500/15",
              )}
            >
              <button
                type="button"
                disabled={!voice.supported}
                aria-pressed={voice.listening}
                aria-label={
                  voice.listening
                    ? locale === "ml"
                      ? "മൈക്ക് നിർത്തുക"
                      : "Stop microphone"
                    : locale === "ml"
                      ? "മലയാളത്തിൽ പറയുക"
                      : "Speak in English"
                }
                onClick={() => (voice.listening ? voice.stop() : voice.start())}
                title={
                  voice.supported
                    ? locale === "ml"
                      ? "മലയാളം മൈക്ക്. നിർത്താൻ വീണ്ടും അമർത്തുക."
                      : "English mic. Press again to stop."
                    : locale === "ml"
                      ? "ഈ ബ്രൗസറിൽ വോയ്സ് ലഭ്യമല്ല"
                      : "Voice not supported in this browser"
                }
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition",
                  voice.listening
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-900/20"
                    : "text-slate-500 hover:bg-white hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                  !voice.supported && "opacity-40",
                )}
              >
                {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (voice.listening) voice.stop(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const text = [draft, interim].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
                    if (!text || busy) return;
                    if (voice.listening) voice.stop(false);
                    setInterim("");
                    setDraft("");
                    void send(text);
                  }
                }}
                placeholder={
                  locale === "ml"
                    ? "ഇംഗ്ലീഷ് അല്ലെങ്കിൽ മലയാളത്തിൽ ചോദിക്കുക…"
                    : "Ask about fees, students, reports…"
                }
                className={cn(
                  "max-h-[128px] min-h-[40px] flex-1 resize-none bg-transparent px-1.5 py-2.5 text-[13.5px] leading-snug",
                  "text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-100 dark:placeholder:text-zinc-500",
                  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                )}
              />

              <button
                type="button"
                disabled={busy || ![draft, interim].some((part) => part.trim())}
                onClick={() => {
                  const text = [draft, interim].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
                  if (!text || busy) return;
                  if (voice.listening) voice.stop(false);
                  setInterim("");
                  setDraft("");
                  void send(text);
                }}
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm transition",
                  "bg-[#0F766E] hover:bg-[#0c655e] disabled:bg-slate-300 disabled:shadow-none",
                  "dark:disabled:bg-zinc-700",
                )}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2.5 text-center text-[10px] leading-none text-slate-400 dark:text-zinc-500">
              {locale === "ml"
                ? "മാറ്റങ്ങൾ സ്ഥിരീകരണത്തിന് ശേഷം മാത്രം സേവ് ചെയ്യും"
                : "Changes save only after you verify · Enter to send"}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
