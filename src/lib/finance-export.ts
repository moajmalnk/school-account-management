import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { Payment } from "@/lib/tenant-store";

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
  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 18);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(subtitle, 14, 26);
  }
  autoTable(doc, {
    startY: subtitle ? 32 : 24,
    head: [headers],
    body: rows.map((row) => row.map(String)),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [244, 244, 245] },
  });
  if (footer) {
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(footer, 14, finalY);
  }
  doc.save(filename);
}

export function downloadReceiptPdf(payment: Payment, schoolName: string, academicYear: string) {
  const doc = new jsPDF();
  const margin = 18;
  let y = margin;

  doc.setFillColor(199, 243, 60);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolName, margin, 18);
  doc.setFontSize(10);
  doc.text(`Fee Receipt · ${academicYear}`, margin, 24);

  y = 40;
  doc.setFontSize(14);
  doc.text("Payment Receipt", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const lines: [string, string][] = [
    ["Receipt No.", payment.id],
    ["Student", payment.name],
    ["Category", payment.cat],
    ["Payment Mode", payment.mode],
    ["Amount", `₹ ${payment.amount.toLocaleString("en-IN")}`],
    ["Recorded", payment.time],
  ];
  lines.forEach(([label, value]) => {
    doc.setTextColor(120, 120, 120);
    doc.text(label, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + 42, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  });

  y += 6;
  doc.setDrawColor(229, 229, 229);
  doc.line(margin, y, 210 - margin, y);
  y += 10;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`₹ ${payment.amount.toLocaleString("en-IN")}`, margin, y);
  doc.setFont("helvetica", "normal");
  y += 12;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("This is a computer-generated receipt. No signature required.", margin, y);
  doc.text(`Generated ${new Date().toLocaleString("en-IN")}`, margin, y + 5);

  doc.save(`receipt-${payment.id}.pdf`);
}
