import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenText,
  CalendarRange,
  Clock,
  CreditCard,
  GraduationCap,
  HelpCircle,
  IndianRupee,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  ReceiptText,
  Rocket,
  Search,
  Settings,
  Sparkles,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  X,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { GuideView } from "@/components/help/GuideView";
import { SetupChecklist } from "@/components/help/SetupChecklist";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { askFeezo } from "@/lib/feezo-ai-bridge";
import { canUseHelpAccess } from "@/lib/help/access";
import { HELP_GLOSSARY, type GlossaryTerm } from "@/lib/help/glossary";
import { searchHelp } from "@/lib/help/search";
import {
  HELP_CATEGORIES,
  HELP_FAQS,
  HELP_GUIDES,
  HELP_QUICK_TASKS,
  HELP_VIDEOS,
  type HelpCategoryId,
  type HelpFaq,
  type HelpGuide,
} from "@/lib/help/guides";
import { cn, glassCardClass } from "@/lib/utils";

const CATEGORY_ICONS: Record<HelpCategoryId, LucideIcon> = {
  start: Rocket,
  students: GraduationCap,
  staff: UserCog,
  finance: Wallet,
  reports: BarChart3,
  settings: Settings,
  subscription: CreditCard,
};

const QUICK_TASK_ICONS: Record<string, LucideIcon> = {
  "receive-payment": IndianRupee,
  "admit-student": UserPlus,
  "classes-fees": ReceiptText,
  "salary-setup": Wallet,
  "team-users": Users,
  "year-close": CalendarRange,
};

export function HelpCenter() {
  const { session } = useAuth();
  const navigate = useNavigate({ from: "/tenant/support" });
  const search = useSearch({ from: "/tenant/support" });
  const [query, setQuery] = useState(search.q ?? "");
  const [category, setCategory] = useState<HelpCategoryId | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const guides = useMemo(
    () => HELP_GUIDES.filter((g) => canUseHelpAccess(session, g.access)),
    [session],
  );
  const guideById = useMemo(() => new Map(guides.map((g) => [g.id, g])), [guides]);

  const activeGuide = search.guide ? (guideById.get(search.guide) ?? null) : null;
  const relatedGuides = useMemo(
    () =>
      (activeGuide?.related ?? [])
        .map((id) => guideById.get(id))
        .filter((g): g is HelpGuide => Boolean(g)),
    [activeGuide, guideById],
  );

  useEffect(() => {
    setQuery(search.q ?? "");
  }, [search.q]);

  const openGuide = useCallback(
    (guideId: string) => {
      if (!guideById.has(guideId)) return;
      void navigate({ search: (prev) => ({ ...prev, guide: guideId }), replace: true });
    },
    [guideById, navigate],
  );

  const closeGuide = useCallback(() => {
    void navigate({ search: (prev) => ({ ...prev, guide: undefined }), replace: true });
  }, [navigate]);

  const commitQuery = useCallback(
    (value: string) => {
      const q = value.trim() ? value.trim().slice(0, 120) : undefined;
      void navigate({ search: (prev) => ({ ...prev, q }), replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      if ((search.q ?? "") !== query.trim()) commitQuery(query);
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const searching = query.trim().length >= 2;
  const results = useMemo(() => searchHelp(query, guides), [guides, query]);

  const askAi = useCallback(
    (prompt?: string) => {
      const text = (prompt ?? query).trim();
      askFeezo(text || "Help me set up my school in Feezo step by step.");
    },
    [query],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    commitQuery(query);
    const top = results.guides[0];
    if (top) openGuide(top.id);
    else if (searching) askAi();
  };

  const clearSearch = () => {
    setQuery("");
    commitQuery("");
    inputRef.current?.focus();
  };

  const visibleCategories = useMemo(
    () => HELP_CATEGORIES.filter((c) => guides.some((g) => g.category === c.id)),
    [guides],
  );
  const browseGuides = useMemo(
    () => (category === "all" ? guides : guides.filter((g) => g.category === category)),
    [category, guides],
  );
  const quickTasks = HELP_QUICK_TASKS.filter((t) => guideById.has(t.guideId));
  const reduceMotion = useReducedMotion();
  const fadeUp = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <section
        className={cn(
          glassCardClass,
          "relative w-full overflow-hidden",
          "bg-[linear-gradient(160deg,#ECFDF8_0%,#FFFFFF_42%,#F8FAFC_100%)]",
          "dark:bg-[linear-gradient(160deg,rgba(19,78,74,0.45)_0%,#18181b_48%,#09090b_100%)]",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,118,110,0.18) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#2DD4BF]/25 blur-3xl dark:bg-teal-400/15" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-[#0F766E]/15 blur-3xl" />

        <div className="relative px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex w-full max-w-5xl flex-col items-stretch text-center sm:items-center"
          >
            <div className="inline-flex items-center justify-center gap-1.5 self-center rounded-full bg-[#0F766E]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0F766E] dark:bg-teal-400/10 dark:text-[#2DD4BF]">
              <LifeBuoy className="h-3.5 w-3.5" />
              Help & support
            </div>
            <h1 className="mt-3 max-w-[18ch] self-center text-balance text-[26px] font-bold leading-[1.12] tracking-tight text-slate-900 dark:text-zinc-50 sm:max-w-none sm:text-[34px] lg:text-[40px]">
              What do you want to do today?
            </h1>
            <p className="mt-2 max-w-2xl self-center text-pretty text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400 sm:text-[14.5px]">
              Simple step-by-step guides for everything in Feezo. Search a task, tap a shortcut, or
              ask Feezo AI — no training needed.
            </p>
          </motion.div>

          <motion.form
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={onSubmit}
            role="search"
            className="relative mx-auto mt-5 w-full max-w-5xl sm:mt-7"
          >
            <div className="relative flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_18px_40px_-28px_rgba(15,118,110,0.55)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/90 sm:rounded-full sm:p-1.5">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Try "collect fee", "salary" or "close year"'
                  aria-label="Search help guides"
                  maxLength={120}
                  className="h-11 w-full rounded-xl border-0 bg-transparent pl-10 pr-10 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-50 sm:h-12 sm:rounded-full sm:pl-11 sm:pr-11 sm:text-[15px] [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                className="hidden h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#0F766E] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0D9488] sm:inline-flex"
              >
                Search
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.form>

          {quickTasks.length > 0 ? (
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-4 w-full max-w-5xl sm:mt-5"
            >
              <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500">
                Popular tasks
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {quickTasks.map((task) => {
                  const Icon = QUICK_TASK_ICONS[task.guideId] ?? BookOpenText;
                  return (
                    <button
                      key={task.guideId}
                      type="button"
                      onClick={() => openGuide(task.guideId)}
                      className="group flex min-h-[4.5rem] flex-col items-start justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/85 p-3 text-left shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/35 hover:shadow-[0_14px_28px_-18px_rgba(15,118,110,0.55)] dark:border-white/10 dark:bg-zinc-900/75 dark:hover:border-teal-400/30 sm:min-h-[5.25rem]"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0F766E]/10 text-[#0F766E] transition-colors group-hover:bg-[#0F766E] group-hover:text-white dark:bg-teal-400/10 dark:text-[#2DD4BF] dark:group-hover:bg-teal-500 dark:group-hover:text-zinc-950">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[12.5px] font-semibold leading-snug text-slate-800 dark:text-zinc-100">
                        {task.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}

          <motion.button
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            type="button"
            onClick={() => askAi()}
            className="group mx-auto mt-4 flex w-full max-w-5xl items-center gap-3 rounded-2xl border border-[#0F766E]/20 bg-[#0F766E] p-3.5 text-left text-white shadow-[0_18px_36px_-22px_rgba(15,118,110,0.8)] transition-transform hover:-translate-y-0.5 dark:border-teal-400/20 dark:bg-teal-700 sm:mt-5 sm:gap-4 sm:p-4"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Sparkles className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold tracking-tight sm:text-[15px]">
                Ask Feezo AI instead
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-white/80 sm:text-[12.5px]">
                English or Malayalam — answers from these guides and can open the right screen.
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
          </motion.button>
        </div>
      </section>

      {searching ? (
        <SearchResults
          query={query.trim()}
          guides={results.guides}
          terms={results.terms}
          faqs={results.faqs}
          onOpenGuide={openGuide}
          onClear={clearSearch}
          onAskAi={() => askAi()}
        />
      ) : (
        <>
          <SetupChecklist onOpenGuide={openGuide} />

          <section
            className={cn(glassCardClass, "w-full p-4 sm:p-5")}
            aria-labelledby="guides-title"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="guides-title"
                  className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-zinc-50"
                >
                  Guides
                </h2>
                <p className="text-[12.5px] text-slate-500 dark:text-zinc-400">
                  {guides.length} guides · pick a topic
                </p>
              </div>
            </div>
            <div className="mobile-scrollbar-none -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[{ id: "all" as const, title: "All" }, ...visibleCategories].map((c) => {
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={active}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                      active
                        ? "bg-[#0F766E] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15",
                    )}
                  >
                    {c.title}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-5">
              {(category === "all"
                ? visibleCategories
                : visibleCategories.filter((c) => c.id === category)
              ).map((c) => {
                const Icon = CATEGORY_ICONS[c.id];
                const items = browseGuides.filter((g) => g.category === c.id);
                if (!items.length) return null;
                return (
                  <div key={c.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#0F766E]/10 text-[#0F766E] dark:bg-teal-400/10 dark:text-[#2DD4BF]">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-zinc-50">
                        {c.title}
                      </h3>
                      <span className="hidden text-[12px] text-slate-400 sm:inline">
                        · {c.description}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((g) => (
                        <GuideCard key={g.id} guide={g} onOpen={() => openGuide(g.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            <FaqSection faqs={HELP_FAQS} guideById={guideById} onOpenGuide={openGuide} />
            <GlossarySection terms={HELP_GLOSSARY} />
          </div>
        </>
      )}

      <HelpContactBlock />

      <GuideView
        guide={activeGuide}
        related={relatedGuides}
        onOpenChange={(open) => {
          if (!open) closeGuide();
        }}
        onOpenGuide={openGuide}
        onAskAi={(guide) =>
          askAi(`I'm reading the guide "${guide.title}". Explain it simply and help me do it.`)
        }
      />
    </div>
  );
}

function GuideCard({ guide, onOpen }: { guide: HelpGuide; onOpen: () => void }) {
  const hasVideo = Boolean(HELP_VIDEOS[guide.id]);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full min-w-0 flex-col rounded-xl border border-slate-200/80 bg-white/80 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/35 hover:shadow-[0_10px_28px_-14px_rgba(15,118,110,0.35)] dark:border-white/10 dark:bg-zinc-900/70 dark:hover:border-teal-400/30"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13.5px] font-semibold leading-snug text-slate-900 dark:text-zinc-50">
          {guide.title}
        </span>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#0F766E] dark:text-zinc-600 dark:group-hover:text-[#2DD4BF]" />
      </div>
      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-slate-500 dark:text-zinc-400">
        {guide.summary}
      </p>
      <div className="mt-auto flex items-center gap-2 pt-2.5 font-mono text-[10.5px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {guide.minutes} min
        </span>
        <span>· {guide.steps.length} steps</span>
        {hasVideo && <span className="text-[#0F766E] dark:text-[#2DD4BF]">· video</span>}
      </div>
    </button>
  );
}

function SearchResults({
  query,
  guides,
  terms,
  faqs,
  onOpenGuide,
  onClear,
  onAskAi,
}: {
  query: string;
  guides: HelpGuide[];
  terms: GlossaryTerm[];
  faqs: HelpFaq[];
  onOpenGuide: (id: string) => void;
  onClear: () => void;
  onAskAi: () => void;
}) {
  const total = guides.length + terms.length + faqs.length;
  return (
    <section className={cn(glassCardClass, "w-full p-4 sm:p-5")} aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          {total
            ? `${total} result${total === 1 ? "" : "s"} for “${query}”`
            : `No results for “${query}”`}
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-[12px] font-semibold text-[#0F766E] hover:underline dark:text-[#2DD4BF]"
        >
          Browse all guides
        </button>
      </div>

      <button
        type="button"
        onClick={onAskAi}
        className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[#0F766E]/20 bg-gradient-to-r from-[#F0FDFA] to-white p-3 text-left transition-colors hover:border-[#0F766E]/45 dark:border-teal-400/20 dark:from-teal-950/40 dark:to-zinc-900"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0F766E] text-white dark:bg-teal-700">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 text-[13px] text-slate-700 dark:text-zinc-200">
          {total === 0 ? "No guide matches. " : ""}
          <span className="font-semibold text-[#0F766E] dark:text-[#2DD4BF]">
            Ask Feezo AI
          </span>{" "}
          <span className="break-words">“{query}”</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[#0F766E] dark:text-[#2DD4BF]" />
      </button>

      {total === 0 && (
        <p className="mt-2 text-[13px] text-slate-500 dark:text-zinc-400">
          Or try a simpler word like “fee”, “student” or “salary”, or talk to the Feezo team below.
        </p>
      )}

      {guides.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {guides.map((g) => (
            <GuideCard key={g.id} guide={g} onOpen={() => onOpenGuide(g.id)} />
          ))}
        </div>
      )}

      {faqs.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Questions
          </h3>
          <ul className="mt-2 space-y-2">
            {faqs.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
                  {f.question}
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600 dark:text-zinc-300">
                  {f.answer}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {terms.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Words explained
          </h3>
          <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {terms.map((t) => (
              <GlossaryItem key={t.term} term={t} />
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}

function FaqSection({
  faqs,
  guideById,
  onOpenGuide,
}: {
  faqs: HelpFaq[];
  guideById: Map<string, HelpGuide>;
  onOpenGuide: (id: string) => void;
}) {
  return (
    <section className={cn(glassCardClass, "w-full p-4 sm:p-5")} aria-labelledby="faq-title">
      <h2
        id="faq-title"
        className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-slate-900 dark:text-zinc-50"
      >
        <HelpCircle className="h-4 w-4 text-[#0F766E] dark:text-[#2DD4BF]" />
        Common problems
      </h2>
      <Accordion type="single" collapsible className="mt-1">
        {faqs.map((f) => {
          const guide = f.guideId ? guideById.get(f.guideId) : undefined;
          return (
            <AccordionItem
              key={f.id}
              value={f.id}
              className="border-slate-200/80 dark:border-white/10"
            >
              <AccordionTrigger className="py-3 text-[13px] font-semibold text-slate-800 hover:no-underline dark:text-zinc-100">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="text-[12.5px] leading-relaxed text-slate-600 dark:text-zinc-300">
                <p>{f.answer}</p>
                {guide && (
                  <button
                    type="button"
                    onClick={() => onOpenGuide(guide.id)}
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-[#0F766E] hover:underline dark:text-[#2DD4BF]"
                  >
                    Open guide: {guide.title}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}

function GlossaryItem({ term }: { term: GlossaryTerm }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/60">
      <dt className="text-[13px] font-semibold text-slate-900 dark:text-zinc-50">{term.term}</dt>
      <dd className="mt-0.5 text-[12.5px] leading-snug text-slate-600 dark:text-zinc-300">
        {term.meaning}
        {term.example && (
          <span className="mt-1 block text-[11.5px] italic text-slate-400">
            e.g. {term.example}
          </span>
        )}
      </dd>
    </div>
  );
}

function GlossarySection({ terms }: { terms: GlossaryTerm[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? terms : terms.slice(0, 6);
  return (
    <section className={cn(glassCardClass, "w-full p-4 sm:p-5")} aria-labelledby="glossary-title">
      <h2
        id="glossary-title"
        className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-slate-900 dark:text-zinc-50"
      >
        <BookOpenText className="h-4 w-4 text-[#0F766E] dark:text-[#2DD4BF]" />
        Accounting words, in plain English
      </h2>
      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {shown.map((t) => (
          <GlossaryItem key={t.term} term={t} />
        ))}
      </dl>
      {terms.length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-[12px] font-semibold text-[#0F766E] hover:underline dark:text-[#2DD4BF]"
        >
          {expanded ? "Show fewer" : `Show all ${terms.length} words`}
        </button>
      )}
    </section>
  );
}

function HelpContactBlock() {
  const navigate = useNavigate();
  const { contact } = BRAND;
  const whatsappText = encodeURIComponent("Hi Feezo team, I need help with ");
  const channels: {
    label: string;
    detail: string;
    icon: LucideIcon | typeof WhatsAppIcon;
    href?: string;
    onClick?: () => void;
    external?: boolean;
  }[] = [
    {
      label: "Chat with support",
      detail: "Live chat inside Feezo",
      icon: MessageCircle,
      onClick: () => void navigate({ to: "/tenant/settings", search: { tab: "support" } }),
    },
    {
      label: "WhatsApp",
      detail: contact.whatsappDisplay,
      icon: WhatsAppIcon,
      href: `https://wa.me/${contact.whatsappNumber}?text=${whatsappText}`,
      external: true,
    },
    {
      label: "Call us",
      detail: contact.phoneDisplay,
      icon: Phone,
      href: `tel:${contact.phoneE164}`,
    },
    {
      label: "Email",
      detail: contact.email,
      icon: Mail,
      href: `mailto:${contact.email}?subject=${encodeURIComponent("Feezo support request")}`,
    },
  ];

  return (
    <section
      className={cn(
        glassCardClass,
        "w-full p-4 sm:p-5",
        "bg-gradient-to-br from-white to-[#F0FDFA] dark:from-zinc-900 dark:to-teal-950/30",
      )}
      aria-labelledby="contact-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="contact-title"
            className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-zinc-50"
          >
            Still stuck? Talk to a real person
          </h2>
          <p className="text-[12.5px] text-slate-500 dark:text-zinc-400">
            {contact.hours} · {contact.responseTime}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((c) => {
          const Icon = c.icon;
          const inner = (
            <>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-white dark:bg-teal-700">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
                  {c.label}
                </span>
                <span className="block truncate text-[11.5px] text-slate-500 dark:text-zinc-400">
                  {c.detail}
                </span>
              </span>
            </>
          );
          const className =
            "flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white/85 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/35 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/75";
          return c.href ? (
            <a
              key={c.label}
              href={c.href}
              className={className}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {inner}
            </a>
          ) : (
            <button key={c.label} type="button" onClick={c.onClick} className={className}>
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
