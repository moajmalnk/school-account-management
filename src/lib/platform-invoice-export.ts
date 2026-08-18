import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { formatDownloadFilename, todayStamp } from "@/lib/download-names";

export type PlatformInvoiceDoc = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  periodLabel: string;
  billingCycle: string;
  pricingModel?: string | null;
  currency: string;
  studentsBilled: number;
  ratePerStudent: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  status: string;
  paymentMethod?: string | null;
  paidAt?: string | null;
  paymentRef?: string | null;
  receiptNumber?: string | null;
  notes?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
};

const INK = {
  teal: [15, 118, 110] as [number, number, number],
  tealSoft: [240, 253, 250] as [number, number, number],
  tealRow: [204, 251, 241] as [number, number, number],
  ink: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  line: [226, 232, 240] as [number, number, number],
  field: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/** Strip glyphs Helvetica cannot draw (₹, ·, fancy dashes) that break PDF alignment. */
export function pdfSafe(text: string): string {
  return String(text ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[·•∙]/g, " | ")
    .replace(/[−–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function formatAmount(amount: number): string {
  const n = Math.round(Math.abs(amount));
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** ASCII-safe money for PDF (never use ₹ in Helvetica). */
export function platformMoney(currency: string, amount: number): string {
  const n = formatAmount(amount);
  if (currency === "INR") return `Rs. ${n}`;
  if (currency === "USD") return `USD ${n}`;
  if (currency === "EUR") return `EUR ${n}`;
  return `${pdfSafe(currency)} ${n}`;
}

export function isFlatPricing(invoice: PlatformInvoiceDoc): boolean {
  return (
    invoice.pricingModel === "flat_cycle" ||
    /flat per cycle|flat period/i.test(invoice.periodLabel || "")
  );
}

export function platformLineDescription(invoice: PlatformInvoiceDoc): string {
  if (isFlatPricing(invoice)) {
    return `Flat period licence (${pdfSafe(invoice.billingCycle)})`;
  }
  const seats = invoice.studentsBilled;
  const seatLabel = seats === 1 ? "1 student" : `${formatAmount(seats)} students`;
  return `Seat licence - ${seatLabel} x ${platformMoney(invoice.currency, invoice.ratePerStudent)}`;
}

export function platformCoverLine(invoice: PlatformInvoiceDoc): string {
  if (isFlatPricing(invoice)) {
    return `Covers flat ${pdfSafe(invoice.billingCycle).toLowerCase()} platform licence.`;
  }
  const seats = invoice.studentsBilled;
  const seatLabel = seats === 1 ? "1 seat" : `${formatAmount(seats)} seats`;
  return `Covers ${seatLabel} - ${pdfSafe(invoice.billingCycle)} licence.`;
}

type Layout = {
  doc: jsPDF;
  pageW: number;
  pageH: number;
  margin: number;
  contentW: number;
  colGap: number;
  colW: number;
  leftX: number;
  rightX: number;
};

function createLayout(): Layout {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth(); // ~210
  const pageH = doc.internal.pageSize.getHeight(); // ~297
  const margin = 14;
  const contentW = pageW - margin * 2;
  const colGap = 10;
  const colW = (contentW - colGap) / 2;
  return {
    doc,
    pageW,
    pageH,
    margin,
    contentW,
    colGap,
    colW,
    leftX: margin,
    rightX: margin + colW + colGap,
  };
}

function drawDocHeader(
  layout: Layout,
  title: string,
  leftMeta: string,
  rightMeta: string,
) {
  const { doc, pageW, margin, contentW } = layout;
  doc.setFillColor(...INK.teal);
  doc.rect(0, 0, pageW, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK.white);
  doc.text(pdfSafe(title), margin, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(204, 251, 241);
  doc.text(pdfSafe(leftMeta), margin, 18.5, { maxWidth: contentW * 0.58 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK.white);
  doc.text(pdfSafe(rightMeta), pageW - margin, 11, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(186, 230, 223);
  doc.text("Feezo Platform", pageW - margin, 18.5, { align: "right" });
}

function drawWrappedLines(
  doc: jsPDF,
  lines: string[],
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight = 4.8,
) {
  let y = startY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK.ink);
  for (const raw of lines) {
    const line = pdfSafe(raw);
    if (!line) continue;
    const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
    for (const part of wrapped) {
      doc.text(part, x, y);
      y += lineHeight;
    }
  }
  return y;
}

function drawPartyColumns(
  layout: Layout,
  y: number,
  left: { title: string; lines: string[] },
  right: { title: string; lines: string[] },
) {
  const { doc, leftX, rightX, colW, margin, contentW } = layout;

  doc.setDrawColor(...INK.line);
  doc.setLineWidth(0.25);
  doc.line(margin, y - 3, margin + contentW, y - 3);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK.muted);
  doc.text(pdfSafe(left.title).toUpperCase(), leftX, y + 2);
  doc.text(pdfSafe(right.title).toUpperCase(), rightX, y + 2);

  const bodyY = y + 8;
  const leftEnd = drawWrappedLines(doc, left.lines, leftX, bodyY, colW - 1);
  const rightEnd = drawWrappedLines(doc, right.lines, rightX, bodyY, colW - 1);
  const end = Math.max(leftEnd, rightEnd) + 3;
  doc.line(margin, end, margin + contentW, end);
  return end + 5;
}

function drawMetaGrid(layout: Layout, y: number, pairs: Array<[string, string]>) {
  const { doc, margin, contentW } = layout;
  const cols = 2;
  const labelW = 28;
  const gap = 6;
  const cellW = (contentW - gap) / cols;
  const rowH = 11;
  const rows = Math.ceil(pairs.length / cols);
  const boxH = rows * rowH + 4;

  doc.setFillColor(...INK.field);
  doc.setDrawColor(...INK.line);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y, contentW, boxH, 2, 2, "FD");

  pairs.forEach(([label, value], i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = margin + 3 + col * (cellW + gap);
    const cy = y + 4.5 + row * rowH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...INK.muted);
    doc.text(pdfSafe(label), x, cy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK.ink);
    const text = pdfSafe(value || "-");
    const wrapped = doc.splitTextToSize(text, cellW - labelW) as string[];
    doc.text(wrapped[0] || "-", x + labelW, cy);
  });

  return y + boxH + 6;
}

function drawFooter(layout: Layout, note?: string | null) {
  const { doc, pageH, margin, contentW, pageW } = layout;
  const footerY = pageH - 12;
  doc.setDrawColor(...INK.line);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...INK.muted);
  if (note) {
    const wrapped = doc.splitTextToSize(`Notes: ${pdfSafe(note)}`, contentW * 0.55) as string[];
    doc.text(wrapped, margin, footerY);
  }
  doc.text("Generated by Feezo Control Plane", pageW - margin, footerY, {
    align: "right",
  });
}

function lastTableY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function amountTable(
  doc: jsPDF,
  startY: number,
  margin: number,
  contentW: number,
  rows: string[][],
  opts?: { highlightBody?: boolean },
) {
  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin },
    tableWidth: contentW,
    head: [["Description", "Amount"]],
    body: rows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      cellPadding: { top: 4.5, right: 5, bottom: 4.5, left: 5 },
      lineColor: INK.line,
      lineWidth: 0.25,
      textColor: INK.ink,
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: INK.teal,
      textColor: INK.white,
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
    },
    bodyStyles: opts?.highlightBody ? { fillColor: INK.tealRow } : undefined,
    alternateRowStyles: opts?.highlightBody ? undefined : { fillColor: INK.tealSoft },
    columnStyles: {
      0: { cellWidth: contentW * 0.7, halign: "left" },
      1: { cellWidth: contentW * 0.3, halign: "right", fontStyle: "bold" },
    },
  });
}

function totalBar(
  doc: jsPDF,
  startY: number,
  margin: number,
  contentW: number,
  label: string,
  amount: string,
) {
  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin },
    tableWidth: contentW,
    body: [
      [
        {
          content: pdfSafe(label),
          styles: {
            fontStyle: "bold",
            textColor: INK.white,
            fillColor: INK.teal,
            cellPadding: { top: 7, right: 8, bottom: 7, left: 8 },
            fontSize: 11,
          },
        },
        {
          content: pdfSafe(amount),
          styles: {
            fontStyle: "bold",
            textColor: INK.white,
            fillColor: INK.teal,
            halign: "right",
            cellPadding: { top: 7, right: 8, bottom: 7, left: 8 },
            fontSize: 12,
          },
        },
      ],
    ],
    theme: "plain",
    styles: { overflow: "linebreak", font: "helvetica" },
    columnStyles: {
      0: { cellWidth: contentW * 0.55 },
      1: { cellWidth: contentW * 0.45 },
    },
  });
}

function buildInvoiceDoc(
  invoice: PlatformInvoiceDoc,
  opts?: { schoolHost?: string },
): jsPDF {
  const layout = createLayout();
  const { doc, margin, contentW } = layout;
  const school = invoice.tenantName || "School tenant";

  drawDocHeader(
    layout,
    "TAX INVOICE",
    `${invoice.invoiceNumber}  |  ${invoice.status}`,
    platformMoney(invoice.currency, invoice.total),
  );

  let y = 34;
  y = drawPartyColumns(
    layout,
    y,
    {
      title: "Billed to",
      lines: [
        school,
        invoice.tenantId ? `Tenant ${invoice.tenantId}` : "",
        opts?.schoolHost || "",
      ].filter(Boolean),
    },
    {
      title: "From",
      lines: [
        "Feezo",
        "SaaS subscription billing",
        "support@schoolaccounts.in",
      ],
    },
  );

  y = drawMetaGrid(layout, y, [
    ["Issue date", invoice.issueDate],
    ["Due date", invoice.dueDate],
    ["Period", invoice.periodLabel || invoice.billingCycle],
    ["Cycle", invoice.billingCycle],
  ]);

  amountTable(doc, y, margin, contentW, [
    [platformLineDescription(invoice), platformMoney(invoice.currency, invoice.subtotal)],
    [
      `Discount (${invoice.discountPercent}%)`,
      `- ${platformMoney(invoice.currency, invoice.discountAmount)}`,
    ],
    [
      `Tax / GST (${invoice.taxPercent}%)`,
      platformMoney(invoice.currency, invoice.taxAmount),
    ],
  ]);

  totalBar(
    doc,
    lastTableY(doc) + 5,
    margin,
    contentW,
    "Total due",
    platformMoney(invoice.currency, invoice.total),
  );

  drawFooter(layout, invoice.notes);
  return doc;
}

function buildReceiptDoc(
  invoice: PlatformInvoiceDoc,
  opts?: { schoolHost?: string },
): jsPDF {
  if (invoice.status !== "Paid" || !invoice.receiptNumber) {
    throw new Error("Receipt is only available for paid invoices");
  }

  const layout = createLayout();
  const { doc, margin, contentW } = layout;
  const school = invoice.tenantName || "School tenant";
  const paidAt = invoice.paidAt
    ? String(invoice.paidAt).slice(0, 16).replace("T", " ")
    : "-";

  drawDocHeader(
    layout,
    "PAYMENT RECEIPT",
    `${invoice.receiptNumber}  |  Paid`,
    platformMoney(invoice.currency, invoice.total),
  );

  let y = 34;
  y = drawPartyColumns(
    layout,
    y,
    {
      title: "Received from",
      lines: [
        school,
        invoice.tenantId ? `Tenant ${invoice.tenantId}` : "",
        opts?.schoolHost || "",
      ].filter(Boolean),
    },
    {
      title: "Received by",
      lines: [
        "Feezo",
        "Subscription settlement",
        "accounts@schoolaccounts.in",
      ],
    },
  );

  y = drawMetaGrid(layout, y, [
    ["Invoice", invoice.invoiceNumber],
    ["Paid at", paidAt],
    ["Method", invoice.paymentMethod || "-"],
    ["Reference", invoice.paymentRef || "-"],
    ["Period", invoice.periodLabel || invoice.billingCycle],
    ["Cycle", invoice.billingCycle],
  ]);

  amountTable(
    doc,
    y,
    margin,
    contentW,
    [[platformLineDescription(invoice), platformMoney(invoice.currency, invoice.total)]],
    { highlightBody: true },
  );

  totalBar(
    doc,
    lastTableY(doc) + 5,
    margin,
    contentW,
    "Amount received",
    platformMoney(invoice.currency, invoice.total),
  );

  const thanksY = lastTableY(doc) + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK.muted);
  doc.text(pdfSafe(platformCoverLine(invoice)), margin, thanksY, { maxWidth: contentW });
  doc.text(
    "Thank you for your payment. This receipt confirms settlement of the invoice above.",
    margin,
    thanksY + 5.5,
    { maxWidth: contentW },
  );

  drawFooter(layout, invoice.notes);
  return doc;
}

export function downloadPlatformInvoicePdf(
  invoice: PlatformInvoiceDoc,
  opts?: { schoolHost?: string },
) {
  buildInvoiceDoc(invoice, opts).save(
    formatDownloadFilename("platformInvoice", "pdf", {
      id: invoice.invoiceNumber || "invoice",
      name: invoice.tenantName || undefined,
      school: invoice.tenantName || undefined,
      date: todayStamp(),
    }),
  );
}

export function downloadPlatformReceiptPdf(
  invoice: PlatformInvoiceDoc,
  opts?: { schoolHost?: string },
) {
  const doc = buildReceiptDoc(invoice, opts);
  doc.save(
    formatDownloadFilename("platformReceipt", "pdf", {
      id: invoice.receiptNumber || invoice.invoiceNumber || "receipt",
      name: invoice.tenantName || undefined,
      school: invoice.tenantName || undefined,
      date: todayStamp(),
    }),
  );
}
