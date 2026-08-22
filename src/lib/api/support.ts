import { apiRequest } from "@/lib/api/client";

/** Digits only for wa.me — +91 97440 09048 */
export const SUPPORT_DEFAULT_WHATSAPP_E164 = "919744009048";

export function whatsappDigits(raw?: string | null): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return SUPPORT_DEFAULT_WHATSAPP_E164;
}

export function formatWhatsAppDisplay(raw?: string | null): string {
  const digits = whatsappDigits(raw);
  if (digits.startsWith("91") && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return digits ? `+${digits}` : "";
}

export type SupportSettings = {
  supportEmail: string;
  whatsappE164: string;
  greeting: string;
};

export type SupportFaq = {
  id: string;
  question: string;
  keywords?: string;
  answer?: string;
  sortOrder?: number;
  active?: boolean;
};

export type SupportAttachmentKind = "file" | "image" | "screenshot" | "voice";

export type SupportAttachment = {
  id: string;
  kind: SupportAttachmentKind;
  name: string;
  mimeType: string;
  size: number;
  path: string;
  durationMs?: number | null;
};

export type SupportMessage = {
  id: string;
  author: "school" | "bot" | "admin";
  body: string;
  attachments?: SupportAttachment[];
  createdAt: string;
};

export type SupportTicketStatus = "open" | "answered" | "closed";

export type SupportTicket = {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  schoolUnread: boolean;
  adminUnread: boolean;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  tenantName?: string;
  lastMessage?: { author: string; body: string; createdAt: string } | null;
  messages?: SupportMessage[];
};

export type SupportDesk = {
  settings: SupportSettings;
  faqs: SupportFaq[];
};

export type SupportMatchResult = {
  matched: boolean;
  faq: SupportFaq | null;
  fallback: string;
};

export async function fetchSupportDesk(): Promise<SupportDesk> {
  const data = await apiRequest<SupportDesk>("/api/support/desk.php");
  return {
    settings: {
      supportEmail: data.settings?.supportEmail || "support@schoolaccounts.in",
      whatsappE164: data.settings?.whatsappE164 || SUPPORT_DEFAULT_WHATSAPP_E164,
      greeting:
        data.settings?.greeting ||
        "Hi — I am the Feezo assistant. Pick a question below, or type your own.",
    },
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
  };
}

export async function matchSupportFaq(input: {
  text?: string;
  faqId?: string;
}): Promise<SupportMatchResult> {
  const data = await apiRequest<SupportMatchResult>("/api/support/desk.php", {
    method: "POST",
    body: { action: "match", text: input.text ?? "", faqId: input.faqId },
  });
  return {
    matched: Boolean(data.matched),
    faq: data.faq ?? null,
    fallback:
      data.fallback ||
      "I do not have that on the help list. Send it to Feezo or use Gmail / WhatsApp.",
  };
}

export async function fetchSupportTickets(): Promise<SupportTicket[]> {
  const data = await apiRequest<{ tickets?: SupportTicket[] }>("/api/support/tickets.php");
  return Array.isArray(data.tickets) ? data.tickets : [];
}

export async function createSupportTicket(input: {
  subject?: string;
  body: string;
  attachments?: SupportAttachment[];
}): Promise<SupportTicket> {
  const data = await apiRequest<{ ticket: SupportTicket }>("/api/support/tickets.php", {
    method: "POST",
    body: {
      action: "create",
      subject: input.subject ?? "",
      body: input.body,
      attachments: input.attachments ?? [],
    },
  });
  return data.ticket;
}

export async function replySupportTicket(input: {
  ticketId: string;
  body: string;
  attachments?: SupportAttachment[];
}): Promise<SupportTicket> {
  const data = await apiRequest<{ ticket: SupportTicket }>("/api/support/tickets.php", {
    method: "POST",
    body: {
      action: "reply",
      ticketId: input.ticketId,
      body: input.body,
      attachments: input.attachments ?? [],
    },
  });
  return data.ticket;
}

export async function markSupportTicketRead(ticketId: string): Promise<SupportTicket> {
  const data = await apiRequest<{ ticket: SupportTicket }>("/api/support/tickets.php", {
    method: "POST",
    body: { action: "read", ticketId },
  });
  return data.ticket;
}

export type SuperAdminSupportDesk = {
  settings: SupportSettings;
  faqs: SupportFaq[];
  tickets: SupportTicket[];
  unreadCount: number;
};

export async function fetchSuperAdminSupport(status?: string): Promise<SuperAdminSupportDesk> {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const data = await apiRequest<SuperAdminSupportDesk>(`/api/super-admin/support.php${qs}`);
  return {
    settings: data.settings ?? {
      supportEmail: "support@schoolaccounts.in",
      whatsappE164: SUPPORT_DEFAULT_WHATSAPP_E164,
      greeting: "",
    },
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
    tickets: Array.isArray(data.tickets) ? data.tickets : [],
    unreadCount: Number(data.unreadCount) || 0,
  };
}

export async function fetchSuperAdminSupportTicket(ticketId: string): Promise<SupportTicket> {
  const data = await apiRequest<{ ticket: SupportTicket }>(
    `/api/super-admin/support.php?ticketId=${encodeURIComponent(ticketId)}`,
  );
  return data.ticket;
}

export async function postSuperAdminSupport<T>(body: Record<string, unknown>): Promise<T> {
  return apiRequest<T>("/api/super-admin/support.php", { method: "POST", body });
}

export const SUPPORT_MAX_ATTACHMENTS = 5;
export const SUPPORT_MAX_BYTES = 8 * 1024 * 1024;
export const SUPPORT_VOICE_MAX_MS = 120_000;

export async function uploadSupportAttachment(input: {
  file: File;
  kind: SupportAttachmentKind;
  ticketId?: string;
  durationMs?: number;
}): Promise<SupportAttachment> {
  const form = new FormData();
  form.append("file", input.file, input.file.name);
  form.append("kind", input.kind);
  if (input.ticketId) form.append("ticketId", input.ticketId);
  if (input.durationMs && input.durationMs > 0) {
    form.append("durationMs", String(Math.round(input.durationMs)));
  }
  const data = await apiRequest<SupportAttachment>("/api/support/upload.php", {
    method: "POST",
    body: form,
  });
  const path = decodeURIComponent(String(data.path || data.url || ""));
  return {
    id: data.id,
    kind: data.kind,
    name: data.name,
    mimeType: data.mimeType,
    size: data.size,
    path,
    durationMs: data.durationMs ?? input.durationMs ?? null,
  };
}

export function supportPreviewLabel(body?: string | null, attachments?: SupportAttachment[] | null): string {
  const text = (body || "").trim();
  if (text) return text;
  const items = attachments ?? [];
  if (items.some((item) => item.kind === "voice")) return "Voice message";
  if (items.some((item) => item.kind === "screenshot")) return "Screenshot";
  if (items.some((item) => item.kind === "image" || item.mimeType.startsWith("image/"))) return "Photo";
  if (items[0]?.name) return items[0].name;
  if (items.length) return "Attachment";
  return "";
}

export function formatSupportBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSupportDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function isSupportImage(att: Pick<SupportAttachment, "kind" | "mimeType" | "name">): boolean {
  return (
    att.kind === "image" ||
    att.kind === "screenshot" ||
    att.mimeType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp)$/i.test(att.name)
  );
}

export function isSupportVoice(att: Pick<SupportAttachment, "kind" | "mimeType">): boolean {
  return att.kind === "voice" || att.mimeType.startsWith("audio/");
}

export function classifySupportFile(file: File, requested?: SupportAttachmentKind): SupportAttachmentKind {
  if (requested === "voice" || requested === "screenshot") return requested;
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "voice";
  return "file";
}
