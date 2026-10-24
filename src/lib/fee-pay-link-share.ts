import { ApiError } from "@/lib/api/client";
import { schoolCreateFeePayLink } from "@/lib/api/school-family";
import { formatMoney } from "@/lib/money";
import { openWhatsAppShare } from "@/lib/whatsapp-notify";
import { buildOnlinePaymentLinkWhatsApp } from "@/lib/whatsapp-messages";

export type FeePayLinkLine = {
  label: string;
  balance: number;
};

export type ShareFeePayLinkInput = {
  studentId: string;
  studentName: string;
  className?: string;
  guardian?: string;
  phone?: string | null;
  schoolName: string;
  academicYear: string;
  lines: FeePayLinkLine[];
};

export type ShareFeePayLinkResult =
  | { ok: true; amount: number; via: "whatsapp" | "copied"; shareUrl: string }
  | { ok: false; message: string };

/** Create a Cashfree fee link for the open balances and open WhatsApp with the Online payment template. */
export async function shareFeePayLinkWhatsApp(
  input: ShareFeePayLinkInput,
): Promise<ShareFeePayLinkResult> {
  const lines = input.lines.filter((line) => line.balance > 0);
  if (lines.length === 0) {
    return { ok: false, message: "No open balance to share a payment link for." };
  }
  const amount = lines.reduce((sum, line) => sum + line.balance, 0);
  if (amount < 1) {
    return { ok: false, message: "Amount must be at least ₹1." };
  }

  const feeSummary =
    lines.length === 1
      ? `${lines[0].label} · ${formatMoney(lines[0].balance)}`
      : lines
          .slice(0, 6)
          .map((line) => `• ${line.label}: ${formatMoney(line.balance)}`)
          .join("\n") + (lines.length > 6 ? `\n• +${lines.length - 6} more` : "");

  try {
    const created = await schoolCreateFeePayLink({
      studentId: input.studentId,
      amount,
      academicYear: input.academicYear,
      phone: input.phone ?? undefined,
      name: input.guardian || input.studentName,
    });
    const text = buildOnlinePaymentLinkWhatsApp({
      school: input.schoolName,
      guardian: input.guardian,
      studentName: input.studentName,
      className: input.className,
      studentId: input.studentId,
      amount: created.amount,
      paymentLink: created.shareUrl,
      feeSummary,
      academicYear: input.academicYear,
    });
    if (openWhatsAppShare(text, input.phone)) {
      return { ok: true, amount: created.amount, via: "whatsapp", shareUrl: created.shareUrl };
    }
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, amount: created.amount, via: "copied", shareUrl: created.shareUrl };
    } catch {
      return {
        ok: false,
        message: "Could not open WhatsApp. Allow pop-ups or copy the link manually.",
      };
    }
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof ApiError
          ? err.message
          : "Could not create payment link. Check Parent Pay and guardian mobile.",
    };
  }
}
