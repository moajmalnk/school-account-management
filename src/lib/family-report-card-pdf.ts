import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { apiBaseUrl, getApiToken } from "@/lib/api/client";
import { familyToken } from "@/lib/api/family";
import { formatDownloadFilename, todayStamp } from "@/lib/download-names";
import { resolveMediaUrl } from "@/lib/media";
import { pdfSafe } from "@/lib/platform-invoice-export";

export type FamilyReportCardData = {
  student: {
    id?: string;
    name: string;
    cls: string;
    admissionNumber?: string;
    section?: string;
    rollNo?: string;
  };
  school: {
    name: string;
    branchName?: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string | null;
    letterheadUrl?: string | null;
    sealUrl?: string | null;
    signatureUrl?: string | null;
    themePrimary?: string;
    registrationNo?: string;
    affiliationNo?: string;
    principalName?: string;
  };
  result: {
    exam: { name: string; academicYear: string; startsOn?: string | null; endsOn?: string | null };
    subjects: { name: string; score: number; max: number }[];
    score: number;
    max: number;
    percent: number;
  };
  attendancePercent: number | null;
  generatedAt?: string;
};

type PdfLogo = { dataUrl: string; width: number; height: number };

function hexToRgb(hex?: string): [number, number, number] {
  const raw = (hex || "#0F766E").replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(raw)) return [15, 118, 110];
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

function inkFor(primary: [number, number, number]) {
  return {
    teal: primary,
    tealSoft: [
      Math.min(255, primary[0] + 220),
      Math.min(255, primary[1] + 200),
      Math.min(255, primary[2] + 190),
    ] as [number, number, number],
    ink: [15, 23, 42] as [number, number, number],
    muted: [100, 116, 139] as [number, number, number],
    line: [226, 232, 240] as [number, number, number],
    field: [248, 250, 252] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    mint: [47, 158, 122] as [number, number, number],
    rose: [224, 90, 108] as [number, number, number],
    gold: [212, 146, 10] as [number, number, number],
  };
}

function gradeFor(percent: number): string {
  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B+";
  if (percent >= 60) return "B";
  if (percent >= 50) return "C";
  if (percent >= 40) return "D";
  return "E";
}

function resultLabel(percent: number, hasMarks: boolean): string {
  if (!hasMarks) return "Awaiting marks";
  return percent >= 40 ? "Pass" : "Needs improvement";
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function fmtDate(iso?: string | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtGenerated(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  }
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function canvasPng(img: HTMLImageElement, maxDim: number): PdfLogo {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) throw new Error("empty image");
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/png"), width, height };
}

async function fetchAsPng(src: string, maxDim: number): Promise<PdfLogo> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const headers: Record<string, string> = {};
    const token = familyToken() || getApiToken();
    const base = apiBaseUrl();
    let crossOrigin = false;
    try {
      crossOrigin = new URL(src, window.location.href).origin !== window.location.origin;
    } catch {
      crossOrigin = false;
    }
    if (token && !crossOrigin && (src.startsWith("/") || src.startsWith(base))) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(src, { signal: controller.signal, credentials: "omit", headers });
    if (!res.ok) throw new Error(`media ${res.status}`);
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

async function loadMedia(url?: string | null, maxDim = 960): Promise<PdfLogo | null> {
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
      return await fetchAsPng(src, maxDim);
    } catch {
      /* next */
    }
  }
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("cors"));
        img.src = resolved;
      });
      return canvasPng(loaded, maxDim);
    } catch {
      return null;
    }
  }
  return null;
}

function drawLetterheadBanner(doc: jsPDF, pageW: number, letterhead: PdfLogo): number {
  const aspect = letterhead.width / Math.max(1, letterhead.height);
  const drawW = pageW;
  const drawH = Math.min(drawW / aspect, 52);
  doc.addImage(letterhead.dataUrl, "PNG", 0, 0, drawW, drawH);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.28);
  doc.line(0, drawH + 2.5, pageW, drawH + 2.5);
  return drawH + 6;
}

function drawFallbackHeader(
  doc: jsPDF,
  pageW: number,
  margin: number,
  school: FamilyReportCardData["school"],
  logo: PdfLogo | null,
  teal: [number, number, number],
): number {
  doc.setFillColor(...teal);
  doc.rect(0, 0, pageW, 36, "F");
  let textX = margin;
  if (logo) {
    const maxH = 16;
    const maxW = 20;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 8, w + 3, h + 3, 1.5, 1.5, "F");
    doc.addImage(logo.dataUrl, "PNG", margin + 1.5, 9.5, w, h);
    textX = margin + w + 7;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(pdfSafe(school.name || "School"), textX, 14, { maxWidth: pageW - textX - margin });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 245, 240);
  const bits = [
    school.branchName && school.branchName !== school.name ? school.branchName : "",
    school.tagline,
    school.address,
  ].filter(Boolean);
  if (bits.length) {
    doc.text(pdfSafe(bits.join("  ·  ")), textX, 21, { maxWidth: pageW - textX - margin });
  }
  const contact = [school.phone, school.email, school.website].filter(Boolean);
  if (contact.length) {
    doc.text(pdfSafe(contact.join("  ·  ")), textX, 28, { maxWidth: pageW - textX - margin });
  }
  return 42;
}

function drawTitleBar(
  doc: jsPDF,
  pageW: number,
  contentW: number,
  title: string,
  y: number,
  teal: [number, number, number],
): number {
  const barW = Math.min(contentW, Math.max(72, title.length * 4.2 + 28));
  const barH = 10;
  const barX = (pageW - barW) / 2;
  doc.setFillColor(...teal);
  doc.roundedRect(barX, y, barW, barH, 2.4, 2.4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(title, pageW / 2, y + 6.7, { align: "center" });
  return y + barH;
}

function safeFilename(parts: string[]): string {
  return parts
    .map((p) =>
      String(p || "")
        .replace(/[^\w\s.-]+/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 48),
    )
    .filter(Boolean)
    .join("-");
}

/** School-branded A4 report card using tenant letterhead / seal / signature when available. */
export async function downloadFamilyReportCard(report: FamilyReportCardData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;
  const school = report.school;
  const student = report.student;
  const result = report.result;
  const subjects = result.subjects ?? [];
  const hasMarks = subjects.length > 0 && result.max > 0;
  const teal = hexToRgb(school.themePrimary);
  const ink = inkFor(teal);

  const [logo, letterhead, seal, signature] = await Promise.all([
    loadMedia(school.logoUrl, 960),
    loadMedia(school.letterheadUrl, 1400),
    loadMedia(school.sealUrl, 640),
    loadMedia(school.signatureUrl, 640),
  ]);

  doc.setFillColor(...ink.white);
  doc.rect(0, 0, pageW, pageH, "F");

  let y = letterhead
    ? drawLetterheadBanner(doc, pageW, letterhead)
    : drawFallbackHeader(doc, pageW, margin, school, logo, teal);

  y = drawTitleBar(doc, pageW, contentW, "Report Card", y + 2, teal) + 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...ink.muted);
  const examBits = [
    result.exam.name,
    result.exam.academicYear ? `Academic Year: ${result.exam.academicYear}` : "",
    `Generated ${fmtGenerated(report.generatedAt)}`,
  ].filter(Boolean);
  doc.text(pdfSafe(examBits.join("   |   ")), pageW / 2, y, { align: "center" });
  y += 8;

  // Student particulars — fee-statement style meta pairs
  const leftPairs: [string, string][] = [
    ["Student Name", student.name],
    ["Admission / ID", student.admissionNumber || student.id || "—"],
    ["Academic Year", result.exam.academicYear || "—"],
  ];
  const rightPairs: [string, string][] = [
    ["Class / Section", [student.cls, student.section].filter(Boolean).join(" · ") || "—"],
    ["Roll No.", student.rollNo || "—"],
    ["Examination", result.exam.name || "—"],
  ];
  const colW = contentW / 2;
  const drawPairs = (pairs: [string, string][], x: number, startY: number) => {
    let yy = startY;
    for (const [label, value] of pairs) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...ink.muted);
      doc.text(pdfSafe(label), x, yy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...ink.ink);
      doc.text(pdfSafe(value), x + 34, yy, { maxWidth: colW - 38 });
      yy += 6;
    }
    return yy;
  };
  const leftEnd = drawPairs(leftPairs, margin, y);
  const rightEnd = drawPairs(rightPairs, margin + colW + 2, y);
  y = Math.max(leftEnd, rightEnd) + 4;

  // Subjects
  const body = subjects.map((subject, index) => {
    const pct = subject.max > 0 ? Math.round((subject.score / subject.max) * 1000) / 10 : 0;
    return [
      String(index + 1),
      pdfSafe(subject.name),
      fmtNum(subject.max),
      fmtNum(subject.score),
      `${fmtNum(pct)}%`,
      gradeFor(pct),
    ];
  });

  if (body.length === 0) {
    doc.setFillColor(...ink.tealSoft);
    doc.roundedRect(margin, y, contentW, 16, 2.5, 2.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...ink.muted);
    doc.text("Subject marks have not been published for this exam yet.", margin + 4, y + 9.5);
    y += 22;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...teal);
    doc.text("Subject marks", margin, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Subject", "Max", "Obtained", "%", "Grade"]],
      body,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
        textColor: ink.ink,
        lineColor: ink.line,
        lineWidth: 0.2,
        valign: "middle",
      },
      headStyles: {
        fillColor: teal,
        textColor: ink.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: ink.field },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 20, halign: "right" },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 18, halign: "right" },
        5: { cellWidth: 18, halign: "center", fontStyle: "bold" },
      },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Summary cards
  const cards: { label: string; value: string; color?: [number, number, number] }[] = [
    { label: "Total", value: hasMarks ? `${fmtNum(result.score)} / ${fmtNum(result.max)}` : "—" },
    {
      label: "Percentage",
      value: hasMarks ? `${fmtNum(result.percent)}%` : "—",
      color: hasMarks ? (result.percent >= 40 ? ink.mint : ink.rose) : ink.muted,
    },
    { label: "Overall grade", value: hasMarks ? gradeFor(result.percent) : "—", color: teal },
    {
      label: "Result",
      value: resultLabel(result.percent, hasMarks),
      color: hasMarks ? (result.percent >= 40 ? ink.mint : ink.rose) : ink.gold,
    },
    {
      label: "Attendance",
      value: report.attendancePercent != null ? `${fmtNum(report.attendancePercent)}%` : "—",
    },
  ];
  const gap = 2.5;
  const cardW = (contentW - gap * (cards.length - 1)) / cards.length;
  cards.forEach((card, i) => {
    const x = margin + i * (cardW + gap);
    doc.setFillColor(...ink.white);
    doc.setDrawColor(...ink.line);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, cardW, 16, 2.2, 2.2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...ink.muted);
    doc.text(card.label.toUpperCase(), x + cardW / 2, y + 5, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...(card.color ?? ink.ink));
    doc.text(pdfSafe(card.value), x + cardW / 2, y + 11.5, {
      align: "center",
      maxWidth: cardW - 2,
    });
  });
  y += 22;

  // Remarks
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...teal);
  doc.text("Class teacher's remarks", margin, y);
  y += 2.5;
  doc.setDrawColor(...ink.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, 14, 2, 2, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...ink.muted);
  doc.text(
    hasMarks
      ? "Promoted on the basis of the marks above. Continue consistent study habits."
      : "Remarks will appear once marks are published.",
    margin + 3,
    y + 5.5,
    { maxWidth: contentW - 6 },
  );
  y += 20;

  // Seal + signature (fee-statement style)
  const sealSize = 28;
  const signW = 48;
  const signH = 18;
  if (y > pageH - 48) {
    doc.addPage();
    y = margin + 8;
  }

  if (seal) {
    try {
      doc.addImage(seal.dataUrl, "PNG", margin, y, sealSize, sealSize);
    } catch {
      /* skip */
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...ink.muted);
    doc.text("School Seal", margin + sealSize / 2, y + sealSize + 4, { align: "center" });
  } else {
    doc.setDrawColor(...ink.line);
    doc.line(margin, y + 14, margin + 42, y + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...ink.ink);
    doc.text("Class teacher", margin, y + 19);
  }

  const sigX = pageW - margin - signW;
  if (signature) {
    try {
      doc.addImage(signature.dataUrl, "PNG", sigX, y + 4, signW, signH);
    } catch {
      /* skip */
    }
  } else {
    doc.setDrawColor(...ink.line);
    doc.line(sigX, y + 14, sigX + signW, y + 14);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...ink.muted);
  doc.text(pdfSafe(school.principalName || "Principal / Head"), sigX + signW / 2, y + sealSize + 4, {
    align: "center",
  });

  // Footer
  doc.setDrawColor(...ink.line);
  doc.setLineWidth(0.25);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...ink.muted);
  doc.text(`Generated ${fmtGenerated(report.generatedAt)}`, margin, pageH - 7);
  doc.text(pdfSafe(school.name || "School"), pageW - margin, pageH - 7, { align: "right" });

  const filename = formatDownloadFilename("reports", "pdf", {
    report: safeFilename([student.name, result.exam.name, "report-card"]) || "report-card",
    school: school.name,
    name: student.name,
    date: todayStamp(),
    year: result.exam.academicYear,
  });
  doc.save(filename);
}
