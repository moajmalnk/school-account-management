import { HELP_GLOSSARY, type GlossaryTerm } from "@/lib/help/glossary";
import { HELP_FAQS, type HelpFaq, type HelpGuide } from "@/lib/help/guides";

function normalize(text: string) {
  return text.toLowerCase().normalize("NFKD");
}

const STOP_WORDS = new Set([
  "how",
  "do",
  "does",
  "can",
  "the",
  "to",
  "in",
  "on",
  "of",
  "for",
  "and",
  "or",
  "is",
  "it",
  "my",
  "we",
  "our",
  "an",
  "what",
  "where",
  "when",
  "why",
  "with",
  "please",
  "feezo",
]);

export function tokenizeHelpQuery(query: string): string[] {
  return normalize(query)
    .split(/[^a-z0-9&]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/** 0 = no match. Every token must hit somewhere unless `loose` is set. */
export function scoreHelpGuide(guide: HelpGuide, tokens: string[], loose = false): number {
  const title = normalize(guide.title);
  const summary = normalize(guide.summary);
  const keywords = normalize(guide.keywords.join(" "));
  const body = normalize(guide.steps.map((s) => `${s.title} ${s.body} ${s.tip ?? ""}`).join(" "));
  let score = 0;
  let hits = 0;
  for (const token of tokens) {
    let hit = 0;
    if (title.includes(token)) hit += 6;
    if (keywords.includes(token)) hit += 4;
    if (summary.includes(token)) hit += 2;
    if (body.includes(token)) hit += 1;
    if (!hit && !loose) return 0;
    if (hit) hits += 1;
    score += hit;
  }
  return loose && hits === 0 ? 0 : score;
}

function matchesAll(text: string, tokens: string[]) {
  const hay = normalize(text);
  return tokens.every((t) => hay.includes(t));
}

export type HelpSearchResult = {
  guides: HelpGuide[];
  terms: GlossaryTerm[];
  faqs: HelpFaq[];
};

export function searchHelp(
  query: string,
  guides: HelpGuide[],
  opts?: { loose?: boolean },
): HelpSearchResult {
  const tokens = tokenizeHelpQuery(query);
  if (!tokens.length) return { guides: [], terms: [], faqs: [] };
  const loose = Boolean(opts?.loose);
  const ranked = guides
    .map((g) => ({ g, s: scoreHelpGuide(g, tokens, loose) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.g);
  const terms = HELP_GLOSSARY.filter((t) => matchesAll(`${t.term} ${t.meaning}`, tokens));
  const faqs = HELP_FAQS.filter((f) => matchesAll(`${f.question} ${f.answer}`, tokens));
  return { guides: ranked, terms, faqs };
}
