import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { staffCollectAbsoluteUrl } from "@/lib/tenant-store";
import { openWhatsAppShare, toNotifyWhatsAppNumber } from "@/lib/whatsapp-notify";

export function ShareStaffCollectDialog({
  open,
  onOpenChange,
  token,
  staffName,
  schoolName,
  staffPhone,
  missing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  staffName: string;
  schoolName: string;
  staffPhone?: string;
  missing: string[];
}) {
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(staffPhone ?? "");
  const url = token ? staffCollectAbsoluteUrl(token) : "";
  const school = schoolName.trim() || "the school";
  const firstName = staffName.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }
    setPhone(staffPhone ?? "");
  }, [open, staffPhone]);

  const whatsappNumber = useMemo(() => toNotifyWhatsAppNumber(phone), [phone]);

  const shareMessage = useMemo(() => {
    return [
      `Hello ${firstName},`,
      "",
      `${school} needs your personal details for the staff record. Your name, employee ID, role, and department are already filled and stay locked.`,
      "",
      "Use this private link. It closes after one submission:",
      url,
      "",
      "You can update your photo, mobile number, email, address, date of birth, blood group, and emergency contact. Salary and documents are not part of this form.",
    ].join("\n");
  }, [firstName, school, url]);

  const copyLink = async () => {
    if (!url || copied) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Collection link copied", {
        description: `Send it to ${staffName} to complete their personal details`,
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link. Select it and copy manually.");
    }
  };

  const shareOnWhatsApp = () => {
    if (!url) return;
    if (!whatsappNumber) {
      toast.error("Add a WhatsApp number", {
        description: "Enter the staff member's mobile number with country code",
      });
      return;
    }
    if (openWhatsAppShare(shareMessage, phone)) {
      toast.success("Opening WhatsApp", {
        description: `Message drafted for ${staffName}`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#0F766E]" />
            Collect staff details
          </DialogTitle>
          <DialogDescription>
            Send {staffName} a private one-time link. They confirm personal details. Employment
            fields stay locked, and salary is never included.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {missing.length > 0 ? (
            <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-2.5 dark:border-teal-500/30 dark:bg-teal-950/40">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0F766E] dark:text-teal-200">
                Still missing
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600 dark:text-zinc-300">
                {missing.join(" · ")}
              </p>
            </div>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              Personal details are already on file. Send the link only if {firstName} needs to
              correct something.
            </p>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Staff collection link
            </label>
            <div className="flex gap-2">
              <Input readOnly value={url} className="font-mono text-[12px]" />
              <Button type="button" onClick={() => void copyLink()} className="shrink-0 rounded-full">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Staff WhatsApp number
            </label>
            <PhoneInput value={phone} onChange={setPhone} />
            <p className="text-[11px] text-black/45 dark:text-zinc-500">
              Opens WhatsApp with the collection message ready for {staffName}.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
          <Button
            type="button"
            onClick={shareOnWhatsApp}
            className="rounded-full bg-[#25D366] text-white hover:bg-[#1EBE57]"
          >
            <WhatsAppIcon className="mr-1.5 h-4 w-4" />
            WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
