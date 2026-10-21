/** Student attendance PDF + CSV exports. */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { downloadTablePdf, drawPdfFeezoCredit, type PdfEmitAction } from "@/lib/finance-export";
import { formatDownloadFilename } from "@/lib/download-names";
import {
  ATTENDANCE_STATUS_LABELS,
  type AttendanceReportResponse,
  type AttendanceRosterStudent,
  type StudentAttendanceStatus,
} from "@/lib/student-attendance";

function statusLabel(status: StudentAttendanceStatus | null | undefined): string {
  if (!status) return "Unmarked";
  return ATTENDANCE_STATUS_LABELS[status] ?? status;
}

export function downloadAttendanceDayCsv(
  date: string,
  students: AttendanceRosterStudent[],
  schoolName?: string,
) {
  const header = ["Student ID", "Name", "Class", "Guardian", "Phone", "Status", "Note"];
  const lines = [
    header.join(","),
    ...students.map((s) =>
      [s.studentId, s.name, s.cls, s.guardian, s.phone ?? "", statusLabel(s.status), s.note ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const filename = formatDownloadFilename("studentAttendance", "csv", {
    date,
    school: schoolName,
    report: "daily-csv",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAttendanceDailyPdf(params: {
  date: string;
  students: AttendanceRosterStudent[];
  schoolName?: string;
  classLabel?: string;
  action?: PdfEmitAction;
}) {
  const { date, students, schoolName, classLabel, action = "download" } = params;
  const present = students.filter((s) => s.status === "present").length;
  const absent = students.filter((s) => s.status === "absent").length;
  const halfday = students.filter((s) => s.status === "halfday").length;
  const late = students.filter((s) => s.status === "late").length;
  const leave = students.filter((s) => s.status === "leave").length;
  const unmarked = students.filter((s) => !s.status).length;

  downloadTablePdf({
    filename: formatDownloadFilename("studentAttendance", "pdf", {
      date,
      school: schoolName,
      report: "daily",
    }),
    title: "Daily attendance register",
    subtitle: [schoolName, classLabel && classLabel !== "all" ? classLabel : null, date]
      .filter(Boolean)
      .join(" · "),
    meta: date,
    tableTitle: "Students",
    headers: ["ID", "Name", "Class", "Status"],
    rows: students.map((s) => [s.studentId, s.name, s.cls, statusLabel(s.status)]),
    summaryItems: [
      { label: "Present", value: String(present) },
      { label: "Absent", value: String(absent) },
      { label: "Halfday", value: String(halfday) },
      { label: "Late", value: String(late) },
      { label: "Leave", value: String(leave) },
      { label: "Unmarked", value: String(unmarked) },
    ],
    summaryPlacement: "before",
    action,
  });
}

export function downloadAttendanceMonthlyPdf(params: {
  report: AttendanceReportResponse;
  schoolName?: string;
  action?: PdfEmitAction;
}) {
  const { report, schoolName, action = "download" } = params;
  const classLabel =
    report.class !== "all"
      ? `${report.class}${report.division !== "all" ? ` - ${report.division}` : ""}`
      : "All classes";

  downloadTablePdf({
    filename: formatDownloadFilename("studentAttendance", "pdf", {
      date: report.from.slice(0, 7),
      school: schoolName,
      report: "monthly",
    }),
    title: "Monthly attendance summary",
    subtitle: [schoolName, classLabel, `${report.from} → ${report.to}`].filter(Boolean).join(" · "),
    meta: `${report.from} – ${report.to}`,
    tableTitle: "Per student",
    headers: ["ID", "Name", "Class", "P", "A", "H", "L", "Lv", "%"],
    rows: report.byStudent.map((s) => [
      s.studentId,
      s.name,
      s.cls,
      String(s.present),
      String(s.absent),
      String(s.halfday),
      String(s.late),
      String(s.leave),
      `${s.percent}%`,
    ]),
    landscape: true,
    action,
  });
}

export function downloadAttendanceDetailedPdf(params: {
  report: AttendanceReportResponse;
  schoolName?: string;
  action?: PdfEmitAction;
}) {
  const { report, schoolName, action = "download" } = params;
  downloadTablePdf({
    filename: formatDownloadFilename("studentAttendance", "pdf", {
      date: report.from,
      school: schoolName,
      report: "detailed",
    }),
    title: "Detailed attendance report",
    subtitle: [schoolName, `${report.from} → ${report.to}`].filter(Boolean).join(" · "),
    meta: `${report.from} – ${report.to}`,
    tableTitle: "Marks",
    headers: ["Date", "ID", "Name", "Class", "Status"],
    rows: report.rows.map((r) => [r.date, r.studentId, r.name, r.cls, statusLabel(r.status)]),
    landscape: true,
    action,
  });
}

/** In-memory PDF blob for WhatsApp file share. */
export function buildAttendanceDailyPdfBlob(params: {
  date: string;
  students: AttendanceRosterStudent[];
  schoolName?: string;
  classLabel?: string;
}): { blob: Blob; filename: string } {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const filename = formatDownloadFilename("studentAttendance", "pdf", {
    date: params.date,
    school: params.schoolName,
    report: "daily",
  });
  doc.setFontSize(14);
  doc.text("Daily attendance register", 12, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    [params.schoolName, params.classLabel, params.date].filter(Boolean).join(" · "),
    12,
    22,
  );
  autoTable(doc, {
    startY: 28,
    head: [["ID", "Name", "Class", "Status"]],
    body: params.students.map((s) => [s.studentId, s.name, s.cls, statusLabel(s.status)]),
    styles: { fontSize: 8 },
  });
  stampAttendancePdfCredit(doc);
  const blob = doc.output("blob");
  return { blob, filename };
}

function stampAttendancePdfCredit(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPdfFeezoCredit(doc, pageHeight - 8);
  }
}

export function buildAttendanceMonthlyPdfBlob(params: {
  report: AttendanceReportResponse;
  schoolName?: string;
}): { blob: Blob; filename: string } {
  const { report, schoolName } = params;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const filename = formatDownloadFilename("studentAttendance", "pdf", {
    date: report.from.slice(0, 7),
    school: schoolName,
    report: "monthly",
  });
  doc.setFontSize(14);
  doc.text("Monthly attendance summary", 12, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text([schoolName, `${report.from} → ${report.to}`].filter(Boolean).join(" · "), 12, 22);
  autoTable(doc, {
    startY: 28,
    head: [["ID", "Name", "Class", "P", "A", "H", "L", "Lv", "%"]],
    body: report.byStudent.map((s) => [
      s.studentId,
      s.name,
      s.cls,
      String(s.present),
      String(s.absent),
      String(s.halfday),
      String(s.late),
      String(s.leave),
      `${s.percent}%`,
    ]),
    styles: { fontSize: 8 },
  });
  stampAttendancePdfCredit(doc);
  const blob = doc.output("blob");
  return { blob, filename };
}
