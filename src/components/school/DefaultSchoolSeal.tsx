import { useId } from "react";

import { resolveMediaUrl } from "@/lib/media";
import { defaultSealSvg } from "@/lib/school-marks";
import { cn } from "@/lib/utils";

export function DefaultSchoolSeal({
  name,
  details,
  logoUrl,
  className,
}: {
  name: string;
  details?: string;
  logoUrl?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const svg = defaultSealSvg(name, undefined, {
    details,
    logoHref: resolveMediaUrl(logoUrl),
    id: uid,
  });

  return (
    <div
      className={cn("[&>svg]:block [&>svg]:h-full [&>svg]:w-full", className)}
      role="img"
      aria-label={`${name.trim() || "School"} official seal`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
