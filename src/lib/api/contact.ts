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

export const INSTITUTE_TYPES = [
  { id: "school", label: "School" },
  { id: "academy", label: "Academy" },
  { id: "tuition", label: "Tuition" },
  { id: "other", label: "Other" },
] as const;

export type InstituteType = (typeof INSTITUTE_TYPES)[number]["id"];

export const PHONE_COUNTRY_CODES = [
  { code: "+91", label: "IN +91" },
  { code: "+971", label: "AE +971" },
  { code: "+966", label: "SA +966" },
  { code: "+974", label: "QA +974" },
  { code: "+968", label: "OM +968" },
  { code: "+965", label: "KW +965" },
  { code: "+973", label: "BH +973" },
  { code: "+1", label: "US/CA +1" },
  { code: "+44", label: "UK +44" },
  { code: "+61", label: "AU +61" },
] as const;

export type ContactPayload = {
  topic: ContactTopic;
  name: string;
  email: string;
  phone?: string;
  school?: string;
  cityCountry?: string;
  instituteType?: InstituteType;
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
