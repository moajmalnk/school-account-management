import { apiRequest, getApiToken } from "@/lib/api/client";

export type DocumentSequenceKind = "receipt" | "voucher" | "salary_slip";

export type DocumentSequence = {
  kind: DocumentSequenceKind;
  prefix: string;
  nextNumber: number;
  padding: number;
  preview: string;
};

export type DocumentSequenceKindMeta = {
  kind: DocumentSequenceKind;
  label: string;
  description: string;
};

export const DOCUMENT_SEQUENCE_KIND_META: Record<
  DocumentSequenceKind,
  {
    label: string;
    description: string;
    defaultPrefix: string;
    defaultNext: number;
    defaultPadding: number;
  }
> = {
  receipt: {
    label: "Fee receipt",
    description: "Printed on fee payment receipts",
    defaultPrefix: "RC-",
    defaultNext: 1001,
    defaultPadding: 0,
  },
  voucher: {
    label: "Payment voucher",
    description: "Printed on expense / made-payment vouchers",
    defaultPrefix: "DISB-",
    defaultNext: 1,
    defaultPadding: 4,
  },
  salary_slip: {
    label: "Salary slip",
    description: "Staff salary payment reference numbers",
    defaultPrefix: "SAL-",
    defaultNext: 1,
    defaultPadding: 4,
  },
};

export function formatDocumentNumberPreview(
  prefix: string,
  nextNumber: number,
  padding: number,
): string {
  const n = Math.max(1, Math.floor(nextNumber) || 1);
  const pad = Math.max(0, Math.min(12, Math.floor(padding) || 0));
  const body = pad > 0 ? String(n).padStart(pad, "0") : String(n);
  return `${prefix}${body}`;
}

export async function apiFetchDocumentSequences(): Promise<{
  branchId: string;
  branchName: string;
  sequences: DocumentSequence[];
  kinds: DocumentSequenceKindMeta[];
}> {
  if (!getApiToken()) {
    return {
      branchId: "",
      branchName: "",
      sequences: [],
      kinds: [],
    };
  }
  return apiRequest("/api/settings/document-sequences.php");
}

export async function apiSaveDocumentSequences(
  sequences: Array<{
    kind: DocumentSequenceKind;
    prefix: string;
    nextNumber: number;
    padding: number;
  }>,
): Promise<{ sequences: DocumentSequence[] }> {
  if (!getApiToken()) {
    return { sequences: [] };
  }
  return apiRequest("/api/settings/document-sequences.php", {
    method: "PUT",
    body: { sequences },
  });
}
