import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { apiBaseUrl, getApiToken } from "@/lib/api/client";
import { isBlankDate } from "@/lib/dates";
import { resolveMediaUrl } from "@/lib/media";
import {
  currentPayrollMonth,
  formatPayrollMonthLabel,
  resolvePaymentFeePeriod,
  schoolInitials,
  type Payment,
  type SchoolDetails,
  type Student,
} from "@/lib/tenant-store";
import { getActiveBrandPalette, pdfFontName } from "@/lib/brand-theme";
import {
  defaultSealSvg,
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
};

export function downloadTablePdf({
  filename,
  title,
  subtitle,
  headers,
  rows,
  footer,
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
  doc.save(filename);
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
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  }
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) {
    const dt = new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] ?? 12),
      Number(iso[5] ?? 0),
      Number(iso[6] ?? 0),
    );
    if (!Number.isNaN(dt.getTime()) && dt.getFullYear() > 1970) {
      return dt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    }
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

function canvasPng(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) throw new Error("empty image");
  const maxDim = 640;
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

async function fetchLogoAsPng(src: string) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 6000);
  try {
    const headers: Record<string, string> = {};
    const token = getApiToken();
    const base = apiBaseUrl();
    if (token && (src.startsWith("/") || src.startsWith(base))) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(src, { signal: controller.signal, headers });
    if (!res.ok) throw new Error(`logo ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      return canvasPng(await loadHtmlImage(objectUrl));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadLogoForPdf(url?: string) {
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
      if (src.startsWith("data:")) return canvasPng(await loadHtmlImage(src));
      return await fetchLogoAsPng(src);
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
      return canvasPng(loaded);
    } catch {
      return null;
    }
  }
  return null;
}

function isBankCashSplitLabel(label: string): boolean {
  return /^(bank|cash)$/i.test(label.trim());
}

function withFeePeriodLabel(label: string, period?: string | null) {
  const cat = pdfSafe(label || "Fee Payment");
  const p = pdfSafe(period || "").trim();
  if (!p) return cat;
  if (cat.toLowerCase().includes(p.toLowerCase())) return cat;
  return `${cat} - ${p}`;
}

function receiptLineItems(payment: Payment): { description: string; amount: number }[] {
  const period = resolvePaymentFeePeriod(payment);
  const narration = payment.narration ?? "";
  const breakdown = narration.match(/Fee breakdown:\s*(.+)/i);
  if (breakdown) {
    const items: { description: string; amount: number }[] = [];
    for (const part of breakdown[1].split(/\s*[·|]\s*/)) {
      const match = part.trim().match(/^(.*?)\s+(?:Rs\.?|₹)\s*([\d,]+(?:\.\d+)?)\s*$/i);
      if (!match) continue;
      const description = pdfSafe(match[1].trim());
      if (isBankCashSplitLabel(description)) continue;
      const amount = Number(match[2].replace(/,/g, ""));
      if (!Number.isFinite(amount) || amount <= 0) continue;
      items.push({ description: withFeePeriodLabel(description, period), amount });
    }
    if (items.length) return items;
  }

  return [
    {
      description: withFeePeriodLabel(payment.cat || "Fee Payment", period),
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
  student?: Pick<Student, "phone" | "address">,
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
) {
  const logo = await loadLogoForPdf(branding?.logoUrl);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const issuedAt = formatReceiptIssuedAt(payment.time, generatedAt);
  const amountFormatted = formatInrPdf(payment.amount);
  const isExternal = payment.payerType === "external";
  const displayName = pdfSafe(schoolName || "School");
  const initials = schoolInitials(displayName) || "SC";

  const logoBox = 28;
  const logoX = margin;
  const logoY = 12;
  const textX = margin + logoBox + 8;
  const textWidth = pageWidth - margin - textX;

  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(displayName.length > 32 ? 15 : 20);
  const nameLines = doc.splitTextToSize(displayName, textWidth) as string[];
  const address = pdfSafe(branding?.address || "").toUpperCase();
  doc.setFont(pdfFontName(), "normal");
  doc.setFontSize(8.5);
  const addressLines = address ? (doc.splitTextToSize(address, textWidth) as string[]) : [];
  const contactLine = [branding?.phone, branding?.email]
    .map((v) => pdfSafe(v || "").trim())
    .filter(Boolean)
    .join("  |  ");

  let textBottom = logoY + 6;
  textBottom += nameLines.length * 7.2;
  if (addressLines.length) textBottom += addressLines.length * 4.2 + 1;
  if (contactLine) textBottom += 5;
  const headerBottom = Math.max(logoY + logoBox, textBottom) + 6;

  doc.setFillColor(...receiptInk().white);
  doc.rect(0, 0, pageWidth, headerBottom, "F");

  if (logo) {
    const pad = 0.4;
    const boxInner = logoBox - pad * 2;
    const scale = Math.min(boxInner / logo.width, boxInner / logo.height);
    const drawW = logo.width * scale;
    const drawH = logo.height * scale;
    doc.addImage(
      logo.dataUrl,
      "PNG",
      logoX + (logoBox - drawW) / 2,
      logoY + (logoBox - drawH) / 2,
      drawW,
      drawH,
    );
  } else {
    doc.setFillColor(...receiptInk().teal);
    doc.roundedRect(logoX, logoY, logoBox, logoBox, 2.2, 2.2, "F");
    doc.setFont(pdfFontName(), "bold");
    doc.setFontSize(initials.length > 2 ? 9 : 12);
    doc.setTextColor(...receiptInk().white);
    doc.text(initials, logoX + logoBox / 2, logoY + logoBox / 2 + 1.5, { align: "center" });
  }

  let cursorY = logoY + 7;
  doc.setFont(pdfFontName(), "bold");
  doc.setFontSize(displayName.length > 32 ? 15 : 20);
  doc.setTextColor(...receiptInk().tealDeep);
  doc.text(nameLines, textX, cursorY);
  cursorY += nameLines.length * 7.2;

  if (addressLines.length) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...receiptInk().muted);
    doc.text(addressLines, textX, cursorY);
    cursorY += addressLines.length * 4.2 + 1.2;
  }

  if (contactLine) {
    doc.setFont(pdfFontName(), "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...receiptInk().tealDeep);
    doc.text(contactLine, textX, cursorY);
  }

  const barW = Math.min(contentWidth, 92);
  const barH = 10;
  const barX = (pageWidth - barW) / 2;
  const barY = headerBottom + 4;
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

  doc.save(
    formatDownloadFilename("receipt", "pdf", {
      id: payment.id,
      name: payment.name,
      school: schoolName,
      year: slugYear(academicYear),
      date: todayStamp(),
    }),
  );
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

function drawOfficialDocHeader(
  doc: jsPDF,
  pageWidth: number,
  schoolName: string,
  branding: ReceiptBranding | undefined,
  logo: PdfLogo | null,
  badge: string,
): number {
  const margin = 16;
  const logoBox = 28;
  const logoX = margin;
  const logoY = 11;
  const textX = margin + logoBox + 8;
  const textWidth = pageWidth - margin - textX;
  const displayName = pdfSafe(schoolName || "School");
  const initials = schoolInitials(displayName) || "SC";

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

  let textBottom = logoY + 7;
  textBottom += nameLines.length * 7.2;
  if (addressLines.length) textBottom += addressLines.length * 4.2 + 1.2;
  if (contactLine) textBottom += 5;
  const headerH = Math.max(logoY + logoBox + 12, textBottom + 12);

  doc.setFillColor(...receiptInk().teal);
  doc.roundedRect(0, -10, pageWidth, headerH + 10, 6, 6, "F");
  doc.setFillColor(...receiptInk().tealDeep);
  doc.rect(0, headerH - 1.2, pageWidth, 1.2, "F");

  doc.setFillColor(...receiptInk().white);
  doc.roundedRect(logoX, logoY, logoBox, logoBox, 4, 4, "F");
  if (logo) {
    const pad = 1.6;
    const inner = logoBox - pad * 2;
    const scale = Math.min(inner / logo.width, inner / logo.height);
    const drawW = logo.width * scale;
    const drawH = logo.height * scale;
    doc.addImage(
      logo.dataUrl,
      "PNG",
      logoX + (logoBox - drawW) / 2,
      logoY + (logoBox - drawH) / 2,
      drawW,
      drawH,
    );
  } else {
    doc.setFillColor(...receiptInk().tealDeep);
    doc.roundedRect(logoX + 2, logoY + 2, logoBox - 4, logoBox - 4, 3, 3, "F");
    doc.setFont(pdfFontName(), "bold");
    doc.setFontSize(initials.length > 2 ? 9 : 12);
    doc.setTextColor(...receiptInk().white);
    doc.text(initials, logoX + logoBox / 2, logoY + logoBox / 2 + 1.4, { align: "center" });
  }

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
  const brand = getActiveBrandPalette();
  const markH = compact ? 18 : 24;
  const sealSize = markH;
  const signW = compact ? 42 : 52;
  const [seal, signature] = await Promise.all([
    loadSchoolMarkPng(
      branding?.sealUrl,
      defaultSealSvg(schoolName, brand.primary),
      320,
      320,
    ),
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
  doc.text("Seal", margin + sealSize / 2, labelY, { align: "center" });
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
    deductions.push({ label: "Loss of pay (LOP)", amount: gross - netPaid });
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
) {
  const logo = await loadLogoForPdf(branding?.logoUrl);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const issuedAt = formatReceiptIssuedAt(payment.time, generatedAt);
  const payDate = formatPayDateNumeric(payment.time, generatedAt);
  const payPeriod = payPeriodFromDescription(payment.desc || "");
  const components = buildSalaryComponents(staff, payment.amount);
  const displayName = pdfSafe(schoolName || "School");

  const metaTop = drawOfficialDocHeader(
    doc,
    pageWidth,
    displayName,
    branding,
    logo,
    "Salary Slip",
  );

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

  doc.save(
    formatDownloadFilename("salarySlip", "pdf", {
      id: payment.id,
      name: staff?.name || payment.payee,
      school: schoolName,
      year: academicYear ? slugYear(academicYear) : undefined,
      date: todayStamp(),
    }),
  );
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
) {
  const logo = await loadLogoForPdf(branding?.logoUrl);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const issuedAt = formatReceiptIssuedAt(payment.time, generatedAt);
  const displayName = pdfSafe(schoolName || "School");
  const amountFormatted = formatInrPdf(payment.amount);
  const leftMax = contentWidth * 0.52;
  const payeeName = pdfSafe(billTo?.name || payment.payee || "—");
  const payeeAddress = pdfSafe(billTo?.address || "").trim() || "—";
  const payeePhone = pdfSafe(billTo?.phone || "").trim() || "—";

  const metaTop = drawOfficialDocHeader(
    doc,
    pageWidth,
    displayName,
    branding,
    logo,
    "Payment Voucher",
  );

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

  doc.save(
    formatDownloadFilename("voucher", "pdf", {
      id: payment.id,
      name: billTo?.name || payment.payee,
      school: schoolName,
      year: academicYear ? slugYear(academicYear) : undefined,
      date: todayStamp(),
    }),
  );
}
