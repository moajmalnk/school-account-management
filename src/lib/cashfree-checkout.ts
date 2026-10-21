/**
 * Opens Cashfree's hosted checkout in a modal. The page reloads fees after it closes.
 */

type CashfreeCheckoutResult = {
  error?: { message?: string };
  paymentDetails?: { paymentMessage?: string };
};

type CashfreeClient = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget: "_modal";
    returnUrl?: string;
  }) => Promise<CashfreeCheckoutResult>;
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

/**
 * Radix dialogs set pointer-events: none on the page. Cashfree's checkout is
 * added outside that dialog, so its QR and payment buttons paint but ignore clicks.
 */
function keepCheckoutClickable(): () => void {
  const unlock = () => {
    document.body.style.setProperty("pointer-events", "auto", "important");
    document.querySelectorAll<HTMLIFrameElement>("iframe").forEach((frame) => {
      const mark = `${frame.src} ${frame.id} ${frame.className}`;
      if (!/cashfree/i.test(mark)) return;
      if (!frame.allow.includes("payment")) {
        frame.allow = "payment *; clipboard-write *; publickey-credentials-get *";
      }
      let node: HTMLElement | null = frame;
      while (node && node !== document.documentElement) {
        if (window.getComputedStyle(node).pointerEvents === "none") {
          node.style.setProperty("pointer-events", "auto", "important");
        }
        node = node.parentElement;
      }
    });
  };
  unlock();
  const observer = new MutationObserver(unlock);
  observer.observe(document.body, { childList: true, subtree: true });
  const timer = window.setInterval(unlock, 250);
  return () => {
    observer.disconnect();
    window.clearInterval(timer);
    document.body.style.removeProperty("pointer-events");
  };
}

/** Where Cashfree should send this browser after UPI, net banking, or the QR flow. */
export function checkoutReturnUrl(path: string, orderId: string): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set("order_id", orderId);
  return url.toString();
}

/** Returns "paid" when Cashfree reports a completed attempt, and "closed" when the parent dismisses it. */
export async function openCashfreeCheckout(
  paymentSessionId: string,
  returnUrl?: string,
): Promise<"paid" | "closed"> {
  await loadCashfreeScript();
  if (!window.Cashfree) {
    throw new Error("Payment window is unavailable");
  }
  const cashfree = window.Cashfree({ mode: "production" });
  const release = keepCheckoutClickable();
  try {
    const result = await cashfree.checkout({
      paymentSessionId,
      redirectTarget: "_modal",
      ...(returnUrl ? { returnUrl } : {}),
    });
    if (result?.error && !result.paymentDetails) {
      return "closed";
    }
    return "paid";
  } finally {
    release();
  }
}
