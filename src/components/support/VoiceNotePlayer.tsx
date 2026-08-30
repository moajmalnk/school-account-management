import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { formatSupportDuration } from "@/lib/api/support";
import { cn } from "@/lib/utils";

export function VoiceNotePlayer({
  src,
  durationMs,
  inverted = false,
}: {
  src: string;
  durationMs?: number | null;
  inverted?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [knownDuration, setKnownDuration] = useState(durationMs ?? 0);

  useEffect(() => {
    setElapsed(0);
    setPlaying(false);
    setKnownDuration(durationMs ?? 0);
  }, [src, durationMs]);

  const toggle = () => {
    const node = audioRef.current;
    if (!node) return;
    if (playing) {
      node.pause();
      setPlaying(false);
      return;
    }
    void node.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  };

  const ratio = knownDuration > 0 ? Math.min(1, elapsed / knownDuration) : playing ? 0.08 : 0;

  return (
    <div
      className={cn(
        "flex min-w-[168px] max-w-[240px] items-center gap-2 rounded-full px-1.5 py-1",
        inverted ? "bg-white/15" : "bg-black/[0.06] dark:bg-white/10",
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onEnded={() => {
          setPlaying(false);
          setElapsed(0);
        }}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime * 1000)}
        onLoadedMetadata={(e) => {
          const next = e.currentTarget.duration;
          if (Number.isFinite(next) && next > 0) setKnownDuration(next * 1000);
        }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
          inverted
            ? "bg-white text-[#0F766E] hover:bg-white/90"
            : "bg-[#0F766E] text-white hover:bg-[#0D9488]",
        )}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "h-1 overflow-hidden rounded-full",
            inverted ? "bg-white/25" : "bg-black/10 dark:bg-white/15",
          )}
        >
          <div
            className={cn("h-full rounded-full", inverted ? "bg-white" : "bg-[#0F766E]")}
            style={{ width: `${Math.max(6, ratio * 100)}%` }}
          />
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-[10px] tabular-nums",
          inverted ? "text-white/80" : "text-black/50 dark:text-zinc-400",
        )}
      >
        {formatSupportDuration(playing || elapsed > 0 ? elapsed : knownDuration)}
      </span>
    </div>
  );
}
