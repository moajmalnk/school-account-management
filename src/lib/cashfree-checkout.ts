/**
 * Opens Cashfree's hosted checkout in a modal. The page reloads fees after it closes.
 */

type CashfreeCheckoutResult = {
  error?: { message?: string };
  paymentDetails?: { paymentMessage?: string };
};

type CashfreeClient = {
  checkout: (options: { paymentSessionId: string; redirectTarget: "_modal" }) => Promise<CashfreeCheckoutResult>;
};

declare global {
  interface Window {
    Cashfree?: (options: { mode: "production" | "sandbox" }) => CashfreeClient;
  }
}

function loadCashfreeScript(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment window"));
    document.body.appendChild(script);
  });
}

/** Returns "paid" when Cashfree reports a completed attempt, and "closed" when the parent dismisses it. */
export async function openCashfreeCheckout(paymentSessionId: string): Promise<"paid" | "closed"> {
  await loadCashfreeScript();
  if (!window.Cashfree) {
    throw new Error("Payment window is unavailable");
  }
  const cashfree = window.Cashfree({ mode: "production" });
  const result = await cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_modal",
  });
  if (result?.error && !result.paymentDetails) {
    return "closed";
  }
  return "paid";
}
