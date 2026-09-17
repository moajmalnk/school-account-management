import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { FeezoLocale, FeezoUiBlock } from "@/lib/api/ai";
import { todayStamp } from "@/lib/download-names";

const TEAL: [number, number, number] = [15, 118, 110];
const TEAL_DARK: [number, number, number] = [17, 94, 89];
const SLATE: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const SURFACE: [number, number, number] = [248, 250, 252];
const ROSE: [number, number, number] = [190, 18, 60];

export type FeezoAiPdfInput = {
  locale: FeezoLocale;
  content: string;
  blocks?: FeezoUiBlock[];
  schoolName?: string;
  branchName?: string;
};

/** Helvetica cannot draw ₹ or Malayalam — normalize for a clean PDF. */
export function pdfSafeText(input: string): string {
  return input
    .replace(/\u20B9/g, "Rs.")
    .replace(/₹/g, "Rs.")
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

function collectKpis(blocks?: FeezoUiBlock[]): KpiCard[] {
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

function drawFooter(doc: jsPDF, school: string) {
  const pageCount = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(40, pageH - 36, pageW - 40, pageH - 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Generated with Feezo AI · ${pdfSafeText(school)}`, 40, pageH - 22);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 40, pageH - 22, { align: "right" });
  }
}

function drawHeader(
  doc: jsPDF,
  opts: { school: string; branch?: string; when: string },
): number {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Top brand bar
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageW, 6, "F");

  let y = 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEAL_DARK);
  doc.text("FEEZO AI", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Assistant report", pageW - margin, y, { align: "right" });
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...SLATE);
  const schoolLines = doc.splitTextToSize(pdfSafeText(opts.school), pageW - margin * 2) as string[];
  doc.text(schoolLines, margin, y);
  y += schoolLines.length * 18 + 2;

  if (opts.branch) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafeText(opts.branch), margin, y);
    y += 14;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Generated ${opts.when}`, margin, y);
  y += 12;

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  return y + 18;
}

function drawSummary(doc: jsPDF, text: string, startY: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const maxW = pageW - margin * 2;
  let y = startY;

  const safe = pdfSafeText(text);
  if (!safe) return y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEAL_DARK);
  doc.text("SUMMARY", margin, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  const lines = doc.splitTextToSize(safe, maxW - 24) as string[];
  const boxH = lines.length * 13 + 20;

  if (y + boxH > pageH - 48) {
    doc.addPage();
    y = 40;
  }

  doc.setFillColor(...SURFACE);
  doc.setDrawColor(...LINE);
  doc.roundedRect(margin, y, maxW, boxH, 6, 6, "FD");
  doc.text(lines, margin + 12, y + 16);
  return y + boxH + 18;
}

function drawKpiGrid(doc: jsPDF, cards: KpiCard[], startY: number): number {
  if (!cards.length) return startY;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const gap = 10;
  const colW = (pageW - margin * 2 - gap) / 2;
  const cardH = 64;
  let y = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEAL_DARK);
  doc.text("KEY FIGURES", margin, y);
  y += 14;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]!;
    const col = i % 2;
    if (col === 0 && i > 0) y += cardH + gap;

    if (y + cardH > pageH - 48) {
      doc.addPage();
      y = 40;
    }

    const x = margin + col * (colW + gap);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.7);
    doc.roundedRect(x, y, colW, cardH, 6, 6, "FD");

    // Left accent
    doc.setFillColor(...TEAL);
    doc.rect(x, y + 8, 3, cardH - 16, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(card.title.toUpperCase(), x + 14, y + 16);

    const negative = looksNegativeMoney(card.value);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...(negative ? ROSE : SLATE));
    const valueLines = doc.splitTextToSize(card.value, colW - 28) as string[];
    doc.text(valueLines[0] ?? "—", x + 14, y + 34);

    if (card.subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      const sub = doc.splitTextToSize(card.subtitle, colW - 28) as string[];
      doc.text(sub[0] ?? "", x + 14, y + 50);
    }
  }

  const rows = Math.ceil(cards.length / 2);
  return y + (rows > 0 ? cardH + 20 : 0);
}

function drawTables(doc: jsPDF, blocks: FeezoUiBlock[] | undefined, startY: number): number {
  let y = startY;
  const margin = 40;

  for (const block of blocks ?? []) {
    if (block.type !== "table") continue;

    const pageH = doc.internal.pageSize.getHeight();
    if (y > pageH - 100) {
      doc.addPage();
      y = 40;
    }

    if (block.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...TEAL_DARK);
      doc.text(pdfSafeText(block.title).toUpperCase(), margin, y);
      y += 10;
    }

    autoTable(doc, {
      startY: y,
      head: [block.columns.map((c) => pdfSafeText(String(c)))],
      body: block.rows.map((row) => row.map((c) => pdfSafeText(c == null ? "" : String(c)))),
      margin: { left: margin, right: margin },
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
        textColor: [255, 255, 255],
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
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  for (const block of blocks ?? []) {
    if (block.type !== "text" || !block.text) continue;
    const safe = pdfSafeText(block.text);
    if (!safe) continue;

    const lines = doc.splitTextToSize(safe, pageW - margin * 2) as string[];
    if (y + lines.length * 12 > pageH - 48) {
      doc.addPage();
      y = 40;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 12;
  }
  return y;
}

/**
 * Professional Feezo AI PDF — branded header, summary panel, KPI cards, tables.
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

  const body = pdfSafeText(input.content) || (input.locale === "ml" ? "Reply" : "Reply");
  y = drawSummary(doc, body, y);

  const kpis = collectKpis(input.blocks);
  y = drawKpiGrid(doc, kpis, y);
  y = drawTables(doc, input.blocks, y);
  drawExtraText(doc, input.blocks, y);

  drawFooter(doc, school);

  const stamp = todayStamp();
  const safeSchool = pdfSafeText(school)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  doc.save(`feezo-ai-${safeSchool || "report"}-${stamp}.pdf`);
}
