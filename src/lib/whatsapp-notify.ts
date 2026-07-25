/** BugRicer Notify API — WhatsApp bulk/single send */

const DEFAULT_API_KEY = "0fd1dd43b6c3ff5bb3770dfdd9c5346a";
const DIRECT_ENDPOINT = "https://notifyapi.bugricer.com/wapp/api/send";

/** Prefer Vite proxy in dev to avoid CORS; fall back to direct endpoint. */
function sendEndpoint() {
  if (import.meta.env.DEV) return "/api/bugricer-whatsapp/send";
  return DIRECT_ENDPOINT;
}

export function toNotifyWhatsAppNumber(raw?: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length >= 10) return digits;
  return null;
}

export type WhatsAppNotifyResult = {
  ok: boolean;
  status: number;
  body: string;
};

export async function sendWhatsAppNotify(params: {
  numbers: string[];
  message: string;
  apiKey?: string;
}): Promise<WhatsAppNotifyResult> {
  const unique = Array.from(
    new Set(params.numbers.map((n) => n.replace(/\D/g, "")).filter(Boolean)),
  );
  if (!unique.length) {
    throw new Error("No valid phone numbers to message");
  }
  const msg = params.message.trim();
  if (!msg) {
    throw new Error("Message is required");
  }

  const form = new FormData();
  form.append("apikey", params.apiKey || DEFAULT_API_KEY);
  form.append("number", unique.join(","));
  form.append("msg", msg);

  const res = await fetch(sendEndpoint(), {
    method: "POST",
    body: form,
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}
