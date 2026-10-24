/**
 * Exports the in-app help centre (src/lib/help) to backend/data/help_kb.json
 * so Feezo AI's `search_help` tool answers from the same guides users see.
 *
 * Run after editing guides:  npm run help:kb
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { HELP_GLOSSARY } from "../src/lib/help/glossary";
import { HELP_CATEGORIES, HELP_FAQS, HELP_GUIDES, type HelpAccess } from "../src/lib/help/guides";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** Vite app may keep a local copy; PHP AI loads feezo-backend/data/help_kb.json. */
const outFiles = [
  resolve(root, "backend/data/help_kb.json"),
  resolve(root, "../feezo-backend/data/help_kb.json"),
];

const categoryTitle = new Map(HELP_CATEGORIES.map((c) => [c.id, c.title]));

function describeAccess(access?: HelpAccess): string | undefined {
  if (!access) return undefined;
  if (access.kind === "permission") return `Needs the "${access.key}" permission`;
  if (access.kind === "finance") {
    return access.view ? `Needs Finance access (${access.view})` : "Needs Finance access";
  }
  return access.tab ? `Needs Settings access (${access.tab} tab)` : "Needs Settings access";
}

const kb = {
  version: 1,
  generatedAt: new Date().toISOString(),
  guides: HELP_GUIDES.map((g) => ({
    id: g.id,
    category: g.category,
    categoryTitle: categoryTitle.get(g.category) ?? g.category,
    title: g.title,
    summary: g.summary,
    minutes: g.minutes,
    keywords: g.keywords,
    procedure: g.procedure,
    flowchartTitle: g.flowchart?.title,
    requires: describeAccess(g.access),
    warning: g.warning,
    openTo: g.openTo,
    related: g.related,
    steps: g.steps.map((s) => ({ title: s.title, body: s.body, tip: s.tip, warning: s.warning })),
  })),
  faqs: HELP_FAQS.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    guideId: f.guideId,
  })),
  glossary: HELP_GLOSSARY,
};

const payload = `${JSON.stringify(kb, null, 1)}\n`;
for (const outFile of outFiles) {
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, payload, "utf8");
}
console.log(
  `help_kb.json: ${kb.guides.length} guides, ${kb.faqs.length} FAQs, ${kb.glossary.length} terms → ${outFiles.join(" · ")}`,
);
