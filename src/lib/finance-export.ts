import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { Payment } from "@/lib/tenant-store";
import {
  resolvePaymentFeePeriod,
  resolvePaymentFeePeriodKind,
} from "@/lib/tenant-store";

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
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 118, 110);
  doc.text(title, 14, 18);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 26);
  }
  autoTable(doc, {
    startY: subtitle ? 32 : 24,
    head: [headers],
    body: rows.map((row) => row.map(String)),
    styles: { fontSize: 9, cellPadding: 3, textColor: [15, 23, 42] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 253, 250] },
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

/** Brand palette for printable finance docs (teal theme). */
const RECEIPT = {
  teal: [15, 118, 110] as [number, number, number],
  tealDeep: [13, 94, 88] as [number, number, number],
  tealSoft: [240, 253, 250] as [number, number, number],
  tealRow: [204, 251, 241] as [number, number, number],
  ink: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  line: [226, 232, 240] as [number, number, number],
  fieldFill: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

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
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const amountFormatted = formatInrPdf(payment.amount);
  const summaryLabelWidth = 98;
  const summaryAmountWidth = contentWidth - summaryLabelWidth;
  const hasLetterhead = Boolean(branding?.letterheadUrl);

  let contentTop = 44;
  let usedBrandHeader = false;

  if (hasLetterhead) {
    try {
      const format = branding!.letterheadUrl!.includes("image/png")
        ? "PNG"
        : branding!.letterheadUrl!.includes("image/webp")
          ? "WEBP"
          : "JPEG";
      doc.addImage(branding!.letterheadUrl!, format, margin, 10, contentWidth, 26);
      doc.setFillColor(...RECEIPT.teal);
      doc.rect(0, 40, pageWidth, 1.2, "F");
      contentTop = 48;
    } catch {
      drawReceiptBrandHeader(doc, pageWidth);
      usedBrandHeader = true;
      contentTop = 44;
    }
  } else {
    drawReceiptBrandHeader(doc, pageWidth);
    usedBrandHeader = true;
  }

  const headerTextY = usedBrandHeader ? 14 : contentTop;
  const onTeal = usedBrandHeader;
  const primaryInk = onTeal ? RECEIPT.white : RECEIPT.ink;
  const secondaryInk = onTeal ? ([204, 251, 241] as [number, number, number]) : RECEIPT.muted;

  if (usedBrandHeader) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...primaryInk);
    doc.text(schoolName, margin, headerTextY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...secondaryInk);
    doc.text(`Official Fee Receipt · ${academicYear}`, margin, headerTextY + 7);

    const contactBits = [branding?.address, branding?.phone, branding?.email].filter(Boolean);
    if (contactBits.length) {
      doc.setFontSize(7.5);
      doc.setTextColor(186, 230, 223);
      doc.text(contactBits.join(" · "), margin, headerTextY + 13, {
        maxWidth: contentWidth * 0.58,
      });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...primaryInk);
    doc.text(payment.id, pageWidth - margin, headerTextY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...secondaryInk);
    doc.text(`Issued ${generatedAt}`, pageWidth - margin, headerTextY + 6.5, {
      align: "right",
    });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...RECEIPT.teal);
    doc.text(`Official Fee Receipt · ${academicYear}`, margin, contentTop);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...RECEIPT.ink);
    doc.text(payment.id, pageWidth - margin, contentTop, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...RECEIPT.muted);
    doc.text(`Issued ${generatedAt}`, pageWidth - margin, contentTop + 5.5, {
      align: "right",
    });
  }

  const titleY = usedBrandHeader ? 50 : contentTop + 12;

  doc.setFillColor(...RECEIPT.tealSoft);
  doc.roundedRect(margin, titleY - 6, contentWidth, 16, 1.5, 1.5, "F");
  doc.setDrawColor(...RECEIPT.teal);
  doc.setLineWidth(0.4);
  doc.line(margin, titleY - 6, margin, titleY + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...RECEIPT.teal);
  doc.text("Payment Receipt", margin + 4, titleY + 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...RECEIPT.muted);
  doc.text(
    payment.payerType === "external"
      ? "Income acknowledgement · external payer"
      : "Fee collection acknowledgement · student account ledger",
    margin + 4,
    titleY + 7,
  );

  autoTable(doc, {
    startY: titleY + 16,
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
      ...(resolvePaymentFeePeriod(payment)
        ? [
            [
              resolvePaymentFeePeriodKind(payment) === "term" ? "Fee Term" : "Fee Month",
              resolvePaymentFeePeriod(payment)!,
            ],
          ]
        : []),
      ["Recorded On", payment.time],
      ["Amount Received", amountFormatted],
      ...(payment.narration ? [["Narration", payment.narration]] : []),
    ],
    theme: "grid",
    styles: {
      fontSize: 9.5,
      cellPadding: { top: 4.5, right: 6, bottom: 4.5, left: 6 },
      lineColor: RECEIPT.line,
      lineWidth: 0.2,
      textColor: RECEIPT.ink,
      valign: "middle",
    },
    headStyles: {
      fillColor: RECEIPT.teal,
      textColor: RECEIPT.white,
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    columnStyles: {
      0: {
        cellWidth: 52,
        fontStyle: "normal",
        textColor: RECEIPT.muted,
        fillColor: RECEIPT.fieldFill,
      },
      1: { cellWidth: contentWidth - 52, fontStyle: "bold", halign: "left" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const isAmountRow = data.row.cells[0]?.text.join(" ") === "Amount Received";
      if (!isAmountRow) return;
      data.cell.styles.fillColor = RECEIPT.tealRow;
      data.cell.styles.fontSize = 10.5;
      data.cell.styles.textColor = RECEIPT.tealDeep;
      data.cell.styles.fontStyle = "bold";
      if (data.column.index === 1) {
        data.cell.styles.halign = "right";
        data.cell.styles.cellPadding = { top: 5, right: 8, bottom: 5, left: 6 };
      }
    },
  });

  const detailsEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: detailsEnd + 7,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    body: [
      [
        {
          content: "Total Amount Paid",
          styles: {
            fontStyle: "bold",
            textColor: RECEIPT.white,
            fillColor: RECEIPT.teal,
            cellPadding: { top: 8, right: 8, bottom: 8, left: 10 },
          },
        },
        {
          content: amountFormatted,
          styles: {
            fontStyle: "bold",
            fontSize: 14,
            halign: "right",
            fillColor: RECEIPT.tealDeep,
            textColor: RECEIPT.white,
            cellPadding: { top: 8, right: 10, bottom: 8, left: 8 },
          },
        },
      ],
    ],
    theme: "plain",
    styles: {
      valign: "middle",
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: summaryLabelWidth },
      1: { cellWidth: summaryAmountWidth, halign: "right" },
    },
  });

  const summaryEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setDrawColor(...RECEIPT.teal);
  doc.setLineWidth(0.5);
  doc.line(margin, summaryEnd, margin + 28, summaryEnd);
  doc.setDrawColor(...RECEIPT.line);
  doc.setLineWidth(0.25);
  doc.line(margin + 30, summaryEnd, pageWidth - margin, summaryEnd);

  doc.setFontSize(7.5);
  doc.setTextColor(...RECEIPT.muted);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This is a computer-generated receipt. No physical signature is required.",
    margin,
    summaryEnd + 6,
  );
  doc.text(`Document generated on ${generatedAt}`, margin, summaryEnd + 11);
  doc.text(`For billing queries, contact the ${schoolName} accounts office.`, margin, summaryEnd + 16);

  doc.setFillColor(...RECEIPT.teal);
  doc.rect(0, doc.internal.pageSize.getHeight() - 4, pageWidth, 4, "F");

  doc.save(`receipt-${payment.id}.pdf`);
}

function drawReceiptBrandHeader(doc: jsPDF, pageWidth: number) {
  doc.setFillColor(...RECEIPT.teal);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setFillColor(...RECEIPT.tealDeep);
  doc.rect(0, 38, pageWidth, 2, "F");
}
