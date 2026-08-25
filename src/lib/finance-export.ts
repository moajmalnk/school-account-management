import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { apiBaseUrl, getApiToken } from "@/lib/api/client";
import { formatInAppZone, formatNow, isBlankDate, parseAppInstant } from "@/lib/dates";
import { resolveMediaUrl } from "@/lib/media";
import {
  currentPayrollMonth,
  formatPayrollMonthLabel,
  resolvePaymentFeeLines,
  schoolInitials,
  type Payment,
  type SchoolDetails,
  type Staff,
  type Student,
} from "@/lib/tenant-store";
import { getActiveBrandPalette, pdfFontName } from "@/lib/brand-theme";
import {
  defaultSealToPng,
  defaultSignatureSvg,
  svgMarkupToPng,
} from "@/lib/school-marks";
import { formatDownloadFilename, slugYear, todayStamp } from "@/lib/download-names";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type PdfEmitAction = "download" | "print" | "preview";

export function printJsPdf(doc: jsPDF) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = url;
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
    URL.revokeObjectURL(url);
  };

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  iframe.contentWindow?.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 60_000);
}

export function previewJsPdf(doc: jsPDF) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, "_blank", "noopener,noreferrer");
  if (!tab) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked");
  }
  tab.addEventListener("beforeunload", () => URL.revokeObjectURL(url), { once: true });
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export function emitPdf(doc: jsPDF, filename: string, action: PdfEmitAction = "download") {
  if (action === "print") {
    printJsPdf(doc);
  } else if (action === "preview") {
    previewJsPdf(doc);
  } else {
    doc.save(filename);
  }
}

function escapeCsvCell(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

type TablePdfOptions = {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  footer?: string;
  action?: PdfEmitAction;
};

export function downloadTablePdf({
  filename,
  title,
  subtitle,
  headers,
  rows,
  footer,
  action = "download",
}: TablePdfOptions) {
  const brand = getActiveBrandPalette();
  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? "landscape" : "portrait" });
  doc.setFillColor(...brand.primaryRgb);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 3, "F");
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(16);
  doc.setTextColor(...brand.primaryRgb);
  doc.text(title, 14, 18);
  if (subtitle) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 26);
  }
  autoTable(doc, {
    startY: subtitle ? 32 : 24,
    head: [headers],
    body: rows.map((row) => row.map(String)),
    styles: { fontSize: 9, cellPadding: 3, textColor: [15, 23, 42] },
    headStyles: { fillColor: brand.primaryRgb, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: brand.softRgb },
  });
  if (footer) {
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(footer, 14, finalY);
  }
  emitPdf(doc, filename, action);
}

export function printTablePdf(options: Omit<TablePdfOptions, "action">) {
  downloadTablePdf({ ...options, action: "print" });
}

function formatInrPdf(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function pdfSafe(text: string) {
  return String(text ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[·•∙]/g, " | ")
    .replace(/[−–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${TENS[tens]}${ones ? ` ${ONES[ones]}` : ""}`;
}

function indianNumberWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  if (crore) parts.push(`${twoDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigitWords(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigitWords(rest));
  return parts.join(" ");
}

function inrAmountInWords(amount: number): string {
  const abs = Math.abs(Number(amount) || 0);
  const rupees = Math.floor(abs + 1e-9);
  const paise = Math.round((abs - rupees) * 100);
  const rupeeLabel = rupees === 1 ? "Rupee" : "Rupees";
  if (paise <= 0) return `${indianNumberWords(rupees)} ${rupeeLabel} Only`;
  const paiseLabel = paise === 1 ? "Paisa" : "Paise";
  return `${indianNumberWords(rupees)} ${rupeeLabel} and ${indianNumberWords(paise)} ${paiseLabel} Only`;
}

function formatReceiptIssuedAt(raw: string | undefined, fallback: string): string {
  const v = (raw ?? "").trim();
  if (!v || v === "-" || v === "—" || isBlankDate(v)) return fallback;
  if (/^today\b/i.test(v)) return fallback;
  if (/^yesterday\b/i.test(v)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatInAppZone(d, { dateStyle: "medium", timeStyle: "short" });
  }
  const dt = parseAppInstant(v) ?? (v.match(/^\d{4}-\d{2}-\d{2}$/) ? new Date(`${v}T12:00:00+05:30`) : null);
  if (dt && !Number.isNaN(dt.getTime()) && dt.getFullYear() > 1970) {
    return formatInAppZone(dt, { dateStyle: "medium", timeStyle: "short" });
  }
  return pdfSafe(v);
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function canvasPng(img: HTMLImageElement, maxDim = 960) {
  const canvas = document.createElement("canvas");
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) throw new Error("empty image");
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/png"), width, height };
}

async function fetchLogoAsPng(src: string, maxDim = 960) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 6000);
  try {
    const headers: Record<string, string> = {};
    const token = getApiToken();
    const base = apiBaseUrl();
    const crossOrigin =
      typeof window !== "undefined" &&
      (() => {
        try {
          return new URL(src, window.location.href).origin !== window.location.origin;
        } catch {
          return false;
        }
      })();
    if (token && !crossOrigin && (src.startsWith("/") || src.startsWith(base))) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(src, {
      signal: controller.signal,
      credentials: "omit",
      headers,
    });
    if (!res.ok) throw new Error(`logo ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      return canvasPng(await loadHtmlImage(objectUrl), maxDim);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadMediaForPdf(url?: string, maxDim = 960) {
  const original = url?.trim();
  if (!original) return null;
  const resolved = resolveMediaUrl(original);
  if (!resolved) return null;

  const candidates: string[] = [];
  if (original.startsWith("data:")) candidates.push(original);
  else {
    if (original.startsWith("/")) candidates.push(original);
    else if (original.startsWith("uploads/")) candidates.push(`/${original}`);
    if (resolved && !candidates.includes(resolved)) candidates.push(resolved);
  }

  for (const src of candidates) {
    try {
      if (src.startsWith("data:")) return canvasPng(await loadHtmlImage(src), maxDim);
      return await fetchLogoAsPng(src, maxDim);
    } catch {
      // try the next candidate
    }
  }

  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("cors image failed"));
        img.src = resolved;
      });
      return canvasPng(loaded, maxDim);
    } catch {
      return null;
    }
  }
  return null;
}

async function loadLogoForPdf(url?: string) {
  return loadMediaForPdf(url, 960);
}

async function loadLetterheadForPdf(url?: string) {
  return loadMediaForPdf(url, 1400);
}

function receiptLineDescription(line: { description: string; feePeriod?: string }): string {
  const label = pdfSafe(line.description || "Fee Payment");
  const period = pdfSafe(line.feePeriod ?? "").trim();
  if (!period || label.toLowerCase().includes(period.toLowerCase())) {
    return label;
  }
  return `${label} (${period})`;
}

function receiptLineItems(payment: Payment): { description: string; amount: number }[] {
  const lines = resolvePaymentFeeLines(payment);
  if (lines.length) {
    return lines.map((line) => ({
      description: receiptLineDescription(line),
      amount: line.amount,
    }));
  }

  return [
    {
      description: pdfSafe(payment.cat || "Fee Payment"),
      amount: payment.amount,
    },
  ];
}

/** Brand palette for printable finance docs (school primary / secondary). */
function receiptInk() {
  const brand = getActiveBrandPalette();
  return {
    teal: brand.primaryRgb,
    tealDeep: brand.secondaryRgb,
    headerTint: brand.softRgb,
    zebra: [248, 250, 252] as [number, number, number],
    ink: [15, 23, 42] as [number, number, number],
    muted: [100, 116, 139] as [number, number, number],
    line: [226, 232, 240] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };
}

export type ReceiptBranding = {
  logoUrl?: string;
  letterheadUrl?: string;
  sealUrl?: string;
  signatureUrl?: string;
  principalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  affiliationNo?: string;
  registrationNo?: string;
  studentContact?: string;
  studentPlace?: string;
  studentId?: string;
};

export function receiptBrandingFromSchool(
  school: Pick<
    SchoolDetails,
    | "logoUrl"
    | "letterheadUrl"
    | "sealUrl"
    | "signatureUrl"
    | "principalName"
    | "address"
    | "phone"
    | "email"
    | "website"
    | "affiliationNo"
    | "registrationNo"
  >,
  student?: Pick<Student, "id" | "phone" | "address">,
): ReceiptBranding {
  return {
    logoUrl: school.logoUrl,
    letterheadUrl: school.letterheadUrl,
    sealUrl: school.sealUrl,
    signatureUrl: school.signatureUrl,
    principalName: school.principalName,
    address: school.address,
    phone: school.phone,
    email: school.email,
    website: school.website,
    affiliationNo: school.affiliationNo,
    registrationNo: school.registrationNo,
    studentContact: student?.phone,
    studentPlace: student?.address,
    studentId: student?.id,
  };
}

export function findReceiptStudent(
  students: Student[],
  payment: Payment,
): Student | undefined {
  if (payment.payerType === "external") return undefined;
  const name = payment.name.trim().toLowerCase();
  const named = students.filter((s) => s.name.trim().toLowerCase() === name);
  if (!named.length) return undefined;
  if (payment.className) {
    const matched = named.find((s) => s.cls === payment.className);
    if (matched) return matched;
  }
  return named[0];
}

export async function downloadReceiptPdf(
  payment: Payment,
  schoolName: string,
  academicYear: string,
  branding?: ReceiptBranding,
  action: PdfEmitAction = "download",
) {
  const [logo, letterhead] = await Promise.all([
    loadLogoForPdf(branding?.logoUrl),
    loadLetterheadForPdf(branding?.letterheadUrl),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = formatNow();
  const issuedAt = formatReceiptIssuedAt(payment.time, generatedAt);
  const amountFormatted = formatInrPdf(payment.amount);
  const isExternal = payment.payerType === "external";
  const displayName = pdfSafe(schoolName || "School");

  doc.setFillColor(...receiptInk().white);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  const headerBottom = letterhead
    ? drawUploadedLetterheadBanner(doc, pageWidth, letterhead, margin)
    : drawReceiptLetterheadHeader(doc, pageWidth, displayName, branding, logo);

  const barW = Math.min(contentWidth, 92);
  const barH = 10;
  const barX = (pageWidth - barW) / 2;
  const barY = headerBottom + 2;
  doc.setFillColor(...receiptInk().teal);
  doc.roundedRect(barX, barY, barW, barH, 2.4, 2.4, "F");
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(12);
  doc.setTextColor(...receiptInk().white);
  doc.text("Payment Receipt", pageWidth / 2, barY + 6.7, { align: "center" });

  let metaTop = barY + 18;
  if (academicYear) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...receiptInk().muted);
    doc.text(pdfSafe(academicYear), pageWidth / 2, barY + 14.2, { align: "center" });
    metaTop = barY + 20;
  }
  const labelWidth = 30;
  const valueX = margin + labelWidth;
  const leftMax = contentWidth * 0.52 - labelWidth;
  const metaRows: [string, string][] = isExternal
    ? [
        ["Payer Name", pdfSafe(payment.name)],
        ["Payer Type", "External"],
        ["Contact", pdfSafe(branding?.studentContact || "—")],
      ]
    : [
        ["Student Name", pdfSafe(payment.name)],
        ["Class & Div", pdfSafe(payment.className || "—")],
        ["Contact", pdfSafe(branding?.studentContact || "—")],
        ["Place", pdfSafe(branding?.studentPlace || "—")],
      ];

  let metaY = metaTop;
  for (const [label, value] of metaRows) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...receiptInk().muted);
    doc.text(label, margin, metaY);
    doc.setTextColor(...receiptInk().ink);
    doc.text(":", margin + labelWidth - 4, metaY);
    doc.setFont(pdfFontName(), "bold");
    const valueLines = doc.splitTextToSize(value, leftMax) as string[];
    doc.text(valueLines, valueX, metaY);
    metaY += Math.max(6.2, valueLines.length * 4.6 + 1.6);
  }

  const rightX = pageWidth - margin;
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(16);
  doc.setTextColor(...receiptInk().ink);
  doc.text(pdfSafe(payment.id), rightX, metaTop, { align: "right" });
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  doc.text(`Issued ${issuedAt}`, rightX, metaTop + 6.2, { align: "right" });
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...receiptInk().ink);
  doc.text(`Payment Mode: ${pdfSafe(payment.mode || "—")}`, rightX, metaTop + 12.6, {
    align: "right",
  });

  const tableStart = Math.max(metaY, metaTop + 18) + 4;
  const items = receiptLineItems(payment);
  const blankRows = Math.max(3, 6 - items.length);
  const body: (string | number)[][] = [
    ...items.map((item, index) => [
      String(index + 1),
      item.description,
      item.amount.toLocaleString("en-IN"),
    ]),
    ...Array.from({ length: blankRows }, () => ["", "", ""]),
  ];

  autoTable(doc, {
    startY: tableStart,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [["Sl.No", "Description", "Amount"]],
    body,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: { top: 3.6, right: 5, bottom: 3.6, left: 5 },
      lineColor: receiptInk().line,
      lineWidth: 0.18,
      textColor: receiptInk().ink,
      valign: "middle",
      minCellHeight: 8,
    },
    headStyles: {
      fillColor: receiptInk().teal,
      textColor: receiptInk().white,
      fontStyle: "bold",
      fontSize: 9.5,
      halign: "left",
      cellPadding: { top: 4.2, right: 5, bottom: 4.2, left: 5 },
    },
    alternateRowStyles: { fillColor: receiptInk().zebra },
    columnStyles: {
      0: { cellWidth: 22, halign: "center" },
      1: { cellWidth: contentWidth - 22 - 38 },
      2: { cellWidth: 38, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 2) {
        data.cell.styles.halign = "right";
      }
    },
  });

  const tableEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const words = inrAmountInWords(payment.amount);
  const boxW = 78;
  const boxH = 11;
  const boxX = pageWidth - margin - boxW;
  const boxY = tableEnd + 7;
  const wordsMax = contentWidth - boxW - 8;

  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  const wordLines = doc.splitTextToSize(`Amount In Words: ${words}`, wordsMax) as string[];
  doc.text(wordLines, margin, boxY + 4.5);

  doc.setFillColor(...receiptInk().teal);
  doc.roundedRect(boxX, boxY, boxW, boxH, 1.4, 1.4, "F");
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().white);
  doc.text("Amount Received", boxX + 4, boxY + 7);
  doc.setFontSize(11);
  doc.text(amountFormatted, boxX + boxW - 4, boxY + 7.2, { align: "right" });

  const note = pdfSafe(payment.narration || "")
    .replace(/Fee breakdown:.*$/i, "")
    .replace(/(?:^|\s*[·|]\s*)(?:Bank|Cash)\s+(?:Rs\.?|₹)\s*[\d,]+/gi, "")
    .replace(/^[·|\s]+|[·|\s]+$/g, "")
    .trim();
  let afterY = Math.max(boxY + boxH, boxY + wordLines.length * 4.2) + 10;
  if (note) {
    doc.setFont(pdfFontName(), "italic");
    doc.setFontSize(8);
    doc.setTextColor(...receiptInk().muted);
    const noteLines = doc.splitTextToSize(`Note: ${note}`, contentWidth) as string[];
    doc.text(noteLines, margin, afterY);
    afterY += noteLines.length * 4 + 6;
  }

  await drawSealFooter(
    doc,
    pageWidth,
    pageHeight,
    margin,
    afterY,
    generatedAt,
    displayName,
    `For billing queries, contact the ${displayName} accounts office.`,
    false,
    branding,
  );

  emitPdf(
    doc,
    formatDownloadFilename("receipt", "pdf", {
      id: payment.id,
      studentId: branding?.studentId,
      name: payment.name,
      school: schoolName,
      year: slugYear(academicYear),
      date: todayStamp(),
    }),
    action,
  );
}

export async function printReceiptPdf(
  payment: Payment,
  schoolName: string,
  academicYear: string,
  branding?: ReceiptBranding,
) {
  return downloadReceiptPdf(payment, schoolName, academicYear, branding, "print");
}

export async function showReceiptPdf(
  payment: Payment,
  schoolName: string,
  academicYear: string,
  branding?: ReceiptBranding,
) {
  return downloadReceiptPdf(payment, schoolName, academicYear, branding, "preview");
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatPayDateNumeric(raw: string | undefined, fallbackIssued: string): string {
  const v = (raw ?? "").trim();
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso && Number(iso[1]) > 1970) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }
  const issued = formatReceiptIssuedAt(raw, fallbackIssued);
  const named = issued.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (named) {
    const idx = MONTH_ABBR.findIndex((m) => m.toLowerCase() === named[2].toLowerCase());
    if (idx >= 0) {
      return `${named[1].padStart(2, "0")}/${String(idx + 1).padStart(2, "0")}/${named[3]}`;
    }
  }
  const dmy = issued.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dmy) return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`;
  return issued.split(",")[0]?.trim() || fallbackIssued.split(",")[0]?.trim() || fallbackIssued;
}

function payPeriodFromDescription(desc: string): string {
  const iso = desc.match(/\b(20\d{2})-(\d{2})\b/);
  if (iso) return formatPayrollMonthLabel(`${iso[1]}-${iso[2]}`);
  const named = desc.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i,
  );
  if (named) {
    const month = named[1].charAt(0).toUpperCase() + named[1].slice(1).toLowerCase();
    return `${month} ${named[2]}`;
  }
  return formatPayrollMonthLabel(currentPayrollMonth());
}

function padSlipRows(
  items: { label: string; amount: number }[],
  minRows = 4,
): (string | number)[][] {
  const rows = items.map((item, index) => [
    String(index + 1),
    item.label,
    item.amount.toLocaleString("en-IN"),
  ]);
  if (!rows.length) rows.push(["", "Nil", "0"]);
  while (rows.length < minRows) rows.push(["", "", ""]);
  return rows;
}

type PdfLogo = { dataUrl: string; width: number; height: number };

type LogoSlot = {
  width: number;
  height: number;
  drawW: number;
  drawH: number;
  offsetX: number;
  offsetY: number;
};

function pickLogoBounds(logo: PdfLogo | null): { maxW: number; maxH: number } {
  if (!logo) return { maxW: 24, maxH: 24 };
  const aspect = logo.width / Math.max(1, logo.height);
  if (aspect >= 1.35) return { maxW: 58, maxH: 18 };
  if (aspect <= 0.75) return { maxW: 20, maxH: 28 };
  return { maxW: 26, maxH: 26 };
}

function logoSlotMetrics(logo: PdfLogo | null, maxW: number, maxH: number, pad = 1.8): LogoSlot {
  const innerW = Math.max(1, maxW - pad * 2);
  const innerH = Math.max(1, maxH - pad * 2);
  if (!logo) {
    return { width: maxW, height: maxH, drawW: 0, drawH: 0, offsetX: pad, offsetY: pad };
  }
  const scale = Math.min(innerW / logo.width, innerH / logo.height);
  const drawW = logo.width * scale;
  const drawH = logo.height * scale;
  return {
    width: maxW,
    height: maxH,
    drawW,
    drawH,
    offsetX: pad + (innerW - drawW) / 2,
    offsetY: pad + (innerH - drawH) / 2,
  };
}

function drawLogoPlate(
  doc: jsPDF,
  x: number,
  y: number,
  logo: PdfLogo | null,
  initials: string,
  maxW: number,
  maxH: number,
  opts?: {
    plateFill?: [number, number, number];
    stroke?: boolean;
    fallbackFill?: [number, number, number];
  },
): LogoSlot {
  const slot = logoSlotMetrics(logo, maxW, maxH);
  const plateFill = opts?.plateFill ?? receiptInk().white;
  doc.setFillColor(...plateFill);
  if (opts?.stroke !== false) {
    doc.setDrawColor(...receiptInk().line);
    doc.setLineWidth(0.22);
    doc.roundedRect(x, y, slot.width, slot.height, 2.2, 2.2, "FD");
  } else {
    doc.roundedRect(x, y, slot.width, slot.height, 2.2, 2.2, "F");
  }

  if (logo) {
    doc.addImage(
      logo.dataUrl,
      "PNG",
      x + slot.offsetX,
      y + slot.offsetY,
      slot.drawW,
      slot.drawH,
    );
  } else {
    const inset = 1.6;
    doc.setFillColor(...(opts?.fallbackFill ?? receiptInk().teal));
    doc.roundedRect(
      x + inset,
      y + inset,
      slot.width - inset * 2,
      slot.height - inset * 2,
      1.8,
      1.8,
      "F",
    );
    doc.setFont(pdfFontName(), "bold");
    doc.setFontSize(initials.length > 2 ? 9 : 11);
    doc.setTextColor(...receiptInk().white);
    doc.text(initials, x + slot.width / 2, y + slot.height / 2 + 1.2, { align: "center" });
  }
  return slot;
}

function drawUploadedLetterheadBanner(
  doc: jsPDF,
  pageWidth: number,
  letterhead: PdfLogo,
  margin: number,
): number {
  const contentWidth = pageWidth - margin * 2;
  const maxH = 46;
  const aspect = letterhead.width / Math.max(1, letterhead.height);
  let drawW = contentWidth;
  let drawH = drawW / aspect;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH * aspect;
  }
  const x = (pageWidth - drawW) / 2;
  const y = 9;
  doc.addImage(letterhead.dataUrl, "PNG", x, y, drawW, drawH);
  const bottom = y + drawH + 3.5;
  doc.setDrawColor(...receiptInk().line);
  doc.setLineWidth(0.28);
  doc.line(margin, bottom, pageWidth - margin, bottom);
  return bottom + 4.5;
}

function drawDocumentTitleBar(
  doc: jsPDF,
  pageWidth: number,
  contentWidth: number,
  title: string,
  startY: number,
): number {
  const barW = Math.min(contentWidth, Math.max(88, title.length * 4.5 + 30));
  const barH = 10;
  const barX = (pageWidth - barW) / 2;
  doc.setFillColor(...receiptInk().teal);
  doc.roundedRect(barX, startY, barW, barH, 2.4, 2.4, "F");
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(12);
  doc.setTextColor(...receiptInk().white);
  doc.text(title, pageWidth / 2, startY + 6.7, { align: "center" });
  return startY + barH;
}

function drawReceiptLetterheadHeader(
  doc: jsPDF,
  pageWidth: number,
  schoolName: string,
  branding: ReceiptBranding | undefined,
  logo: PdfLogo | null,
): number {
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const displayName = pdfSafe(schoolName || "School");
  const initials = schoolInitials(displayName) || "SC";
  const { maxW, maxH } = pickLogoBounds(logo);
  const logoW = Math.min(maxW, contentWidth * 0.78);
  const logoX = (pageWidth - logoW) / 2;
  let cursorY = 10;

  drawLogoPlate(doc, logoX, cursorY, logo, initials, logoW, maxH);
  cursorY += maxH + 5.5;

  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(displayName.length > 34 ? 14 : 18);
  doc.setTextColor(...receiptInk().tealDeep);
  const nameLines = doc.splitTextToSize(displayName, contentWidth * 0.92) as string[];
  doc.text(nameLines, pageWidth / 2, cursorY, { align: "center" });
  cursorY += nameLines.length * 6.6 + 2.2;

  const address = pdfSafe(branding?.address || "").toUpperCase();
  if (address) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(8);
    doc.setTextColor(...receiptInk().muted);
    const addressLines = doc.splitTextToSize(address, contentWidth * 0.9) as string[];
    doc.text(addressLines, pageWidth / 2, cursorY, { align: "center" });
    cursorY += addressLines.length * 3.7 + 1.4;
  }

  const contactLine = [branding?.phone, branding?.email]
    .map((v) => pdfSafe(v || "").trim())
    .filter(Boolean)
    .join("  |  ");
  if (contactLine) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(...receiptInk().tealDeep);
    doc.text(contactLine, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 5.5;
  }

  cursorY += 2.5;
  doc.setDrawColor(...receiptInk().line);
  doc.setLineWidth(0.25);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  return cursorY + 5;
}

function drawOfficialDocHeader(
  doc: jsPDF,
  pageWidth: number,
  schoolName: string,
  branding: ReceiptBranding | undefined,
  logo: PdfLogo | null,
  badge: string,
): number {
  const margin = 16;
  const displayName = pdfSafe(schoolName || "School");
  const initials = schoolInitials(displayName) || "SC";
  const { maxW, maxH } = pickLogoBounds(logo);
  const logoX = margin;
  const textX = margin + maxW + 8;
  const textWidth = pageWidth - margin - textX;

  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(displayName.length > 32 ? 15 : 20);
  const nameLines = doc.splitTextToSize(displayName, textWidth) as string[];
  const address = pdfSafe(branding?.address || "").toUpperCase();
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.2);
  const addressLines = address ? (doc.splitTextToSize(address, textWidth) as string[]) : [];
  const contactLine = [branding?.phone, branding?.email]
    .map((v) => pdfSafe(v || "").trim())
    .filter(Boolean)
    .join("  |  ");

  let textBottom = 11 + 7;
  textBottom += nameLines.length * 7.2;
  if (addressLines.length) textBottom += addressLines.length * 4.2 + 1.2;
  if (contactLine) textBottom += 5;
  const textBlockH = textBottom - 11;
  const logoY = 11 + Math.max(0, (textBlockH - maxH) / 2);
  const headerH = Math.max(logoY + maxH + 12, textBottom + 12);

  doc.setFillColor(...receiptInk().teal);
  doc.roundedRect(0, -10, pageWidth, headerH + 10, 6, 6, "F");
  doc.setFillColor(...receiptInk().tealDeep);
  doc.rect(0, headerH - 1.2, pageWidth, 1.2, "F");

  drawLogoPlate(doc, logoX, logoY, logo, initials, maxW, maxH, {
    stroke: false,
    fallbackFill: receiptInk().tealDeep,
  });

  let cursorY = logoY + 7;
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(displayName.length > 32 ? 15 : 20);
  doc.setTextColor(...receiptInk().white);
  doc.text(nameLines, textX, cursorY);
  cursorY += nameLines.length * 7.2;

  if (addressLines.length) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(204, 251, 241);
    doc.text(addressLines, textX, cursorY);
    cursorY += addressLines.length * 4.2 + 1.2;
  }
  if (contactLine) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(...receiptInk().white);
    doc.text(contactLine, textX, cursorY);
  }

  const badgeW = Math.min(96, Math.max(56, badge.length * 3.6 + 22));
  const badgeH = 10;
  const badgeX = (pageWidth - badgeW) / 2;
  const badgeY = headerH - 5;
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2.6, 2.6, "F");
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...receiptInk().tealDeep);
  doc.text(badge, pageWidth / 2, badgeY + 6.8, { align: "center" });

  return badgeY + badgeH + 10;
}

function drawMetaPairs(
  doc: jsPDF,
  rows: [string, string][],
  startY: number,
  margin: number,
  leftMax: number,
): number {
  let y = startY;
  const labelWidth = 30;
  const valueX = margin + labelWidth;
  for (const [label, value] of rows) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(9);
    doc.setTextColor(...receiptInk().muted);
    doc.text(label, margin, y);
    doc.setTextColor(...receiptInk().ink);
    doc.text(":", margin + labelWidth - 4, y);
    doc.setFont(pdfFontName(), "bold");
    const lines = doc.splitTextToSize(value, leftMax) as string[];
    doc.text(lines, valueX, y);
    y += Math.max(6, lines.length * 4.4 + 1.4);
  }
  return y;
}

async function loadSchoolMarkPng(
  url: string | undefined,
  fallbackSvg: string,
  width: number,
  height: number,
): Promise<PdfLogo | null> {
  if (url?.trim()) {
    const loaded = await loadLogoForPdf(url);
    if (loaded) return loaded;
  }
  try {
    return await svgMarkupToPng(fallbackSvg, width, height);
  } catch {
    return null;
  }
}

async function loadReceiptSealPng(
  schoolName: string,
  branding?: ReceiptBranding,
): Promise<PdfLogo | null> {
  if (branding?.sealUrl?.trim()) {
    const custom = await loadLogoForPdf(branding.sealUrl);
    if (custom) return custom;
  }
  const logo = branding?.logoUrl ? await loadLogoForPdf(branding.logoUrl) : null;
  try {
    return await defaultSealToPng(schoolName, {
      details: branding?.address,
      logoDataUrl: logo?.dataUrl,
    });
  } catch {
    return null;
  }
}

async function drawSealFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  startY: number,
  generatedAt: string,
  schoolName: string,
  queryLine: string,
  compact = false,
  branding?: ReceiptBranding,
) {
  const markH = compact ? 18 : 24;
  const sealSize = markH;
  const signW = compact ? 42 : 52;
  const [seal, signature] = await Promise.all([
    loadReceiptSealPng(schoolName, branding),
    loadSchoolMarkPng(
      branding?.signatureUrl,
      defaultSignatureSvg(branding?.principalName || "", "#1E293B"),
      480,
      160,
    ),
  ]);

  if (seal) {
    try {
      doc.addImage(seal.dataUrl, "PNG", margin, startY, sealSize, sealSize);
    } catch {
      /* skip unreadable seal */
    }
  }
  if (signature) {
    try {
      doc.addImage(
        signature.dataUrl,
        "PNG",
        pageWidth - margin - signW,
        startY + (markH - markH * 0.72) / 2,
        signW,
        markH * 0.72,
      );
    } catch {
      /* skip unreadable signature */
    }
  }

  doc.setFont(pdfFontName(), "normal");
  doc.setTextColor(...receiptInk().muted);
  const labelY = startY + markH + 5;
  doc.setFontSize(compact ? 8 : 8.5);
  doc.text("Signature", pageWidth - margin - signW / 2, labelY, { align: "center" });
  if (!compact) {
    doc.setFontSize(7.5);
    doc.text(`Document generated on ${generatedAt}`, margin, labelY + 8);
    doc.text(queryLine.replace("{school}", schoolName), margin, labelY + 12.5);
  }
  doc.setFillColor(...receiptInk().teal);
  doc.rect(0, pageHeight - 3.2, pageWidth, 3.2, "F");
}

export type DisbursalDoc = {
  id: string;
  payee: string;
  desc: string;
  amount: number;
  mode: string;
  time: string;
  payeeType?: string;
  status?: string;
};

export type SalarySlipStaff = {
  id: string;
  name: string;
  role?: string;
  dept?: string;
  basicSalary?: number;
  additionalAllowances?: number;
};

function buildSalaryComponents(staff: SalarySlipStaff | null | undefined, netPaid: number) {
  const basic = Math.max(0, Math.round(staff?.basicSalary || 0));
  const allowances = Math.max(0, Math.round(staff?.additionalAllowances || 0));
  const earnings: { label: string; amount: number }[] = [];
  if (basic > 0) earnings.push({ label: "Basic", amount: basic });
  if (allowances > 0) earnings.push({ label: "Allowances", amount: allowances });
  const gross = earnings.reduce((sum, row) => sum + row.amount, 0);
  const deductions: { label: string; amount: number }[] = [];
  if (gross > 0 && netPaid < gross) {
    deductions.push({
      label: "Loss of pay (LOP / unpaid leave & absence)",
      amount: gross - netPaid,
    });
  } else if (gross > 0 && netPaid > gross) {
    earnings.push({ label: "Arrears / additional", amount: netPaid - gross });
  }
  if (!earnings.length) {
    earnings.push({ label: "Salary", amount: netPaid });
  }
  const earningsTotal = earnings.reduce((sum, row) => sum + row.amount, 0);
  const deductionsTotal = deductions.reduce((sum, row) => sum + row.amount, 0);
  return {
    earnings,
    deductions,
    earningsTotal,
    deductionsTotal,
    net: netPaid,
  };
}

export async function downloadSalarySlipPdf(
  payment: DisbursalDoc,
  schoolName: string,
  branding?: ReceiptBranding,
  staff?: SalarySlipStaff | null,
  academicYear?: string,
  action: PdfEmitAction = "download",
) {
  const [logo, letterhead] = await Promise.all([
    loadLogoForPdf(branding?.logoUrl),
    loadLetterheadForPdf(branding?.letterheadUrl),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = formatNow();
  const issuedAt = formatReceiptIssuedAt(payment.time, generatedAt);
  const payDate = formatPayDateNumeric(payment.time, generatedAt);
  const payPeriod = payPeriodFromDescription(payment.desc || "");
  const components = buildSalaryComponents(staff, payment.amount);
  const displayName = pdfSafe(schoolName || "School");

  doc.setFillColor(...receiptInk().white);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  const metaTop = letterhead
    ? drawDocumentTitleBar(
        doc,
        pageWidth,
        contentWidth,
        "Salary Slip",
        drawUploadedLetterheadBanner(doc, pageWidth, letterhead, margin) + 3,
      ) + 8
    : drawOfficialDocHeader(doc, pageWidth, displayName, branding, logo, "Salary Slip");

  const leftRows: [string, string][] = [
    ["Employee Name", pdfSafe(staff?.name || payment.payee)],
    ["Employee Id", pdfSafe(staff?.id || "—")],
    ...(staff?.role ? [["Designation", pdfSafe(staff.role)] as [string, string]] : []),
    ...(staff?.dept ? [["Department", pdfSafe(staff.dept)] as [string, string]] : []),
    ["Pay Period", pdfSafe(payPeriod)],
    ["Pay Date", payDate],
  ];
  const leftEnd = drawMetaPairs(doc, leftRows, metaTop, margin, contentWidth * 0.5 - 32);

  const rightX = pageWidth - margin;
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(14);
  doc.setTextColor(...receiptInk().ink);
  doc.text(pdfSafe(payment.id), rightX, metaTop, { align: "right" });
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  doc.text(`Issued ${issuedAt}`, rightX, metaTop + 6, { align: "right" });
  doc.setFontSize(9.5);
  doc.setTextColor(...receiptInk().ink);
  doc.text(`Payment Mode: ${pdfSafe(payment.mode || "—")}`, rightX, metaTop + 12.2, {
    align: "right",
  });

  const tableStart = Math.max(leftEnd, metaTop + 18) + 4;
  const gap = 6;
  const colW = (contentWidth - gap) / 2;
  const minRows = Math.max(4, components.earnings.length, components.deductions.length || 1);

  autoTable(doc, {
    startY: tableStart,
    margin: { left: margin, right: pageWidth - margin - colW },
    tableWidth: colW,
    head: [["Sl.No", "Earnings", "Amount"]],
    body: padSlipRows(components.earnings, minRows),
    foot: [["", "Total Earnings", formatInrPdf(components.earningsTotal)]],
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: { top: 3.2, right: 4, bottom: 3.2, left: 4 },
      lineColor: receiptInk().line,
      lineWidth: 0.18,
      textColor: receiptInk().ink,
      valign: "middle",
      minCellHeight: 7.4,
    },
    headStyles: {
      fillColor: receiptInk().teal,
      textColor: receiptInk().white,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    footStyles: {
      fillColor: receiptInk().headerTint,
      textColor: receiptInk().tealDeep,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: receiptInk().zebra },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" },
      1: { cellWidth: colW - 16 - 28 },
      2: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if ((data.section === "head" || data.section === "foot") && data.column.index === 2) {
        data.cell.styles.halign = "right";
      }
    },
  });
  const earningsEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: tableStart,
    margin: { left: margin + colW + gap, right: margin },
    tableWidth: colW,
    head: [["Sl.No", "Deductions", "Amount"]],
    body: padSlipRows(components.deductions, minRows),
    foot: [["", "Total Deductions", formatInrPdf(components.deductionsTotal)]],
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: { top: 3.2, right: 4, bottom: 3.2, left: 4 },
      lineColor: receiptInk().line,
      lineWidth: 0.18,
      textColor: receiptInk().ink,
      valign: "middle",
      minCellHeight: 7.4,
    },
    headStyles: {
      fillColor: receiptInk().teal,
      textColor: receiptInk().white,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    footStyles: {
      fillColor: receiptInk().headerTint,
      textColor: receiptInk().tealDeep,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: receiptInk().zebra },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" },
      1: { cellWidth: colW - 16 - 28 },
      2: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if ((data.section === "head" || data.section === "foot") && data.column.index === 2) {
        data.cell.styles.halign = "right";
      }
    },
  });
  const deductionsEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const tablesEnd = Math.max(earningsEnd, deductionsEnd);

  const words = inrAmountInWords(components.net);
  const boxW = 86;
  const boxH = 16;
  const boxX = pageWidth - margin - boxW;
  const boxY = tablesEnd + 8;
  const wordsMax = contentWidth - boxW - 8;

  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  const wordLines = doc.splitTextToSize(`Amount In Words: ${words}`, wordsMax) as string[];
  doc.text(wordLines, margin, boxY + 6);

  doc.setFillColor(...receiptInk().teal);
  doc.roundedRect(boxX, boxY, boxW, boxH, 1.6, 1.6, "F");
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(8);
  doc.setTextColor(...receiptInk().white);
  doc.text("Total Net Payable", boxX + 4, boxY + 5.5);
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(204, 251, 241);
  doc.text("Gross Earnings - Total Deductions", boxX + 4, boxY + 9.4);
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(12);
  doc.setTextColor(...receiptInk().white);
  doc.text(formatInrPdf(components.net), boxX + boxW - 4, boxY + 13.2, { align: "right" });

  let afterY = Math.max(boxY + boxH, boxY + wordLines.length * 4.2) + 8;
  const note = pdfSafe(payment.desc || "").trim();
  if (note) {
    doc.setFont(pdfFontName(), "italic");
    doc.setFontSize(8);
    doc.setTextColor(...receiptInk().muted);
    const noteLines = doc.splitTextToSize(`Particulars: ${note}`, contentWidth) as string[];
    doc.text(noteLines, margin, afterY);
    afterY += noteLines.length * 4 + 4;
  }

  await drawSealFooter(
    doc,
    pageWidth,
    pageHeight,
    margin,
    afterY,
    generatedAt,
    displayName,
    `For payroll queries, contact the ${displayName} accounts office.`,
    false,
    branding,
  );

  emitPdf(
    doc,
    formatDownloadFilename("salarySlip", "pdf", {
      id: payment.id,
      name: staff?.name || payment.payee,
      school: schoolName,
      year: academicYear ? slugYear(academicYear) : undefined,
      date: todayStamp(),
    }),
    action,
  );
}

export async function printSalarySlipPdf(
  payment: DisbursalDoc,
  schoolName: string,
  branding?: ReceiptBranding,
  staff?: SalarySlipStaff | null,
  academicYear?: string,
) {
  return downloadSalarySlipPdf(payment, schoolName, branding, staff, academicYear, "print");
}

export type VoucherBillTo = {
  name?: string;
  address?: string;
  phone?: string;
  extra?: string;
};

export async function downloadPaymentVoucherPdf(
  payment: DisbursalDoc,
  schoolName: string,
  branding?: ReceiptBranding,
  billTo?: VoucherBillTo | null,
  academicYear?: string,
  action: PdfEmitAction = "download",
) {
  const [logo, letterhead] = await Promise.all([
    loadLogoForPdf(branding?.logoUrl),
    loadLetterheadForPdf(branding?.letterheadUrl),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = formatNow();
  const issuedAt = formatReceiptIssuedAt(payment.time, generatedAt);
  const displayName = pdfSafe(schoolName || "School");
  const amountFormatted = formatInrPdf(payment.amount);
  const leftMax = contentWidth * 0.52;
  const payeeName = pdfSafe(billTo?.name || payment.payee || "—");
  const payeeAddress = pdfSafe(billTo?.address || "").trim() || "—";
  const payeePhone = pdfSafe(billTo?.phone || "").trim() || "—";

  doc.setFillColor(...receiptInk().white);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  const metaTop = letterhead
    ? drawDocumentTitleBar(
        doc,
        pageWidth,
        contentWidth,
        "Payment Voucher",
        drawUploadedLetterheadBanner(doc, pageWidth, letterhead, margin) + 3,
      ) + 8
    : drawOfficialDocHeader(doc, pageWidth, displayName, branding, logo, "Payment Voucher");

  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(10);
  doc.setTextColor(...receiptInk().ink);
  doc.text("Bill To :", margin, metaTop);

  let billY = metaTop + 6.4;
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(12.5);
  const nameLines = doc.splitTextToSize(payeeName, leftMax) as string[];
  doc.text(nameLines, margin, billY);
  billY += nameLines.length * 5.4 + 0.6;

  doc.setFontSize(10);
  const addrLines = doc.splitTextToSize(payeeAddress, leftMax) as string[];
  doc.text(addrLines, margin, billY);
  billY += addrLines.length * 4.6;
  doc.text(payeePhone, margin, billY);
  billY += 4.8;

  const rightX = pageWidth - margin;
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(16);
  doc.setTextColor(...receiptInk().ink);
  doc.text(pdfSafe(payment.id), rightX, metaTop, { align: "right" });
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  doc.text(`Issued ${issuedAt}`, rightX, metaTop + 6.4, { align: "right" });
  doc.setFontSize(9.5);
  doc.setTextColor(...receiptInk().ink);
  doc.text(`Payment Mode : ${pdfSafe(payment.mode || "—")}`, rightX, metaTop + 13, {
    align: "right",
  });

  const tableStart = Math.max(billY, metaTop + 20) + 6;
  const description = pdfSafe(payment.desc || payment.payeeType || "Other");
  autoTable(doc, {
    startY: tableStart,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [["Sl.No", "Description", "Amount"]],
    body: [
      ["1", description, payment.amount.toLocaleString("en-IN")],
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
      lineColor: receiptInk().line,
      lineWidth: 0.18,
      textColor: receiptInk().ink,
      valign: "middle",
      minCellHeight: 9,
    },
    headStyles: {
      fillColor: receiptInk().teal,
      textColor: receiptInk().white,
      fontStyle: "bold",
      fontSize: 9.5,
      cellPadding: { top: 4.4, right: 5, bottom: 4.4, left: 5 },
    },
    alternateRowStyles: { fillColor: receiptInk().zebra },
    columnStyles: {
      0: { cellWidth: 22, halign: "center" },
      1: { cellWidth: contentWidth - 22 - 42 },
      2: { cellWidth: 42, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 2) {
        data.cell.styles.halign = "right";
      }
    },
  });

  const tableEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const words = inrAmountInWords(payment.amount);
  const boxW = 88;
  const boxH = 12;
  const boxX = pageWidth - margin - boxW;
  const boxY = tableEnd + 8;
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  const wordLines = doc.splitTextToSize(
    `Amount In Words: ${words}`,
    contentWidth - boxW - 10,
  ) as string[];
  doc.text(wordLines, margin, boxY + 5);
  doc.setFillColor(...receiptInk().teal);
  doc.roundedRect(boxX, boxY, boxW, boxH, 1.2, 1.2, "F");
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(9);
  doc.setTextColor(...receiptInk().white);
  doc.text("Total Amount", boxX + 5, boxY + 7.6);
  doc.setFontSize(12);
  doc.text(amountFormatted, boxX + boxW - 5, boxY + 7.8, { align: "right" });

  await drawSealFooter(
    doc,
    pageWidth,
    pageHeight,
    margin,
    Math.max(boxY + boxH, boxY + wordLines.length * 4.2) + 10,
    generatedAt,
    displayName,
    `For accounts queries, contact the ${displayName} accounts office.`,
    true,
    branding,
  );

  emitPdf(
    doc,
    formatDownloadFilename("voucher", "pdf", {
      id: payment.id,
      name: billTo?.name || payment.payee,
      school: schoolName,
      year: academicYear ? slugYear(academicYear) : undefined,
      date: todayStamp(),
    }),
    action,
  );
}

export async function printPaymentVoucherPdf(
  payment: DisbursalDoc,
  schoolName: string,
  branding?: ReceiptBranding,
  billTo?: VoucherBillTo | null,
  academicYear?: string,
) {
  return downloadPaymentVoucherPdf(payment, schoolName, branding, billTo, academicYear, "print");
}

export type StudentFeeReportInput = {
  student: Pick<Student, "id" | "name" | "cls" | "phone" | "guardian" | "address">;
  guardian?: string;
  schoolName: string;
  academicYear: string;
  statement: {
    totalFee: number;
    totalPaid: number;
    totalDue: number;
    ledger: {
      date: string;
      desc: string;
      due: string;
      charge: number;
      paid: number;
      balance: number;
      status: string;
    }[];
    receipts: {
      id: string;
      date: string;
      amount: number;
      mode: string;
      cat?: string;
      period?: string;
    }[];
    tuition?: {
      totalFee: number;
      totalPaid: number;
      totalDue: number;
      ledger: StudentFeeReportInput["statement"]["ledger"];
    };
    vehicle?: {
      applicable: boolean;
      routeLabel?: string;
      pickup?: string;
      drop?: string;
      shift?: string;
      totalFee: number;
      totalPaid: number;
      totalDue: number;
      ledger: StudentFeeReportInput["statement"]["ledger"];
    };
  };
  branding?: ReceiptBranding;
};

function appendFeeLedgerTable(
  doc: jsPDF,
  margin: number,
  contentWidth: number,
  title: string,
  rows: StudentFeeReportInput["statement"]["ledger"],
  startY: number,
): number {
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(10);
  doc.setTextColor(...receiptInk().tealDeep);
  doc.text(title, margin, startY);
  let tableStart = startY + 5;
  if (rows.length === 0) return tableStart;
  autoTable(doc, {
    startY: tableStart,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [["Date", "Description", "Due Date", "Charge", "Paid", "Balance", "Status"]],
    body: rows.map((row) => [
      pdfSafe(row.date),
      pdfSafe(row.desc),
      pdfSafe(row.due),
      row.charge.toLocaleString("en-IN"),
      row.paid.toLocaleString("en-IN"),
      row.balance.toLocaleString("en-IN"),
      pdfSafe(row.status),
    ]),
    theme: "grid",
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 2.8, right: 3, bottom: 2.8, left: 3 },
      lineColor: receiptInk().line,
      lineWidth: 0.18,
      textColor: receiptInk().ink,
      valign: "middle",
    },
    headStyles: {
      fillColor: receiptInk().teal,
      textColor: receiptInk().white,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: receiptInk().zebra },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

export async function downloadStudentFeeReportPdf(
  input: StudentFeeReportInput,
  action: PdfEmitAction = "download",
) {
  const { student, schoolName, academicYear, statement, branding } = input;
  const guardian = input.guardian?.trim() || student.guardian?.trim() || "—";
  const [logo, letterhead] = await Promise.all([
    loadLogoForPdf(branding?.logoUrl),
    loadLetterheadForPdf(branding?.letterheadUrl),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = formatNow();
  const displayName = pdfSafe(schoolName || "School");

  doc.setFillColor(...receiptInk().white);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  const headerBottom = letterhead
    ? drawUploadedLetterheadBanner(doc, pageWidth, letterhead, margin)
    : drawReceiptLetterheadHeader(doc, pageWidth, displayName, branding, logo);

  const barY = drawDocumentTitleBar(doc, pageWidth, contentWidth, "Student Fee Statement", headerBottom + 2) + 6;
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  doc.text(`Academic Year: ${pdfSafe(academicYear)}`, pageWidth / 2, barY, { align: "center" });

  const metaTop = barY + 8;
  const leftRows: [string, string][] = [
    ["Student Name", pdfSafe(student.name)],
    ["Student ID", pdfSafe(student.id)],
    ["Class", pdfSafe(student.cls || "—")],
    ["Guardian", pdfSafe(guardian)],
    ["Contact", pdfSafe(student.phone?.trim() || branding?.studentContact || "—")],
  ];
  if (statement.vehicle?.applicable) {
    leftRows.push([
      "Transport Route",
      pdfSafe(
        statement.vehicle.routeLabel ||
          [statement.vehicle.pickup, statement.vehicle.drop].filter(Boolean).join(" → ") ||
          "School bus",
      ),
    ]);
    if (statement.vehicle.shift) {
      leftRows.push([
        "Transport Shift",
        pdfSafe(
          statement.vehicle.shift === "morning"
            ? "Morning"
            : statement.vehicle.shift === "evening"
              ? "Evening"
              : "Both shifts",
        ),
      ]);
    }
  }
  const leftEnd = drawMetaPairs(doc, leftRows, metaTop, margin, contentWidth * 0.52);

  const rightX = pageWidth - margin;
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  doc.text(`Generated ${generatedAt}`, rightX, metaTop, { align: "right" });

  const summaryTop = leftEnd + 6;
  const colGap = 4;
  const colW = (contentWidth - colGap * 2) / 3;
  const summaryItems = [
    { label: "Total Fee", value: formatInrPdf(statement.totalFee) },
    { label: "Total Paid", value: formatInrPdf(statement.totalPaid) },
    { label: "Total Due", value: formatInrPdf(statement.totalDue) },
  ];
  summaryItems.forEach((item, index) => {
    const x = margin + index * (colW + colGap);
    doc.setDrawColor(...receiptInk().line);
    doc.setLineWidth(0.22);
    doc.roundedRect(x, summaryTop, colW, 22, 2, 2, "S");
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(8);
    doc.setTextColor(...receiptInk().muted);
    doc.text(item.label.toUpperCase(), x + 4, summaryTop + 6);
    doc.setFont(pdfFontName(), "bold");
    doc.setFontSize(12);
    if (index === 2 && statement.totalDue > 0) {
      doc.setTextColor(185, 28, 28);
    } else {
      doc.setTextColor(...receiptInk().ink);
    }
    doc.text(item.value, x + 4, summaryTop + 14.5);
  });

  let tableStart = summaryTop + 28;
  const tuitionLedger = statement.tuition?.ledger ?? statement.ledger;
  tableStart = appendFeeLedgerTable(
    doc,
    margin,
    contentWidth,
    "Academic Fees",
    tuitionLedger,
    tableStart,
  );

  if (statement.vehicle?.applicable) {
    tableStart = appendFeeLedgerTable(
      doc,
      margin,
      contentWidth,
      "Vehicle / Transport Fees",
      statement.vehicle.ledger,
      tableStart,
    );
  }

  if (statement.receipts.length > 0) {
    doc.setFont(pdfFontName(), "bold");
    doc.setFontSize(10);
    doc.setTextColor(...receiptInk().tealDeep);
    doc.text("Payment History", margin, tableStart);
    tableStart += 5;
    autoTable(doc, {
      startY: tableStart,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [["Receipt", "Date", "Category", "Mode", "Amount"]],
      body: statement.receipts.map((row) => [
        pdfSafe(row.id),
        pdfSafe(row.date),
        pdfSafe(row.period ? `${row.cat || "Fee"} · ${row.period}` : row.cat || "Fee"),
        pdfSafe(row.mode),
        row.amount.toLocaleString("en-IN"),
      ]),
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 2.8, right: 3, bottom: 2.8, left: 3 },
        lineColor: receiptInk().line,
        textColor: receiptInk().ink,
      },
      headStyles: {
        fillColor: receiptInk().headerTint,
        textColor: receiptInk().tealDeep,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: receiptInk().zebra },
      columnStyles: {
        4: { halign: "right", fontStyle: "bold" },
      },
    });
    tableStart = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  await drawSealFooter(
    doc,
    pageWidth,
    pageHeight,
    margin,
    Math.min(tableStart, pageHeight - 42),
    generatedAt,
    displayName,
    `This statement is issued for parent reference. For fee queries, contact ${displayName}.`,
    true,
    branding,
  );

  emitPdf(
    doc,
    formatDownloadFilename("studentFeeReport", "pdf", {
      report: "student-fee",
      id: student.id,
      studentId: student.id,
      name: student.name,
      school: schoolName,
      year: slugYear(academicYear),
      date: todayStamp(),
    }),
    action,
  );
}

export type StaffPayrollReportInput = {
  staff: Pick<Staff, "id" | "name" | "role" | "dept"> & { phone?: string };
  schoolName: string;
  payrollMonth: string;
  payrollMonthLabel: string;
  statement: {
    totalPayable: number;
    totalPaid: number;
    totalDue: number;
    ledger: {
      monthLabel: string;
      attendanceLabel: string;
      payable: number;
      paid: number;
      outstanding: number;
      status: string;
    }[];
    payments: {
      id: string;
      date: string;
      amount: number;
      mode: string;
      description: string;
      status: string;
      month: string | null;
    }[];
  };
  branding?: ReceiptBranding;
};

export async function downloadStaffPayrollReportPdf(
  input: StaffPayrollReportInput,
  action: PdfEmitAction = "download",
) {
  const { staff, schoolName, payrollMonthLabel, statement, branding } = input;
  const [logo, letterhead] = await Promise.all([
    loadLogoForPdf(branding?.logoUrl),
    loadLetterheadForPdf(branding?.letterheadUrl),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = formatNow();
  const displayName = pdfSafe(schoolName || "School");

  doc.setFillColor(...receiptInk().white);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  const headerBottom = letterhead
    ? drawUploadedLetterheadBanner(doc, pageWidth, letterhead, margin)
    : drawReceiptLetterheadHeader(doc, pageWidth, displayName, branding, logo);

  const barY = drawDocumentTitleBar(doc, pageWidth, contentWidth, "Staff Payroll Statement", headerBottom + 2) + 6;
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  doc.text(`Payroll period: ${pdfSafe(payrollMonthLabel)}`, pageWidth / 2, barY, { align: "center" });

  const metaTop = barY + 8;
  const leftRows: [string, string][] = [
    ["Employee Name", pdfSafe(staff.name)],
    ["Employee ID", pdfSafe(staff.id)],
    ["Designation", pdfSafe(staff.role || "—")],
    ["Department", pdfSafe(staff.dept || "—")],
    ["Contact", pdfSafe(staff.phone?.trim() || "—")],
  ];
  const leftEnd = drawMetaPairs(doc, leftRows, metaTop, margin, contentWidth * 0.52);

  const rightX = pageWidth - margin;
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...receiptInk().muted);
  doc.text(`Generated ${generatedAt}`, rightX, metaTop, { align: "right" });

  const summaryTop = leftEnd + 6;
  const colGap = 4;
  const colW = (contentWidth - colGap * 2) / 3;
  const summaryItems = [
    { label: "Total Payable", value: formatInrPdf(statement.totalPayable) },
    { label: "Total Paid", value: formatInrPdf(statement.totalPaid) },
    { label: "Total Due", value: formatInrPdf(statement.totalDue) },
  ];
  summaryItems.forEach((item, index) => {
    const x = margin + index * (colW + colGap);
    doc.setDrawColor(...receiptInk().line);
    doc.setLineWidth(0.22);
    doc.roundedRect(x, summaryTop, colW, 22, 2, 2, "S");
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(8);
    doc.setTextColor(...receiptInk().muted);
    doc.text(item.label.toUpperCase(), x + 4, summaryTop + 6);
    doc.setFont(pdfFontName(), "bold");
    doc.setFontSize(12);
    if (index === 2 && statement.totalDue > 0) {
      doc.setTextColor(185, 28, 28);
    } else {
      doc.setTextColor(...receiptInk().ink);
    }
    doc.text(item.value, x + 4, summaryTop + 14.5);
  });

  let tableStart = summaryTop + 28;
  if (statement.ledger.length > 0) {
    autoTable(doc, {
      startY: tableStart,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [["Month", "Attendance", "Payable", "Paid", "Outstanding", "Status"]],
      body: statement.ledger.map((row) => [
        pdfSafe(row.monthLabel),
        pdfSafe(row.attendanceLabel),
        row.payable.toLocaleString("en-IN"),
        row.paid.toLocaleString("en-IN"),
        row.outstanding.toLocaleString("en-IN"),
        pdfSafe(row.status),
      ]),
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 2.8, right: 3, bottom: 2.8, left: 3 },
        lineColor: receiptInk().line,
        lineWidth: 0.18,
        textColor: receiptInk().ink,
        valign: "middle",
      },
      headStyles: {
        fillColor: receiptInk().teal,
        textColor: receiptInk().white,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: receiptInk().zebra },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });
    tableStart = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (statement.payments.length > 0) {
    doc.setFont(pdfFontName(), "bold");
    doc.setFontSize(10);
    doc.setTextColor(...receiptInk().tealDeep);
    doc.text("Salary Payment History", margin, tableStart);
    tableStart += 5;
    autoTable(doc, {
      startY: tableStart,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [["Receipt", "Date", "Description", "Mode", "Status", "Amount"]],
      body: statement.payments.map((row) => [
        pdfSafe(row.id),
        pdfSafe(row.date),
        pdfSafe(row.description),
        pdfSafe(row.mode),
        pdfSafe(row.status),
        row.amount.toLocaleString("en-IN"),
      ]),
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 2.8, right: 3, bottom: 2.8, left: 3 },
        lineColor: receiptInk().line,
        textColor: receiptInk().ink,
      },
      headStyles: {
        fillColor: receiptInk().headerTint,
        textColor: receiptInk().tealDeep,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: receiptInk().zebra },
      columnStyles: {
        5: { halign: "right", fontStyle: "bold" },
      },
    });
    tableStart = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  await drawSealFooter(
    doc,
    pageWidth,
    pageHeight,
    margin,
    Math.min(tableStart, pageHeight - 42),
    generatedAt,
    displayName,
    `This payroll statement is issued for employee records. For salary queries, contact ${displayName}.`,
    true,
    branding,
  );

  emitPdf(
    doc,
    formatDownloadFilename("reports", "pdf", {
      report: "staff-payroll",
      id: staff.id,
      name: staff.name,
      school: schoolName,
      date: todayStamp(),
    }),
    action,
  );
}
