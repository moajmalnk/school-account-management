import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenText,
  Clock,
  CreditCard,
  GraduationCap,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Rocket,
  Search,
  Settings,
  UserCog,
  Wallet,
  X,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

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
import { canUseHelpAccess } from "@/lib/help/access";
import { HELP_GLOSSARY, type GlossaryTerm } from "@/lib/help/glossary";
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

function normalize(text: string) {
  return text.toLowerCase().normalize("NFKD");
}

function tokenize(query: string) {
  return normalize(query)
    .split(/[^a-z0-9&]+/)
    .filter((t) => t.length > 1);
}

function scoreGuide(guide: HelpGuide, tokens: string[]): number {
  const title = normalize(guide.title);
  const summary = normalize(guide.summary);
  const keywords = normalize(guide.keywords.join(" "));
  const body = normalize(guide.steps.map((s) => `${s.title} ${s.body} ${s.tip ?? ""}`).join(" "));
  let score = 0;
  for (const token of tokens) {
    let hit = 0;
    if (title.includes(token)) hit += 6;
    if (keywords.includes(token)) hit += 4;
    if (summary.includes(token)) hit += 2;
    if (body.includes(token)) hit += 1;
    if (!hit) return 0;
    score += hit;
  }
  return score;
}

function matchesAll(text: string, tokens: string[]) {
  const hay = normalize(text);
  return tokens.every((t) => hay.includes(t));
}

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

  const tokens = useMemo(() => tokenize(query), [query]);
  const searching = tokens.length > 0;

  const results = useMemo(() => {
    if (!searching) return { guides: [], terms: [], faqs: [] };
    const guideHits = guides
      .map((g) => ({ g, s: scoreGuide(g, tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.g);
    const terms = HELP_GLOSSARY.filter((t) => matchesAll(`${t.term} ${t.meaning}`, tokens));
    const faqs = HELP_FAQS.filter((f) => matchesAll(`${f.question} ${f.answer}`, tokens));
    return { guides: guideHits, terms, faqs };
  }, [guides, searching, tokens]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    commitQuery(query);
    const top = results.guides[0];
    if (top) openGuide(top.id);
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

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <section
        className={cn(
          glassCardClass,
          "relative w-full overflow-hidden p-5 sm:p-7",
          "bg-gradient-to-br from-[#F0FDFA] via-white to-white dark:from-teal-950/40 dark:via-zinc-900 dark:to-zinc-950",
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#2DD4BF]/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0F766E] dark:bg-teal-400/10 dark:text-[#2DD4BF]">
            <LifeBuoy className="h-3.5 w-3.5" />
            Help & support
          </div>
          <h1 className="mt-3 text-[24px] font-bold leading-tight tracking-tight text-slate-900 dark:text-zinc-50 sm:text-[30px]">
            What do you want to do today?
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500 dark:text-zinc-400">
            Simple step-by-step guides for everything in Feezo. Search, or follow the setup steps
            below. No training needed.
          </p>

          <form onSubmit={onSubmit} role="search" className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “collect fee”, “salary” or “close year”"
              aria-label="Search help guides"
              maxLength={120}
              className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-11 text-[14px] text-slate-900 shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-[#0F766E]/50 focus:ring-4 focus:ring-[#0F766E]/10 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {quickTasks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {quickTasks.map((task) => (
                <button
                  key={task.guideId}
                  type="button"
                  onClick={() => openGuide(task.guideId)}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[12px] font-medium text-slate-700 backdrop-blur transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E] dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:text-[#2DD4BF]"
                >
                  {task.label}
                </button>
              ))}
            </div>
          )}
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
}: {
  query: string;
  guides: HelpGuide[];
  terms: GlossaryTerm[];
  faqs: HelpFaq[];
  onOpenGuide: (id: string) => void;
  onClear: () => void;
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

      {total === 0 && (
        <p className="mt-2 text-[13px] text-slate-500 dark:text-zinc-400">
          Try a simpler word like “fee”, “student” or “salary”, or ask the Feezo team below.
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
      <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
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
