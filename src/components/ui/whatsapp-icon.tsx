import { cn } from "@/lib/utils";

/** Official-style WhatsApp glyph for share / message actions. */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 2c-5.46 0-9.91 4.43-9.91 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.9-4.44 9.9-9.9C21.94 6.43 17.5 2 12.04 2zm5.79 14.15c-.24.68-1.4 1.25-1.94 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.83-4.2-4.98-4.39-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.24-.27.64-.39 1.02-.39.12 0 .23 0 .33.01.29.01.44.03.63.49.24.55.82 2 .89 2.15.07.14.12.31.02.5-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.7 1.16 1.5 1.88 1.04.93 1.91 1.22 2.18 1.36.27.14.43.12.59-.07.16-.2.69-.8.87-1.08.18-.27.37-.23.62-.14.25.09 1.6.76 1.87.89.27.14.45.2.52.32.07.12.07.68-.17 1.36z"
      />
    </svg>
  );
}

/** Compact circular WhatsApp action chip used in tables / toolbars. */
export const whatsappIconBtnClass =
  "inline-grid h-8 w-8 place-items-center rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-[#128C7E] transition-colors hover:border-[#25D366]/60 hover:bg-[#25D366]/18 dark:border-[#25D366]/35 dark:bg-[#25D366]/12 dark:text-[#4ADE80] dark:hover:bg-[#25D366]/22";

export const whatsappTextBtnClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-2.5 text-[11px] font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/18 dark:border-[#25D366]/35 dark:bg-[#25D366]/12 dark:text-[#4ADE80] dark:hover:bg-[#25D366]/22";
