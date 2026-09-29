import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Play, RotateCcw } from "lucide-react";

import { easeOutExpo } from "@/components/marketing/motion";

const VIDEO_SRC = "/explode_video.mp4";
const POSTER_START = "/home/explode-start.jpg";

/** Feathers every edge so the video's off-white canvas melts into the white page. */
const EDGE_FEATHER: React.CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 8%, #000 90%, transparent 100%)",
  WebkitMaskComposite: "source-in",
  maskImage:
    "linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 8%, #000 90%, transparent 100%)",
  maskComposite: "intersect",
};

type Phase = "poster" | "playing" | "ended";

function prefersLightData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  return Boolean(conn?.saveData) || /(^|-)2g$/.test(conn?.effectiveType ?? "");
}

/**
 * Hero product shot that "explodes" into the live dashboard modules on entry,
 * then settles back on the still frame. Falls back to the poster for reduced
 * motion, data-saver connections, or if the video cannot play.
 */
export function HeroShowcase({ alt, startDelayMs = 700 }: { alt: string; startDelayMs?: number }) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("poster");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const [autoplay] = useState(() => !prefersLightData());

  const canAutoplay = autoplay && !reduce && !failed;

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    video.currentTime = 0;
    void video.play().then(
      () => setPhase("playing"),
      () => setPhase("poster"),
    );
  }, [failed]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!canAutoplay || !ready || phase !== "poster") return;
    const timer = window.setTimeout(play, startDelayMs);
    return () => window.clearTimeout(timer);
    // Autoplay once per visit; replays are user-initiated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAutoplay, ready]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== "playing") return;
    const visible = inView && document.visibilityState === "visible";
    if (visible && video.paused) void video.play().catch(() => undefined);
    if (!visible && !video.paused) video.pause();
  }, [inView, phase]);

  useEffect(() => {
    const onVisibility = () => {
      const video = videoRef.current;
      if (!video || phase !== "playing") return;
      if (document.visibilityState === "hidden") video.pause();
      else if (inView) void video.play().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [inView, phase]);

  const showVideo = phase === "playing";
  const showReplay = !failed && (phase === "ended" || (!canAutoplay && ready));

  return (
    <div
      ref={containerRef}
      className="group relative mx-auto aspect-video w-full max-w-[1040px]"
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

      {!failed ? (
        <motion.video
          ref={videoRef}
          src={VIDEO_SRC}
          poster={POSTER_START}
          muted
          playsInline
          preload={autoplay && !reduce ? "auto" : "metadata"}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          initial={false}
          animate={{ opacity: showVideo ? 1 : 0 }}
          transition={{ duration: showVideo ? 0.25 : 0.9, ease: easeOutExpo }}
          onCanPlayThrough={() => setReady(true)}
          onLoadedData={() => setReady(true)}
          onEnded={() => setPhase("ended")}
          onError={() => setFailed(true)}
        />
      ) : null}

      <AnimatePresence>
        {showReplay ? (
          <motion.button
            key="replay"
            type="button"
            onClick={play}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.35, ease: easeOutExpo, delay: phase === "ended" ? 0.6 : 0 }}
            className="absolute bottom-[9%] right-[8%] inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-[var(--mkt-ink)] shadow-[0_6px_20px_rgba(15,23,42,0.08)] backdrop-blur-md transition-transform hover:-translate-y-0.5 hover:border-[var(--mkt-green)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-green)]/50"
            aria-label={phase === "ended" ? "Replay product tour" : "Play product tour"}
          >
            {phase === "ended" ? (
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden />
            )}
            {phase === "ended" ? "Replay" : "Watch"}
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
