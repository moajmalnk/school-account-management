import { apiRequest } from "@/lib/api/client";

export const CONTACT_TOPICS = [
  { id: "demo", label: "Book a demo" },
  { id: "sales", label: "Sales & pricing" },
  { id: "support", label: "Product support" },
  { id: "billing", label: "Billing" },
  { id: "partnership", label: "Partnership" },
  { id: "other", label: "Something else" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["id"];

export type ContactPayload = {
  topic: ContactTopic;
  name: string;
  email: string;
  phone?: string;
  school?: string;
  message: string;
  /** Honeypot — must stay empty. */
  website?: string;
  /** Time from first render to submit; very fast posts are treated as bots. */
  elapsedMs: number;
  page?: string;
};

export type ContactResult = { message: string; reference: string };

export function apiSubmitContact(payload: ContactPayload): Promise<ContactResult> {
  return apiRequest<ContactResult>("/api/public/contact.php", {
    method: "POST",
    body: payload,
    auth: false,
    skipUnauthorized: true,
    timeoutMs: 15000,
  });
}
