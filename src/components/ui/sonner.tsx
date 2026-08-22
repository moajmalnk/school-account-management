import { Toaster as Sonner } from "sonner";

/**
 * Compact Hostinger-style toast: dark pill, bottom-center, short message.
 */
const Toaster = ({ ...props }: React.ComponentProps<typeof Sonner>) => {
  return (
    <Sonner
      className="toaster group"
      theme="dark"
      position="bottom-center"
      closeButton
      richColors={false}
      expand={false}
      offset={24}
      gap={8}
      visibleToasts={3}
      duration={3200}
      toastOptions={{
        classNames: {
          toast:
            "group toast sa-toast !flex !w-fit !min-w-[280px] !max-w-[min(420px,calc(100vw-2rem))] !flex-row !items-center !gap-2.5 !rounded-full !border-0 !bg-[#1C1C1E] !px-4 !py-2.5 !text-[13px] !font-medium !text-white !shadow-[0_8px_28px_rgba(0,0,0,0.28)] has-[[data-button]]:!max-w-[min(480px,calc(100vw-2rem))] has-[[data-button]]:!rounded-2xl has-[[data-button]]:!px-3.5 has-[[data-button]]:!py-3",
          title:
            "sa-toast-title !m-0 !min-w-0 !flex-1 !text-[13px] !font-medium !leading-snug !tracking-tight !text-white group-has-[[data-button]]:!whitespace-nowrap group-has-[[data-button]]:!overflow-hidden group-has-[[data-button]]:!text-ellipsis",
          description:
            "!hidden group-has-[[data-button]]:!block !mt-0.5 !truncate !text-[11px] !font-normal !leading-tight !text-white/70",
          actionButton:
            "!order-3 !ml-1 !shrink-0 !whitespace-nowrap !rounded-full !bg-white/15 !px-3 !py-1.5 !text-[11px] !font-semibold !text-white hover:!bg-white/25",
          cancelButton:
            "!order-3 !ml-1 !shrink-0 !rounded-full !bg-white/10 !px-2.5 !py-1 !text-[11px] !font-semibold !text-white/80",
          closeButton:
            "sa-toast-close !order-4 !static !ml-1 !size-5 !shrink-0 !translate-x-0 !translate-y-0 !rounded-full !border-0 !bg-transparent !text-white/70 hover:!bg-white/10 hover:!text-white",
          icon: "!order-1 !m-0 !size-5 !shrink-0 [&_svg]:!size-3.5",
          success: "!bg-[#1C1C1E] [&_[data-icon]]:!text-[#22C55E]",
          error: "!bg-[#1C1C1E] [&_[data-icon]]:!text-[#F43F5E]",
          warning: "!bg-[#1C1C1E] [&_[data-icon]]:!text-[#F59E0B]",
          info: "!bg-[#1C1C1E] [&_[data-icon]]:!text-[#38BDF8]",
        },
      }}
      style={
        {
          "--width": "360px",
          "--border-radius": "9999px",
          "--normal-bg": "#1C1C1E",
          "--normal-border": "transparent",
          "--normal-text": "#ffffff",
          "--success-bg": "#1C1C1E",
          "--success-border": "transparent",
          "--success-text": "#ffffff",
          "--error-bg": "#1C1C1E",
          "--error-border": "transparent",
          "--error-text": "#ffffff",
          "--warning-bg": "#1C1C1E",
          "--warning-border": "transparent",
          "--warning-text": "#ffffff",
          "--info-bg": "#1C1C1E",
          "--info-border": "transparent",
          "--info-text": "#ffffff",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
