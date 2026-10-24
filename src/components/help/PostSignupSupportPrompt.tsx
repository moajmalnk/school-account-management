import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import {
  markPostSignupSupportDone,
  shouldShowPostSignupSupport,
} from "@/lib/post-signup-support";

const WAIT_MS = 10_000;
const AUTO_REDIRECT_MS = 2_500;

/**
 * New trial accounts only: after signup, wait 10s on the dashboard, show Support,
 * then open /tenant/support. Existing / returning logins never see this.
 */
export function PostSignupSupportPrompt() {
  const navigate = useNavigate();
  const { session, hydrated } = useAuth();
  const [open, setOpen] = useState(false);
  const redirected = useRef(false);
  const tenantId = session?.tenantId;

  const goToSupport = useCallback(() => {
    if (redirected.current) return;
    redirected.current = true;
    markPostSignupSupportDone(tenantId);
    setOpen(false);
    void navigate({ to: "/tenant/support" });
  }, [navigate, tenantId]);

  const dismiss = useCallback(() => {
    markPostSignupSupportDone(tenantId);
    setOpen(false);
  }, [tenantId]);

  useEffect(() => {
    if (!hydrated || !session) return;
    // Signup creates school_admin — never prompt staff/super_admin or stale sessions.
    if (session.role !== "school_admin") return;
    if (!shouldShowPostSignupSupport(session.tenantId)) return;

    const wait = window.setTimeout(() => setOpen(true), WAIT_MS);
    return () => window.clearTimeout(wait);
  }, [hydrated, session]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(goToSupport, AUTO_REDIRECT_MS);
    return () => window.clearTimeout(t);
  }, [open, goToSupport]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[400px] gap-0 overflow-hidden rounded-2xl border-[#E8EAED] p-0 sm:rounded-2xl"
      >
        <div className="bg-gradient-to-br from-[#F0FDFA] to-white px-6 pb-5 pt-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F766E] text-white shadow-[0_10px_24px_-12px_rgba(15,118,110,0.65)]">
            <LifeBuoy className="h-5 w-5" aria-hidden />
          </div>
          <DialogHeader className="mt-4 space-y-1.5 text-left">
            <DialogTitle className="text-[18px] font-semibold tracking-tight text-[#0B1220]">
              Need a hand setting up?
            </DialogTitle>
            <DialogDescription className="text-[13.5px] leading-relaxed text-black/55">
              Support has step-by-step guides for fees, students, staff, and more. Opening it for
              you now.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-[#F0F1F3] bg-white px-6 py-4 sm:flex-col sm:space-x-0">
          <button
            type="button"
            onClick={goToSupport}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#0D9488]"
          >
            Open Support
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="h-10 w-full rounded-xl text-[13px] font-medium text-black/50 transition-colors hover:bg-black/[0.03] hover:text-black/70"
          >
            Stay on dashboard
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
