import { apiRequest, getApiToken } from "@/lib/api/client";

export type DocumentSequenceKind = "receipt" | "voucher" | "salary_slip" | "journal";

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
  journal: {
    label: "Journal voucher",
    description: "Manual journals and opening balances",
    defaultPrefix: "JV-",
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

type SchoolSequencesResponse = {
  activeBranchId?: string;
  branchId?: string;
  branchName?: string;
  sequences?: DocumentSequence[];
  documentSequences?: DocumentSequence[];
  kinds?: DocumentSequenceKindMeta[];
};

function emptySequencesResult(): {
  branchId: string;
  branchName: string;
  sequences: DocumentSequence[];
  kinds: DocumentSequenceKindMeta[];
} {
  return {
    branchId: "",
    branchName: "",
    sequences: [],
    kinds: [],
  };
}

function mapSequencesResponse(data: SchoolSequencesResponse | null | undefined) {
  const sequences = Array.isArray(data?.sequences)
    ? data.sequences
    : Array.isArray(data?.documentSequences)
      ? data.documentSequences
      : [];
  return {
    branchId: data?.branchId || data?.activeBranchId || "",
    branchName: data?.branchName || "",
    sequences,
    kinds: Array.isArray(data?.kinds) ? data.kinds : [],
  };
}

/**
 * Read/write via school.php (already live on api.feezo.app).
 * The dedicated document-sequences.php file 404s until it is uploaded.
 */
export async function apiFetchDocumentSequences(): Promise<{
  branchId: string;
  branchName: string;
  sequences: DocumentSequence[];
  kinds: DocumentSequenceKindMeta[];
}> {
  if (!getApiToken()) {
    return emptySequencesResult();
  }
  const data = await apiRequest<SchoolSequencesResponse>("/api/settings/school.php");
  return mapSequencesResponse(data);
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
  const data = await apiRequest<SchoolSequencesResponse>("/api/settings/school.php", {
    method: "PUT",
    body: { sequences },
  });
  return { sequences: mapSequencesResponse(data).sequences };
}
