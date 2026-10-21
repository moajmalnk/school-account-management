import { useEffect, useState } from "react";

import { edgeFitImage, type EdgeFittedImage } from "@/lib/edge-fit-image";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * School mark that fills its rounded frame.
 * Light letterbox margins from the logo cropper are trimmed before paint.
 */
export function SchoolLogo({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const resolved = resolveMediaUrl(src) ?? src;
  const [fitted, setFitted] = useState<EdgeFittedImage | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFitted(null);
    void edgeFitImage(src).then((next) => {
      if (!cancelled) setFitted(next);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const shown = fitted?.src ?? resolved;
  const cover = fitted?.cover !== false;

  return (
    <img
      src={shown}
      alt={alt}
      className={cn("h-full w-full", cover ? "object-cover" : "object-contain", className)}
    />
  );
}
