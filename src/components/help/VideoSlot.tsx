import { useEffect, useState } from "react";
import { Play, Video } from "lucide-react";

import { cn } from "@/lib/utils";

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function VideoSlot({ videoId, title }: { videoId?: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const validId = videoId && YOUTUBE_ID_RE.test(videoId) ? videoId : undefined;

  useEffect(() => {
    setPlaying(false);
  }, [validId]);

  if (!validId) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300/80 bg-slate-50/70 px-4 py-3 text-[12px] text-slate-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-400">
        <Video className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <span>Video coming soon. Follow the steps below; they cover everything.</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${validId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Play video: ${title}`}
        >
          <img
            src={`https://i.ytimg.com/vi/${validId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span
            className={cn(
              "absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full",
              "bg-[#0F766E] text-white shadow-lg shadow-black/30 transition-transform group-hover:scale-105",
            )}
          >
            <Play className="ml-0.5 h-6 w-6 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
