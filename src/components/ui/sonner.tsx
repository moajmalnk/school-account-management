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
            "group toast !flex !w-auto !min-w-0 !max-w-[min(420px,calc(100vw-2rem))] !items-center !gap-2.5 !rounded-full !border-0 !bg-[#1C1C1E] !px-4 !py-2.5 !text-[13px] !font-medium !text-white !shadow-[0_8px_28px_rgba(0,0,0,0.28)]",
          title: "!m-0 !text-[13px] !font-medium !leading-none !tracking-tight !text-white",
          description: "!hidden",
          actionButton:
            "!ml-1 !rounded-full !bg-white/15 !px-2.5 !py-1 !text-[11px] !font-semibold !text-white",
          cancelButton:
            "!ml-1 !rounded-full !bg-white/10 !px-2.5 !py-1 !text-[11px] !font-semibold !text-white/80",
          closeButton:
            "!static !right-auto !top-auto !ml-1 !size-5 !shrink-0 !translate-x-0 !translate-y-0 !rounded-full !border-0 !bg-transparent !text-white/70 hover:!bg-white/10 hover:!text-white",
          icon: "!m-0 !size-5 !shrink-0 [&_svg]:!size-3.5",
          success: "!bg-[#1C1C1E] [&_[data-icon]]:!text-[#22C55E]",
          error: "!bg-[#1C1C1E] [&_[data-icon]]:!text-[#F43F5E]",
          warning: "!bg-[#1C1C1E] [&_[data-icon]]:!text-[#F59E0B]",
          info: "!bg-[#1C1C1E] [&_[data-icon]]:!text-[#38BDF8]",
        },
      }}
      style={
        {
          "--width": "auto",
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
