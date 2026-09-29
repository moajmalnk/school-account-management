import type { FeezoLocale, FeezoNavigation } from "@/lib/api/ai";
import type { HelpGuide } from "@/lib/help/guides";
import { searchHelp } from "@/lib/help/search";

export type OfflineHelpReply = {
  content: string;
  navigations: FeezoNavigation[];
};

/** Answer a how-to question from the bundled help guides when Feezo AI is unreachable. */
export function buildOfflineHelpReply(
  query: string,
  guides: HelpGuide[],
  locale: FeezoLocale,
): OfflineHelpReply | null {
  const { guides: hits, terms } = searchHelp(query, guides, { loose: true });
  const top = hits[0];
  if (!top && !terms.length) return null;

  const lines: string[] = [];
  if (locale === "ml") {
    lines.push("Feezo AI ഇപ്പോൾ ലഭ്യമല്ല, പക്ഷേ സഹായ ഗൈഡിൽ നിന്നുള്ള ഉത്തരം ഇതാ:");
  } else {
    lines.push("Feezo AI is not reachable right now, but here is the answer from the help guides:");
  }

  const term = terms[0];
  if (term) {
    lines.push("", `**${term.term}**: ${term.meaning}`);
    if (term.example) lines.push(`_${term.example}_`);
  }
  if (top) {
    lines.push("", `**${top.title}**`, top.summary, "");
    top.steps.forEach((step, i) => {
      lines.push(`${i + 1}. **${step.title}**: ${step.body}`);
    });
    if (top.warning) lines.push("", `> ${top.warning}`);
  }

  const navigations: FeezoNavigation[] = [];
  for (const guide of hits.slice(0, 2)) {
    navigations.push({
      to: "/tenant/support",
      search: { guide: guide.id },
      label: `${locale === "ml" ? "ഗൈഡ് തുറക്കുക" : "Open guide"}: ${guide.title}`,
    });
  }
  if (top?.openTo) {
    const [to, qs] = top.openTo.href.split("?");
    const search: Record<string, string> = {};
    new URLSearchParams(qs ?? "").forEach((v, k) => {
      search[k] = v;
    });
    navigations.push({ to: to ?? top.openTo.href, search, label: top.openTo.label });
  }
  return { content: lines.join("\n"), navigations };
}
