/**
 * Opens Cashfree's hosted checkout in a modal.
 * After UPI or net banking, Cashfree loads the return page inside that modal.
 * The return page moves the top window, which closes the popup.
 * Inside the Feezo app WebView the checkout replaces the page, so the app can open UPI apps.
 */
import { isEmbeddedWebView } from "@/lib/native-download";

const PAY_RETURN_MESSAGE = "feezo-pay-return";
const PAY_RETURN_PATHS = new Set(["/family/fees", "/tenant/settings", "/tenant/finance"]);

let checkoutOpen = false;
let returnListenerReady = false;

type CashfreeCheckoutResult = {
  error?: { message?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
};

type CashfreeClient = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget: "_modal" | "_self";
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

function allowedPayHref(href: string): string | null {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!PAY_RETURN_PATHS.has(url.pathname)) return null;
    const orderId = url.searchParams.get("order_id")?.trim() ?? "";
    if (!/^[A-Za-z0-9_-]{4,50}$/.test(orderId)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Drop a Cashfree modal left behind by a refresh or a return that stayed inside the frame. */
export function dismissCashfreeOverlay(force = false): void {
  if (checkoutOpen && !force) return;
  document.querySelectorAll("iframe").forEach((frame) => {
    const hint = `${frame.id} ${frame.className} ${frame.src}`;
    if (!/cashfree/i.test(hint)) return;
    const shell = frame.parentElement;
    frame.remove();
    if (!shell || shell === document.body) return;
    const marked = /cashfree/i.test(`${shell.id} ${shell.className}`);
    const fixed = window.getComputedStyle(shell).position === "fixed";
    if (marked || fixed) shell.remove();
  });
}

/**
 * Close the checkout popup when Cashfree redirects inside it, including after a refresh of that frame.
 * Call once from the app root so every page can break out.
 */
export function installCheckoutReturn(): void {
  if (typeof window === "undefined" || returnListenerReady) return;
  returnListenerReady = true;

  if (window.top !== window) {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id")?.trim() ?? "";
    let next = window.location.pathname;
    if (next === "/pay-return.html" || next === "/pay/return") {
      next = params.get("next") || "/family/fees";
    }
    const target = new URL(next, window.location.origin);
    params.forEach((value, key) => {
      if (key === "next") return;
      target.searchParams.set(key, value);
    });
    if (!target.searchParams.get("order_id") && orderId) {
      target.searchParams.set("order_id", orderId);
    }
    const href = allowedPayHref(target.toString());
    if (!href) return;
    try {
      const topWindow = window.top;
      if (!topWindow) throw new Error("No top window");
      topWindow.postMessage({ type: PAY_RETURN_MESSAGE, href }, window.location.origin);
      topWindow.location.replace(href);
    } catch {
      window.parent.postMessage({ type: PAY_RETURN_MESSAGE, href }, window.location.origin);
    }
    return;
  }

  const path = window.location.pathname;
  if (path === "/pay-return.html" || path === "/pay/return") {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/family/fees";
    const target = new URL(next, window.location.origin);
    const tab = params.get("tab")?.trim() ?? "";
    const orderId = params.get("order_id")?.trim() ?? "";
    if (tab && /^[a-z0-9-]{1,40}$/.test(tab)) target.searchParams.set("tab", tab);
    if (orderId) target.searchParams.set("order_id", orderId);
    const href = allowedPayHref(target.toString());
    if (href) {
      window.location.replace(href);
      return;
    }
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data as { type?: string; href?: string } | null;
    if (!data || data.type !== PAY_RETURN_MESSAGE || typeof data.href !== "string") return;
    const href = allowedPayHref(data.href);
    if (!href) return;
    dismissCashfreeOverlay(true);
    window.location.replace(href);
  });

  window.addEventListener("pageshow", () => {
    dismissCashfreeOverlay();
  });
}

/** Where Cashfree should send this browser after UPI, net banking, or the QR flow. */
export function checkoutReturnUrl(path: string, orderId: string): string {
  const source = new URL(path, window.location.origin);
  const url = new URL("/pay-return.html", window.location.origin);
  url.searchParams.set("next", source.pathname);
  const tab = source.searchParams.get("tab");
  if (tab && /^[a-z0-9-]{1,40}$/.test(tab)) url.searchParams.set("tab", tab);
  url.searchParams.set("order_id", orderId);
  return url.toString();
}

/** Returns "paid" when Cashfree reports a completed attempt, "redirect" when the bank will send the browser to the return page, and "closed" when the parent dismisses it. */
export async function openCashfreeCheckout(
  paymentSessionId: string,
  returnUrl?: string,
): Promise<"paid" | "closed" | "redirect"> {
  await loadCashfreeScript();
  if (!window.Cashfree) {
    throw new Error("Payment window is unavailable");
  }
  const cashfree = window.Cashfree({ mode: "production" });
  const release = keepCheckoutClickable();
  checkoutOpen = true;
  let keepOverlay = false;
  try {
    // Phone and desktop browsers can show UPI apps inside the modal.
    // The Feezo app WebView cannot: Cashfree hides those apps in a nested frame.
    // A full-page checkout lets the app open PhonePe, GPay, and Paytm itself.
    const result = await cashfree.checkout({
      paymentSessionId,
      redirectTarget: isEmbeddedWebView() ? "_self" : "_modal",
      ...(returnUrl ? { returnUrl } : {}),
    });
    if (result?.redirect && !result.paymentDetails) {
      keepOverlay = true;
      return "redirect";
    }
    if (result?.error && !result.paymentDetails) {
      return "closed";
    }
    return "paid";
  } finally {
    checkoutOpen = false;
    release();
    if (!keepOverlay) dismissCashfreeOverlay(true);
  }
}
