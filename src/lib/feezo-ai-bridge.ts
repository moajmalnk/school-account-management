export const FEEZO_ASK_EVENT = "feezo:ask";

/** Search param that opens the Feezo panel over any tenant page (`?ai=1`). */
export const FEEZO_OPEN_PARAM = "ai";

export type FeezoAskDetail = { prompt: string };

/** Opens the Feezo AI panel and sends `prompt` as a new user message. */
export function askFeezo(prompt: string) {
  const text = prompt.trim().slice(0, 500);
  if (!text || typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<FeezoAskDetail>(FEEZO_ASK_EVENT, { detail: { prompt: text } }),
  );
}
