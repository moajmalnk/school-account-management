import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { easeOutExpo } from "@/components/marketing/motion";

const VIDEO_SRC = "/explode_video.mp4";
const POSTER_START = "/home/explode-start.jpg";

/** Bump when the video file changes so stale copies are evicted. */
const VIDEO_VERSION = "v1";
const CACHE_NAME = `feezo-hero-${VIDEO_VERSION}`;
const CACHED_COOKIE = "feezo_hero_cached";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
/** Loop seams can emit a momentary `waiting`; only fade out for a real stall. */
const BUFFER_GRACE_MS = 450;

/** Feathers every edge so the video's off-white canvas melts into the white page. */
const EDGE_FEATHER: React.CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 8%, #000 90%, transparent 100%)",
  WebkitMaskComposite: "source-in",
  maskImage:
    "linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 8%, #000 90%, transparent 100%)",
  maskComposite: "intersect",
};

function prefersLightData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  return Boolean(conn?.saveData) || /(^|-)2g$/.test(conn?.effectiveType ?? "");
}

function hasCachedCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${CACHED_COOKIE}=${VIDEO_VERSION}`);
}

function markCached() {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CACHED_COOKIE}=${VIDEO_VERSION}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

function cacheSupported(): boolean {
  return typeof window !== "undefined" && "caches" in window && window.isSecureContext;
}

async function readCachedVideo(): Promise<string | null> {
  if (!cacheSupported()) return null;
  try {
    const hit = await (await caches.open(CACHE_NAME)).match(VIDEO_SRC);
    if (!hit) return null;
    return URL.createObjectURL(await hit.blob());
  } catch {
    return null;
  }
}

/** Stores the full video (not a range slice) and drops older versions. */
async function storeVideo(): Promise<void> {
  if (!cacheSupported()) return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith("feezo-hero-") && k !== CACHE_NAME)
        .map((k) => caches.delete(k)),
    );
    const res = await fetch(VIDEO_SRC, { cache: "force-cache" });
    if (!res.ok || res.status !== 200) return;
    await (await caches.open(CACHE_NAME)).put(VIDEO_SRC, res);
    markCached();
  } catch {
    /* quota or network — the network copy keeps working */
  }
}

function whenIdle(fn: () => void): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout: 4000 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 1500);
  return () => window.clearTimeout(id);
}

/**
 * Hero product shot that loops the "explode" tour continuously. The video is
 * kept in Cache Storage (flagged by a cookie) so repeat visits start instantly
 * without re-downloading. Pauses off-screen / in background tabs, fades to the
 * still frame while buffering, and falls back to the poster for reduced motion,
 * data-saver connections, or playback errors.
 */
export function HeroShowcase({ alt, startDelayMs = 700 }: { alt: string; startDelayMs?: number }) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [enabled] = useState(() => !prefersLightData());
  const [returning] = useState(hasCachedCookie);
  const bufferTimer = useRef<number | undefined>(undefined);

  const clearBuffering = () => {
    window.clearTimeout(bufferTimer.current);
    bufferTimer.current = undefined;
    setBuffering(false);
  };

  useEffect(() => () => window.clearTimeout(bufferTimer.current), []);

  const canPlay = enabled && !reduce && !failed;

  // Resolve the source: cached blob if present, otherwise network + background caching.
  useEffect(() => {
    if (!canPlay) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    let cancelIdle: (() => void) | undefined;

    void readCachedVideo().then((cached) => {
      if (cancelled) {
        if (cached) URL.revokeObjectURL(cached);
        return;
      }
      if (cached) {
        objectUrl = cached;
        setSrc(cached);
        if (!returning) markCached();
        return;
      }
      setSrc(VIDEO_SRC);
      cancelIdle = whenIdle(() => void storeVideo());
    });

    return () => {
      cancelled = true;
      cancelIdle?.();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [canPlay, returning]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // First start honours the entrance delay (skipped for returning visitors).
  useEffect(() => {
    if (!canPlay || !ready || started) return;
    const timer = window.setTimeout(() => setStarted(true), returning ? 0 : startDelayMs);
    return () => window.clearTimeout(timer);
  }, [canPlay, ready, started, returning, startDelayMs]);

  // Play only while on-screen and the tab is visible; never burn CPU in the background.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !started) return;
    if (inView && pageVisible) {
      if (video.paused) void video.play().catch(() => setStarted(false));
    } else if (!video.paused) {
      video.pause();
    }
  }, [started, inView, pageVisible]);

  const showVideo = started && !buffering && !failed;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-video w-full max-w-[1040px]"
      style={EDGE_FEATHER}
    >
      <img
        src={POSTER_START}
        alt={alt}
        width={1280}
        height={720}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full select-none object-contain"
        draggable={false}
      />

      {canPlay && src ? (
        <motion.video
          ref={videoRef}
          src={src}
          poster={POSTER_START}
          muted
          loop
          playsInline
          autoPlay={false}
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          initial={false}
          animate={{ opacity: showVideo ? 1 : 0 }}
          transition={{ duration: showVideo ? 0.35 : 0.6, ease: easeOutExpo }}
          onLoadedData={() => setReady(true)}
          onCanPlay={() => {
            setReady(true);
            clearBuffering();
          }}
          onPlaying={clearBuffering}
          onSeeked={clearBuffering}
          onTimeUpdate={clearBuffering}
          onWaiting={() => {
            if (bufferTimer.current) return;
            bufferTimer.current = window.setTimeout(() => {
              bufferTimer.current = undefined;
              setBuffering(true);
            }, BUFFER_GRACE_MS);
          }}
          onError={() => {
            if (src !== VIDEO_SRC) {
              setSrc(VIDEO_SRC);
              return;
            }
            setFailed(true);
          }}
        />
      ) : null}
    </div>
  );
}
