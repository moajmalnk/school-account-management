import { useState } from "react";
import { Loader2, Smartphone, WalletCards } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ApiError } from "@/lib/api/client";
import {
  schoolConfirmFeePayLink,
  schoolCreateFeePayLink,
  type SchoolFeePayLink,
} from "@/lib/api/school-family";
import { checkoutReturnUrl, openCashfreeCheckout } from "@/lib/cashfree-checkout";
import { shareFeePayLinkWhatsApp } from "@/lib/fee-pay-link-share";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export type OnlineFeePaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  className?: string;
  guardian?: string;
  phone?: string | null;
  amount: number;
  academicYear: string;
  schoolName: string;
  feeSummary?: string;
  onPaid?: (receiptId: string, amount: number) => void;
};

export function OnlineFeePaymentDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  className,
  guardian,
  phone,
  amount,
  academicYear,
  schoolName,
  feeSummary,
  onPaid,
}: OnlineFeePaymentDialogProps) {
  const [busy, setBusy] = useState<"whatsapp" | "counter" | null>(null);
  const [link, setLink] = useState<SchoolFeePayLink | null>(null);

  const ensureLink = async () => {
    if (link && link.amount === amount) return link;
    const created = await schoolCreateFeePayLink({
      studentId,
      amount,
      academicYear,
      phone: phone ?? undefined,
      name: guardian || studentName,
    });
    setLink(created);
    return created;
  };

  const shareWhatsApp = async () => {
    if (busy) return;
    setBusy("whatsapp");
    try {
      const result = await shareFeePayLinkWhatsApp({
        studentId,
        studentName,
        className,
        guardian,
        phone,
        schoolName,
        academicYear,
        lines: [{ label: feeSummary?.trim() || "School fees", balance: amount }],
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setLink((prev) =>
        prev
          ? { ...prev, amount: result.amount, shareUrl: result.shareUrl }
          : prev,
      );
      toast.success(
        result.via === "whatsapp" ? "Opening WhatsApp payment link" : "Payment message copied",
        { description: "Parent can pay with the secure Cashfree link" },
      );
    } finally {
      setBusy(null);
    }
  };

  const collectAtCounter = async () => {
    if (busy) return;
    setBusy("counter");
    try {
      const created = await ensureLink();
      const outcome = await openCashfreeCheckout(
        created.paymentSessionId,
        checkoutReturnUrl("/tenant/finance", created.orderId),
      );
      if (outcome === "closed") {
        toast.message("Checkout closed", { description: "No payment was recorded" });
        return;
      }
      if (outcome === "redirect") {
        toast.message("Finish payment in the bank / UPI app", {
          description: "Receipt appears here after Cashfree confirms",
        });
        return;
      }
      const confirmed = await schoolConfirmFeePayLink(created.orderId);
      toast.success(`Receipt ${confirmed.receiptId}`, {
        description: `${formatMoney(confirmed.amount)} received online`,
      });
      onPaid?.(confirmed.receiptId, confirmed.amount);
      onOpenChange(false);
      setLink(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Online collection failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
        if (!next) setLink(null);
      }}
    >
      <DialogContent className="max-w-md rounded-2xl border border-[#E5E5E5] p-0 sm:rounded-2xl">
        <DialogHeader className="space-y-1 border-b border-[#EFEFEF] px-5 py-4 text-left">
          <DialogTitle className="text-[16px] font-semibold text-black">Online fee payment</DialogTitle>
          <DialogDescription className="text-[12.5px] text-black/55">
            {studentName}
            {className ? ` · ${className}` : ""} · parent pays by UPI / card. Receipt is saved only
            after Cashfree confirms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
              Amount to collect
            </div>
            <div className="mt-1 font-mono text-[22px] font-semibold text-[#0F766E]">
              {formatMoney(amount)}
            </div>
            {feeSummary ? (
              <div className="mt-1 text-[12px] text-black/55">{feeSummary}</div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void shareWhatsApp()}
              className={cn(
                "h-12 justify-start gap-3 rounded-xl bg-[#25D366] px-4 text-[13.5px] font-semibold text-white hover:bg-[#1EBE57]",
              )}
            >
              {busy === "whatsapp" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WhatsAppIcon className="h-4 w-4" />
              )}
              <span className="flex flex-col items-start leading-tight">
                <span>Share payment link on WhatsApp</span>
                <span className="text-[11px] font-normal text-white/85">
                  Uses Settings → WhatsApp · Online payment link
                </span>
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() => void collectAtCounter()}
              className="h-12 justify-start gap-3 rounded-xl border-[#E5E5E5] px-4 text-[13.5px] font-semibold"
            >
              {busy === "counter" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WalletCards className="h-4 w-4 text-[#0F766E]" />
              )}
              <span className="flex flex-col items-start leading-tight">
                <span>Collect at counter</span>
                <span className="text-[11px] font-normal text-black/50">
                  Open Cashfree popup on this device
                </span>
              </span>
            </Button>
          </div>

          <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-black/45">
            <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Turn on Parent Pay now in Settings if checkout is unavailable. Guardian mobile must be
            on the student profile.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
