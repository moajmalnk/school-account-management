import { toast } from "sonner";

/**
 * File downloads that work in desktop/mobile browsers *and* inside the Feezo
 * Flutter app. WebViews cannot follow `<a download href="blob:…">` — they try to
 * navigate to the blob URL and the app shows "Unable to load Feezo". Inside the
 * app we hand the file to Flutter over a JS bridge instead.
 *
 * Flutter contract (either plugin works):
 *  - flutter_inappwebview: `addJavaScriptHandler(handlerName: 'feezoDownload', …)`
 *  - webview_flutter:      `addJavaScriptChannel('FeezoDownload', …)`
 * Payload: { filename, mimeType, base64, action: 'download' | 'print' | 'preview' }
 */

export type NativeFileAction = "download" | "print" | "preview";

export type SaveFileResult = "native" | "shared" | "browser" | "aborted" | "failed";

type InAppWebViewBridge = {
  callHandler: (name: string, ...args: unknown[]) => Promise<unknown>;
};

type JsChannel = { postMessage: (message: string) => void };

declare global {
  interface Window {
    flutter_inappwebview?: InAppWebViewBridge;
    FeezoDownload?: JsChannel;
  }
}

const APP_UA_TOKEN = /FeezoApp/i;

function hasInAppBridge(): boolean {
  return (
    typeof window !== "undefined" && typeof window.flutter_inappwebview?.callHandler === "function"
  );
}

function hasChannelBridge(): boolean {
  return typeof window !== "undefined" && typeof window.FeezoDownload?.postMessage === "function";
}

/** True inside the Feezo Flutter shell (bridge injected or custom user-agent token). */
export function isFeezoAppShell(): boolean {
  if (typeof navigator === "undefined") return false;
  return hasInAppBridge() || hasChannelBridge() || APP_UA_TOKEN.test(navigator.userAgent);
}

/** Any embedded WebView (Android `; wv)` or iOS WKWebView without Safari chrome). */
export function isEmbeddedWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  if (isFeezoAppShell()) return true;
  const ua = navigator.userAgent;
  if (/Android/i.test(ua) && /; wv\)/i.test(ua)) return true;
  const iOS = /iPhone|iPad|iPod/i.test(ua);
  return iOS && /AppleWebKit/i.test(ua) && !/Safari\//i.test(ua);
}

function guessMimeType(filename: string, blob: Blob): string {
  if (blob.type) return blob.type.split(";")[0];
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "csv") return "text/csv";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

async function sendToFlutter(blob: Blob, filename: string, action: NativeFileAction) {
  const payload = {
    filename,
    mimeType: guessMimeType(filename, blob),
    base64: await blobToBase64(blob),
    action,
  };
  if (hasInAppBridge()) {
    await window.flutter_inappwebview!.callHandler("feezoDownload", payload);
    return;
  }
  window.FeezoDownload!.postMessage(JSON.stringify(payload));
}

async function shareFile(blob: Blob, filename: string): Promise<SaveFileResult | null> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return null;
  const file = new File([blob], filename, { type: guessMimeType(filename, blob) });
  if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
    return null;
  }
  try {
    await navigator.share({ files: [file], title: filename });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "aborted";
    return null;
  }
}

function browserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Safari needs the URL alive until the download has started.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Save / hand off a generated file without ever navigating an embedded WebView. */
export async function saveFile(
  blob: Blob,
  filename: string,
  action: NativeFileAction = "download",
): Promise<SaveFileResult> {
  if (hasInAppBridge() || hasChannelBridge()) {
    try {
      await sendToFlutter(blob, filename, action);
      return "native";
    } catch {
      toast.error("Could not save the file in the app");
      return "failed";
    }
  }

  if (isEmbeddedWebView()) {
    const shared = await shareFile(blob, filename);
    if (shared) return shared;
    toast.error("Downloads need the latest Feezo app", {
      description: "Update the app, or open Feezo in your browser to download this file.",
    });
    return "failed";
  }

  browserDownload(blob, filename);
  return "browser";
}
