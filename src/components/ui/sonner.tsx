import { Toaster as Sonner } from "sonner";

/**
 * Feezo toast — calm finance-grade notifications.
 * Light surface, teal status accents, 12px radius (matches product cards).
 */
const Toaster = ({ ...props }: React.ComponentProps<typeof Sonner>) => {
  return (
    <Sonner
      className="toaster group"
      theme="light"
      position="top-right"
      closeButton
      richColors={false}
      expand={false}
      offset={{ top: "max(16px, env(safe-area-inset-top))", right: 16 }}
      gap={10}
      visibleToasts={3}
      duration={3600}
      toastOptions={{
        classNames: {
          toast:
            "group toast feezo-toast !flex !w-[min(380px,calc(100vw-2rem))] !min-w-0 !flex-row !items-start !gap-3 !rounded-xl !border !border-slate-200/90 !bg-white !px-3.5 !py-3 !text-[13px] !font-medium !text-slate-900 !shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18),0_2px_8px_-2px_rgba(15,23,42,0.06)] !ml-auto dark:!border-white/10 dark:!bg-[#171717] dark:!text-zinc-50 dark:!shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)]",
          title:
            "feezo-toast-title !m-0 !min-w-0 !flex-1 !text-[13px] !font-semibold !leading-snug !tracking-[-0.01em] !text-slate-900 dark:!text-zinc-50",
          description:
            "!mt-0.5 !whitespace-normal !text-[12px] !font-normal !leading-relaxed !text-slate-500 dark:!text-zinc-400",
          actionButton:
            "!order-3 !ml-auto !shrink-0 !whitespace-nowrap !rounded-lg !bg-[#0F766E] !px-3 !py-1.5 !text-[11px] !font-semibold !text-white hover:!bg-[#0D9488]",
          cancelButton:
            "!order-3 !ml-1 !shrink-0 !rounded-lg !bg-slate-100 !px-2.5 !py-1.5 !text-[11px] !font-semibold !text-slate-600 hover:!bg-slate-200 dark:!bg-white/10 dark:!text-zinc-300",
          closeButton:
            "feezo-toast-close !order-4 !static !ml-0.5 !mt-0.5 !size-6 !shrink-0 !translate-x-0 !translate-y-0 !rounded-md !border-0 !bg-transparent !text-slate-400 hover:!bg-slate-100 hover:!text-slate-700 dark:!text-zinc-500 dark:hover:!bg-white/10 dark:hover:!text-zinc-200",
          icon: "!order-1 !m-0 !mt-0.5 !size-5 !shrink-0 [&_svg]:!size-3.5",
          success: "[&_[data-icon]]:!text-[#0F766E]",
          error: "[&_[data-icon]]:!text-[#E11D48]",
          warning: "[&_[data-icon]]:!text-[#D97706]",
          info: "[&_[data-icon]]:!text-[#0284C7]",
        },
      }}
      style={
        {
          "--width": "380px",
          "--border-radius": "12px",
          "--normal-bg": "#ffffff",
          "--normal-border": "rgba(226, 232, 240, 0.95)",
          "--normal-text": "#0f172a",
          "--success-bg": "#ffffff",
          "--success-border": "rgba(226, 232, 240, 0.95)",
          "--success-text": "#0f172a",
          "--error-bg": "#ffffff",
          "--error-border": "rgba(226, 232, 240, 0.95)",
          "--error-text": "#0f172a",
          "--warning-bg": "#ffffff",
          "--warning-border": "rgba(226, 232, 240, 0.95)",
          "--warning-text": "#0f172a",
          "--info-bg": "#ffffff",
          "--info-border": "rgba(226, 232, 240, 0.95)",
          "--info-text": "#0f172a",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
