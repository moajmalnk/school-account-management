import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

function personInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

type ProfileAvatarProps = {
  name: string;
  photoUrl?: string | null;
  className?: string;
  imgClassName?: string;
  initialsClassName?: string;
  alt?: string;
  /** Soft loading veil (e.g. while uploading). */
  busy?: boolean;
};

/**
 * Renders a profile photo, falling back to initials when the URL is missing
 * or fails to load (truncated data-URLs, 403 /uploads, etc.).
 */
export function ProfileAvatar({
  name,
  photoUrl,
  className,
  imgClassName,
  initialsClassName,
  alt,
  busy = false,
}: ProfileAvatarProps) {
  const resolved = resolveMediaUrl(photoUrl);
  const [failed, setFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // New URL → clear prior load failure (fixes “only after refresh”).
  useEffect(() => {
    setFailed(false);
    setImgLoaded(false);
  }, [resolved]);

  const showImg = Boolean(resolved) && !failed;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {showImg ? (
        <img
          key={resolved}
          src={resolved}
          alt={alt ?? ""}
          className={cn("h-full w-full", imgClassName, !imgLoaded && "opacity-0")}
          onLoad={() => setImgLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={cn(
            "grid h-full w-full place-items-center font-semibold text-white",
            initialsClassName,
          )}
        >
          {personInitials(name)}
        </div>
      )}

      {(busy || (showImg && !imgLoaded)) && (
        <div className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[1px]">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
