import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { FeezoLocale, FeezoUiBlock } from "@/lib/api/ai";
import { todayStamp } from "@/lib/download-names";
import { asciiCurrencyText } from "@/lib/money";
import { saveFile } from "@/lib/native-download";

const TEAL: [number, number, number] = [15, 118, 110];
const TEAL_DARK: [number, number, number] = [17, 94, 89];
const SLATE: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const SURFACE: [number, number, number] = [248, 250, 252];
const ROSE: [number, number, number] = [190, 18, 60];
const WHITE: [number, number, number] = [255, 255, 255];

const MARGIN = 44;
const PAGE_BOTTOM = 52;

export type FeezoAiPdfInput = {
  locale: FeezoLocale;
  content: string;
  blocks?: FeezoUiBlock[];
  schoolName?: string;
  branchName?: string;
};

/** Helvetica cannot draw ₹ or Malayalam — normalize for a clean PDF. */
export function pdfSafeText(input: string): string {
  return asciiCurrencyText(input)
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[^\t\n\r\x20-\x7E\u00A0-\u024F]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatWhen(d = new Date()): string {
  try {
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return d.toISOString();
  }
}

function looksNegativeMoney(value: string): boolean {
  const t = value.replace(/,/g, "").trim();
  return /^-/.test(t) || /\(.*\)/.test(t) || /Rs\.\s*-/.test(t);
}

type KpiCard = { title: string; value: string; subtitle?: string };

type PdfBlock =
  | { kind: "intro"; text: string }
  | { kind: "heading"; text: string; level: 1 | 2 | 3 }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "metric"; label: string; value: string }
  | { kind: "action"; label: string; href?: string }
  | { kind: "rule" };

/** Strip markdown markers but keep readable words. */
function stripInlineMarkdown(raw: string): string {
  return pdfSafeText(
    raw
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/(?<!\w)\*(.+?)\*(?!\w)/g, "$1")
      .replace(/~~(.+?)~~/g, "$1")
      .replace(/^#{1,6}\s+/, "")
      .replace(/^\s*[-*+]\s+/, "")
      .replace(/^\s*\d+\.\s+/, "")
      .replace(/\s{2,}/g, " ")
      .trim(),
  );
}

function parseMarkdownLink(line: string): { label: string; href?: string } | null {
  const m = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!m) return null;
  return { label: stripInlineMarkdown(m[1] || "Open"), href: (m[2] || "").trim() || undefined };
}

function looksLikeMetricLabel(label: string): boolean {
  return /^(total|net|gross|cash|income|expense|revenue|outstanding|collection|dues?|students?|staff|balance|profit|loss|receivable|payable|headcount)\b/i.test(
    label.trim(),
  );
}

function looksLikeMetricValue(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > 42) return false;
  // Money / counts — not prose like "(Class 1 - A) - Due: AED 6,000 (Guardian: …)"
  if (/[()]/.test(v) && !/^\(.*\)$/.test(v)) return false;
  return /^(?:AED|INR|Rs\.?|USD|EUR|GBP)?\s*-?\(?\d[\d,]*(?:\.\d+)?\)?%?$/i.test(v);
}

function parseMetricLine(line: string): { label: string; value: string } | null {
  const cleaned = line.replace(/^\s*[-*+]\s+/, "").replace(/^\s*\d+\.\s+/, "").trim();
  // **Total Students:** 13  (colon often inside the bold markers)
  const bold = cleaned.match(/^\*\*(.+?)\*\*:?\s*[:—\-]?\s+(.+)$/);
  if (bold) {
    const label = stripInlineMarkdown((bold[1] || "").replace(/[:—\-]\s*$/, ""));
    const value = stripInlineMarkdown(bold[2] || "");
    if (label && value && looksLikeMetricLabel(label) && looksLikeMetricValue(value)) {
      return { label, value };
    }
  }
  const plain = cleaned.match(/^([A-Za-z][A-Za-z0-9 /&().-]{1,48})\s*[:—]\s+(.+)$/);
  if (plain) {
    const label = stripInlineMarkdown(plain[1] || "");
    const value = stripInlineMarkdown(plain[2] || "");
    if (label && value && looksLikeMetricLabel(label) && looksLikeMetricValue(value)) {
      return { label, value };
    }
  }
  return null;
}

/**
 * Parse assistant markdown into structured PDF blocks (no raw ### / ** left behind).
 */
export function parseAssistantMarkdown(content: string): PdfBlock[] {
  const raw = content.replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const lines = raw.split("\n");
  const blocks: PdfBlock[] = [];
  let i = 0;
  let sawHeading = false;

  const flushParagraph = (buf: string[]) => {
    const text = stripInlineMarkdown(buf.join(" ").trim());
    if (!text) return;
    const hasIntroOrHeading = blocks.some((b) => b.kind === "intro" || b.kind === "heading");
    if (!sawHeading && !hasIntroOrHeading) {
      const intro: PdfBlock = { kind: "intro", text };
      blocks.push(intro);
    } else {
      const paragraph: PdfBlock = { kind: "paragraph", text };
      blocks.push(paragraph);
    }
  };

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ kind: "rule" });
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      sawHeading = true;
      const level = Math.min(3, heading[1]!.length) as 1 | 2 | 3;
      let title = stripInlineMarkdown(heading[2] || "");
      title = title.replace(/^\d+\.\s*/, "").trim();
      if (title) blocks.push({ kind: "heading", text: title, level });
      i += 1;
      continue;
    }

    const linkOnly = trimmed.match(/^\*{0,2}\[([^\]]+)\]\(([^)]+)\)\*{0,2}$/);
    if (linkOnly) {
      blocks.push({
        kind: "action",
        label: stripInlineMarkdown(linkOnly[1] || "Open"),
        href: (linkOnly[2] || "").trim() || undefined,
      });
      i += 1;
      continue;
    }

    const metric = parseMetricLine(trimmed);
    if (metric && metric.label && metric.value) {
      // Collect consecutive metric lines into individual metric blocks
      blocks.push({ kind: "metric", label: metric.label, value: metric.value });
      i += 1;
      continue;
    }

    const listMatch = trimmed.match(/^([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /^\d+\./.test(listMatch[1] || "");
      const rawItems: string[] = [];
      while (i < lines.length) {
        const cur = (lines[i] ?? "").trim();
        const m = cur.match(/^([-*+]|\d+\.)\s+(.+)$/);
        if (!m) break;
        rawItems.push(m[2] || "");
        i += 1;
      }

      // Bullet metrics like "- **Total Income:** AED 90,100" → KPI cards
      const asMetrics = rawItems.map((item) => parseMetricLine(item));
      if (
        asMetrics.length >= 2 &&
        asMetrics.every((m) => m && m.label && m.value)
      ) {
        for (const m of asMetrics) {
          if (m) blocks.push({ kind: "metric", label: m.label, value: m.value });
        }
        continue;
      }

      const items: string[] = [];
      for (const item of rawItems) {
        const link = parseMarkdownLink(item);
        if (link && /^\s*\[[^\]]+\]\([^)]+\)\s*$/.test(item.trim())) {
          items.push(link.label);
        } else {
          items.push(stripInlineMarkdown(item));
        }
      }
      if (items.length) blocks.push({ kind: "list", ordered, items: items.filter(Boolean) });
      continue;
    }

    // Paragraph: gather until blank / structural line
    const buf: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = (lines[i] ?? "").trim();
      if (!next) break;
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(next)) break;
      if (/^#{1,3}\s+/.test(next)) break;
      if (/^([-*+]|\d+\.)\s+/.test(next)) break;
      if (/^\*{0,2}\[[^\]]+\]\([^)]+\)\*{0,2}$/.test(next)) break;
      if (parseMetricLine(next)) break;
      buf.push(next);
      i += 1;
    }
    flushParagraph(buf);
  }

  return blocks;
}

function collectKpisFromBlocks(blocks?: FeezoUiBlock[]): KpiCard[] {
  const out: KpiCard[] = [];
  for (const b of blocks ?? []) {
    if (b.type !== "cards") continue;
    for (const item of b.items) {
      out.push({
        title: pdfSafeText(item.title || "Metric"),
        value: pdfSafeText(item.value || "—"),
        subtitle: item.subtitle ? pdfSafeText(item.subtitle) : undefined,
      });
    }
  }
  return out;
}

function collectKpisFromMarkdown(parsed: PdfBlock[]): KpiCard[] {
  return parsed
    .filter((b): b is Extract<PdfBlock, { kind: "metric" }> => b.kind === "metric")
    .map((b) => ({ title: b.label, value: b.value }));
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need <= pageH - PAGE_BOTTOM) return y;
  doc.addPage();
  return 40;
}

function drawFooter(doc: jsPDF, school: string) {
  const pageCount = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, pageH - 36, pageW - MARGIN, pageH - 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Confidential · Generated with Feezo AI · ${pdfSafeText(school)}`, MARGIN, pageH - 22);
    doc.text(`Page ${i} of ${pageCount}`, pageW - MARGIN, pageH - 22, { align: "right" });
  }
}

function drawHeader(doc: jsPDF, opts: { school: string; branch?: string; when: string }): number {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageW, 6, "F");

  let y = 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEAL_DARK);
  doc.text("FEEZO AI", MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Executive briefing", pageW - MARGIN, y, { align: "right" });
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...SLATE);
  const schoolLines = doc.splitTextToSize(pdfSafeText(opts.school), pageW - MARGIN * 2) as string[];
  doc.text(schoolLines, MARGIN, y);
  y += schoolLines.length * 20 + 4;

  const meta: string[] = [];
  if (opts.branch) meta.push(pdfSafeText(opts.branch));
  meta.push(`Generated ${opts.when}`);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(meta.join("  ·  "), MARGIN, y);
  y += 14;

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  return y + 20;
}

function drawSectionLabel(doc: jsPDF, label: string, y: number): number {
  y = ensureSpace(doc, y, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEAL_DARK);
  doc.text(label.toUpperCase(), MARGIN, y);
  return y + 14;
}

function drawIntro(doc: jsPDF, text: string, startY: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - MARGIN * 2;
  let y = drawSectionLabel(doc, "Executive summary", startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...SLATE);
  const lines = doc.splitTextToSize(text, maxW - 28) as string[];
  const boxH = Math.max(36, lines.length * 14 + 22);
  y = ensureSpace(doc, y, boxH + 8);

  doc.setFillColor(...SURFACE);
  doc.setDrawColor(...LINE);
  doc.roundedRect(MARGIN, y, maxW, boxH, 8, 8, "FD");
  doc.setFillColor(...TEAL);
  doc.rect(MARGIN, y + 10, 3, boxH - 20, "F");
  doc.text(lines, MARGIN + 16, y + 18);
  return y + boxH + 18;
}

function drawKpiGrid(doc: jsPDF, cards: KpiCard[], startY: number): number {
  if (!cards.length) return startY;

  const pageW = doc.internal.pageSize.getWidth();
  const gap = 10;
  const colW = (pageW - MARGIN * 2 - gap * 2) / 3;
  const cardH = 58;
  let y = drawSectionLabel(doc, "Key figures", startY);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]!;
    const col = i % 3;
    if (col === 0 && i > 0) y += cardH + gap;
    if (col === 0) y = ensureSpace(doc, y, cardH + 8);

    const x = MARGIN + col * (colW + gap);

    doc.setFillColor(...WHITE);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.7);
    doc.roundedRect(x, y, colW, cardH, 7, 7, "FD");
    doc.setFillColor(...TEAL);
    doc.rect(x, y + 8, 2.5, cardH - 16, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    const title = doc.splitTextToSize(card.title.toUpperCase(), colW - 22) as string[];
    doc.text(title[0] ?? "", x + 12, y + 16);

    const negative = looksNegativeMoney(card.value);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...(negative ? ROSE : SLATE));
    const valueLines = doc.splitTextToSize(card.value, colW - 22) as string[];
    doc.text(valueLines[0] ?? "—", x + 12, y + 34);

    if (card.subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      const sub = doc.splitTextToSize(card.subtitle, colW - 22) as string[];
      doc.text(sub[0] ?? "", x + 12, y + 48);
    }
  }

  const rows = Math.ceil(cards.length / 3);
  return y + (rows > 0 ? cardH + 22 : 0);
}

function drawHeading(doc: jsPDF, text: string, level: 1 | 2 | 3, y: number): number {
  const size = level === 1 ? 13 : level === 2 ? 11.5 : 10.5;
  y = ensureSpace(doc, y, 28);
  if (level <= 2) {
    doc.setFillColor(...TEAL);
    doc.circle(MARGIN + 3, y - 3, 2.2, "F");
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  doc.setTextColor(...SLATE);
  const pageW = doc.internal.pageSize.getWidth();
  const lines = doc.splitTextToSize(text, pageW - MARGIN * 2 - (level <= 2 ? 14 : 0)) as string[];
  doc.text(lines, MARGIN + (level <= 2 ? 12 : 0), y);
  return y + lines.length * (size + 3) + 8;
}

function drawParagraph(doc: jsPDF, text: string, y: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - MARGIN * 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  const lines = doc.splitTextToSize(text, maxW) as string[];
  for (const line of lines) {
    y = ensureSpace(doc, y, 14);
    doc.text(line, MARGIN, y);
    y += 13;
  }
  return y + 8;
}

function drawList(doc: jsPDF, ordered: boolean, items: string[], y: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - MARGIN * 2 - 18;

  items.forEach((item, idx) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE);
    const lines = doc.splitTextToSize(item, maxW) as string[];
    y = ensureSpace(doc, y, lines.length * 13 + 4);

    if (ordered) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEAL_DARK);
      doc.text(`${idx + 1}.`, MARGIN, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...SLATE);
    } else {
      doc.setFillColor(...TEAL);
      doc.circle(MARGIN + 3, y - 2.5, 1.6, "F");
    }

    doc.text(lines, MARGIN + 16, y);
    y += lines.length * 13 + 5;
  });
  return y + 6;
}

function drawAction(doc: jsPDF, label: string, href: string | undefined, y: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - MARGIN * 2;
  y = ensureSpace(doc, y, 28);

  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(MARGIN, y, maxW, 24, 6, 6, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEAL_DARK);
  const text = href?.startsWith("http") ? `${label}  →  ${href}` : `Open in Feezo · ${label}`;
  const lines = doc.splitTextToSize(text, maxW - 20) as string[];
  doc.text(lines[0] ?? label, MARGIN + 10, y + 15);
  return y + 32;
}

function drawParsedContent(doc: jsPDF, parsed: PdfBlock[], startY: number, kpisDrawn: boolean): number {
  let y = startY;
  let sectionOpen = false;
  // Skip metric blocks if already shown as KPI cards
  const skipMetrics = kpisDrawn;

  for (const block of parsed) {
    if (block.kind === "metric" && skipMetrics) continue;
    if (block.kind === "intro") continue; // drawn separately

    if (block.kind === "rule") {
      y = ensureSpace(doc, y, 16);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.6);
      doc.line(MARGIN, y, doc.internal.pageSize.getWidth() - MARGIN, y);
      y += 14;
      continue;
    }

    if (block.kind === "heading") {
      if (!sectionOpen) {
        y = drawSectionLabel(doc, "Details & guidance", y);
        sectionOpen = true;
      }
      y = drawHeading(doc, block.text, block.level, y);
      continue;
    }

    if (block.kind === "paragraph") {
      y = drawParagraph(doc, block.text, y);
      continue;
    }

    if (block.kind === "list") {
      y = drawList(doc, block.ordered, block.items, y);
      continue;
    }

    if (block.kind === "metric") {
      y = drawParagraph(doc, `${block.label}: ${block.value}`, y);
      continue;
    }

    if (block.kind === "action") {
      y = drawAction(doc, block.label, block.href, y);
    }
  }

  return y;
}

function drawTables(doc: jsPDF, blocks: FeezoUiBlock[] | undefined, startY: number): number {
  let y = startY;

  for (const block of blocks ?? []) {
    if (block.type !== "table") continue;

    y = ensureSpace(doc, y, 80);

    if (block.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...TEAL_DARK);
      doc.text(pdfSafeText(block.title).toUpperCase(), MARGIN, y);
      y += 10;
    }

    autoTable(doc, {
      startY: y,
      head: [block.columns.map((c) => pdfSafeText(String(c)))],
      body: block.rows.map((row) => row.map((c) => pdfSafeText(c == null ? "" : String(c)))),
      margin: { left: MARGIN, right: MARGIN },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
        textColor: SLATE,
        lineColor: LINE,
        lineWidth: 0.4,
      },
      headStyles: {
        fillColor: TEAL,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: SURFACE },
      tableLineColor: LINE,
      tableLineWidth: 0.3,
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = (finalY ?? y) + 18;
  }

  return y;
}

function drawExtraText(doc: jsPDF, blocks: FeezoUiBlock[] | undefined, startY: number): number {
  let y = startY;

  for (const block of blocks ?? []) {
    if (block.type !== "text" || !block.text) continue;
    const parsed = parseAssistantMarkdown(block.text);
    const intro = parsed.find((b) => b.kind === "intro");
    if (intro?.kind === "intro") y = drawParagraph(doc, intro.text, y);
    y = drawParsedContent(doc, parsed, y, false);
  }
  return y;
}

/**
 * Professional Feezo AI PDF — branded header, executive summary, KPI grid,
 * structured guidance (markdown parsed), tables.
 */
export function downloadFeezoAiPdf(input: FeezoAiPdfInput): void {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const school = input.schoolName?.trim() || "School";
  const when = formatWhen();

  let y = drawHeader(doc, {
    school,
    branch: input.branchName?.trim() || undefined,
    when,
  });

  const parsed = parseAssistantMarkdown(input.content || "");
  const intro =
    parsed.find((b): b is Extract<PdfBlock, { kind: "intro" }> => b.kind === "intro")?.text ||
    (parsed.length === 0
      ? pdfSafeText(input.content) || (input.locale === "ml" ? "Reply" : "Assistant reply")
      : "");

  if (intro) {
    y = drawIntro(doc, intro, y);
  }

  const kpisFromUi = collectKpisFromBlocks(input.blocks);
  const kpisFromMd = collectKpisFromMarkdown(parsed);
  const kpis = kpisFromUi.length ? kpisFromUi : kpisFromMd;
  y = drawKpiGrid(doc, kpis, y);

  y = drawParsedContent(doc, parsed, y, kpisFromMd.length > 0 && kpisFromUi.length === 0);
  y = drawTables(doc, input.blocks, y);
  drawExtraText(doc, input.blocks, y);

  drawFooter(doc, school);

  const stamp = todayStamp();
  const safeSchool = pdfSafeText(school)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  void saveFile(doc.output("blob"), `feezo-ai-${safeSchool || "report"}-${stamp}.pdf`);
}
