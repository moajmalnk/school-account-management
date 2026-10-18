import type { Payment, Student, StudentFeeBreak } from "@/lib/tenant-store";

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Student receipts are matched by payer name (same rule as fee statement). */
export function paymentBelongsToStudent(payment: Payment, student: Student): boolean {
  if (payment.payerType === "external") return false;
  return normalizeName(payment.name) === normalizeName(student.name);
}

export type StudentRecordLinks = {
  paymentCount: number;
  feeBreakCount: number;
  openDue: number;
  hasDocuments: boolean;
  hasConcession: boolean;
};

export function analyzeStudentRecordLinks(
  student: Student,
  payments: readonly Payment[],
  feeBreaks: readonly StudentFeeBreak[],
): StudentRecordLinks {
  const paymentCount = payments.filter((p) => paymentBelongsToStudent(p, student)).length;
  const feeBreakCount = feeBreaks.filter((b) => b.studentId === student.id).length;
  const docs = student.documents ?? [];
  const hasDocuments = docs.some(
    (d) =>
      Boolean(d.number?.trim()) ||
      (Array.isArray(d.attachments) && d.attachments.length > 0),
  );
  return {
    paymentCount,
    feeBreakCount,
    openDue: Math.max(0, Number(student.due) || 0),
    hasDocuments,
    hasConcession: Boolean(student.hasConcession || student.concessionFees),
  };
}

/** Soft-delete / recycle is blocked once the student has ledger or file history. */
export function studentHasProtectedHistory(links: StudentRecordLinks): boolean {
  return (
    links.paymentCount > 0 ||
    links.feeBreakCount > 0 ||
    links.openDue > 0 ||
    links.hasDocuments ||
    links.hasConcession
  );
}

export function describeStudentProtectedHistory(links: StudentRecordLinks): string {
  const parts: string[] = [];
  if (links.paymentCount > 0) {
    parts.push(
      `${links.paymentCount} payment${links.paymentCount === 1 ? "" : "s"}`,
    );
  }
  if (links.openDue > 0) parts.push("open dues");
  if (links.feeBreakCount > 0) {
    parts.push(
      `${links.feeBreakCount} fee break${links.feeBreakCount === 1 ? "" : "s"}`,
    );
  }
  if (links.hasDocuments) parts.push("documents on file");
  if (links.hasConcession) parts.push("concession schedule");
  if (parts.length === 0) return "related school records";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}
