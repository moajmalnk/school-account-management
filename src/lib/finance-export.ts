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

function formatInrPdf(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

export function downloadReceiptPdf(
  payment: Payment,
  schoolName: string,
  academicYear: string,
  branding?: {
    letterheadUrl?: string;
    address?: string;
    phone?: string;
    email?: string;
  },
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const amountFormatted = formatInrPdf(payment.amount);
  const summaryLabelWidth = 98;
  const summaryAmountWidth = contentWidth - summaryLabelWidth;

  let headerBottom = 34;
  if (branding?.letterheadUrl) {
    try {
      const format = branding.letterheadUrl.includes("image/png")
        ? "PNG"
        : branding.letterheadUrl.includes("image/webp")
          ? "WEBP"
          : "JPEG";
      doc.addImage(branding.letterheadUrl, format, margin, 8, contentWidth, 28);
      headerBottom = 42;
    } catch {
      doc.setFillColor(199, 243, 60);
      doc.rect(0, 0, pageWidth, 34, "F");
    }
  } else {
    doc.setFillColor(199, 243, 60);
    doc.rect(0, 0, pageWidth, 34, "F");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolName, margin, branding?.letterheadUrl ? headerBottom + 8 : 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Official Fee Receipt · ${academicYear}`,
    margin,
    branding?.letterheadUrl ? headerBottom + 16 : 23,
  );

  const contactBits = [branding?.address, branding?.phone, branding?.email].filter(Boolean);
  if (contactBits.length) {
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(contactBits.join(" · "), margin, branding?.letterheadUrl ? headerBottom + 22 : 29, {
      maxWidth: contentWidth * 0.62,
    });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(payment.id, pageWidth - margin, branding?.letterheadUrl ? headerBottom + 8 : 15, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(45, 45, 45);
  doc.text(
    `Issued ${generatedAt}`,
    pageWidth - margin,
    branding?.letterheadUrl ? headerBottom + 16 : 22,
    { align: "right" },
  );

  const titleY = branding?.letterheadUrl ? headerBottom + 34 : 46;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Receipt", margin, titleY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    payment.payerType === "external"
      ? "Income acknowledgement · external payer"
      : "Fee collection acknowledgement · student account ledger",
    margin,
    titleY + 6,
  );

  autoTable(doc, {
    startY: titleY + 12,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [["Field", "Details"]],
    body: [
      ["Receipt Number", payment.id],
      [payment.payerType === "external" ? "Payer Name" : "Student Name", payment.name],
      ...(payment.payerType === "external"
        ? [["Payer Type", "External"]]
        : payment.className
          ? [["Class", payment.className]]
          : []),
      ["Fee Category", payment.cat],
      ["Payment Mode", payment.mode],
      ["Recorded On", payment.time],
      ["Amount Received", amountFormatted],
      ...(payment.narration ? [["Narration", payment.narration]] : []),
    ],
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
      lineColor: [220, 220, 220],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      valign: "middle",
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 54, fontStyle: "bold", textColor: [90, 90, 90], fillColor: [248, 248, 248] },
      1: { cellWidth: contentWidth - 54, fontStyle: "bold", halign: "left" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 5) {
        data.cell.styles.fillColor = [225, 242, 174];
        data.cell.styles.fontSize = 11;
        if (data.column.index === 1) {
          data.cell.styles.halign = "right";
          data.cell.styles.cellPadding = { top: 5, right: 8, bottom: 5, left: 6 };
        }
      }
    },
  });

  const detailsEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: detailsEnd + 6,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    body: [
      [
        { content: "Total Amount Paid", styles: { fontStyle: "bold", textColor: [60, 60, 60] } },
        {
          content: amountFormatted,
          styles: {
            fontStyle: "bold",
            fontSize: 14,
            halign: "right",
            fillColor: [199, 243, 60],
            textColor: [0, 0, 0],
            cellPadding: { top: 8, right: 10, bottom: 8, left: 8 },
          },
        },
      ],
    ],
    theme: "grid",
    styles: {
      cellPadding: { top: 8, right: 8, bottom: 8, left: 8 },
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      valign: "middle",
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: summaryLabelWidth },
      1: { cellWidth: summaryAmountWidth, halign: "right" },
    },
  });

  const summaryEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setDrawColor(229, 229, 229);
  doc.setLineWidth(0.3);
  doc.line(margin, summaryEnd, pageWidth - margin, summaryEnd);

  doc.setFontSize(8);
  doc.setTextColor(115, 115, 115);
  doc.setFont("helvetica", "normal");
  doc.text("This is a computer-generated receipt. No physical signature is required.", margin, summaryEnd + 6);
  doc.text(`Document generated on ${generatedAt}`, margin, summaryEnd + 11);
  doc.text(`For billing queries, contact the ${schoolName} accounts office.`, margin, summaryEnd + 16);

  doc.save(`receipt-${payment.id}.pdf`);
}
