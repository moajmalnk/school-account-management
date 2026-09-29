import { apiRequest } from "@/lib/api/client";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/api/contact";

export const LEAD_STATUSES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "demo_scheduled", label: "Demo scheduled" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "spam", label: "Spam" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["id"];
export type LeadPriority = "low" | "normal" | "high";
export type LeadChannel = "email" | "whatsapp" | "call";
export type LeadFilter = "all" | "open" | "followup" | LeadStatus;

export type LeadEvent = {
  id: number;
  type: "note" | "status" | "contacted" | "followup" | string;
  body: string | null;
  author: string | null;
  createdAt: string;
};

export type Lead = {
  id: string;
  topic: ContactTopic;
  name: string;
  email: string;
  phone: string | null;
  school: string | null;
  message: string;
  page: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  followUpAt: string | null;
  lastContactedAt: string | null;
  unread: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LeadDetail = Lead & {
  events: LeadEvent[];
  ipAddress?: string | null;
  otherEnquiries: Array<{ id: string; topic: ContactTopic; status: LeadStatus; createdAt: string }>;
};

export type LeadCounts = Record<LeadFilter, number>;

export type LeadSummary = { counts: LeadCounts; unreadCount: number };

const EMPTY_COUNTS: LeadCounts = {
  all: 0,
  open: 0,
  followup: 0,
  new: 0,
  contacted: 0,
  qualified: 0,
  demo_scheduled: 0,
  won: 0,
  lost: 0,
  spam: 0,
};

function normalizeSummary(data: Partial<LeadSummary> | undefined): LeadSummary {
  return {
    counts: { ...EMPTY_COUNTS, ...(data?.counts ?? {}) },
    unreadCount: Number(data?.unreadCount) || 0,
  };
}

export function leadStatusLabel(status: string): string {
  return LEAD_STATUSES.find((s) => s.id === status)?.label ?? status;
}

export function leadTopicLabel(topic: string): string {
  return CONTACT_TOPICS.find((t) => t.id === topic)?.label ?? "Other";
}

export async function fetchLeadSummary(): Promise<LeadSummary> {
  return normalizeSummary(await apiRequest<LeadSummary>("/api/super-admin/leads.php?summary=1"));
}

export async function fetchLeads(input: {
  status?: LeadFilter;
  topic?: ContactTopic | "all";
  q?: string;
}): Promise<LeadSummary & { leads: Lead[] }> {
  const params = new URLSearchParams();
  if (input.status && input.status !== "all") params.set("status", input.status);
  if (input.topic && input.topic !== "all") params.set("topic", input.topic);
  if (input.q?.trim()) params.set("q", input.q.trim());
  const qs = params.toString();
  const data = await apiRequest<LeadSummary & { leads: Lead[] }>(
    `/api/super-admin/leads.php${qs ? `?${qs}` : ""}`,
  );
  return { leads: Array.isArray(data.leads) ? data.leads : [], ...normalizeSummary(data) };
}

export async function fetchLead(id: string): Promise<LeadSummary & { lead: LeadDetail }> {
  const data = await apiRequest<LeadSummary & { lead: LeadDetail }>(
    `/api/super-admin/leads.php?id=${encodeURIComponent(id)}`,
  );
  return { lead: data.lead, ...normalizeSummary(data) };
}

async function postLead<T>(body: Record<string, unknown>): Promise<T & LeadSummary> {
  const data = await apiRequest<T & Partial<LeadSummary>>("/api/super-admin/leads.php", {
    method: "POST",
    body,
  });
  return { ...data, ...normalizeSummary(data) } as T & LeadSummary;
}

export function updateLead(
  id: string,
  patch: { status?: LeadStatus; priority?: LeadPriority; followUpAt?: string | null },
) {
  return postLead<{ lead: LeadDetail }>({ action: "update", id, ...patch });
}

export function addLeadNote(id: string, body: string) {
  return postLead<{ lead: LeadDetail }>({ action: "note", id, body });
}

export function logLeadContact(id: string, channel: LeadChannel) {
  return postLead<{ lead: LeadDetail }>({ action: "contacted", id, channel });
}

export function deleteLead(id: string) {
  return postLead<{ deleted: boolean; id: string }>({ action: "delete", id });
}

export function bulkUpdateLeadStatus(ids: string[], status: LeadStatus) {
  return postLead<{ updated: number }>({ action: "bulkStatus", ids, status });
}
