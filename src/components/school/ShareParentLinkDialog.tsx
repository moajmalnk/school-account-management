import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";

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
import { parentStudentAbsoluteUrl } from "@/lib/tenant-store";

function digitsOnly(raw?: string) {
  return (raw ?? "").replace(/\D/g, "");
}

function toWhatsAppNumber(raw?: string) {
  const digits = digitsOnly(raw);
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length >= 10) return digits;
  return null;
}

export function ShareParentLinkDialog({
  open,
  onOpenChange,
  token,
  studentName,
  guardianPhone,
  guardianName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  studentName: string;
  guardianPhone?: string;
  guardianName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(guardianPhone ?? "");
  const url = token ? parentStudentAbsoluteUrl(token) : "";

  useEffect(() => {
    if (open) setPhone(guardianPhone ?? "");
  }, [open, guardianPhone]);

  const whatsappNumber = useMemo(() => toWhatsAppNumber(phone), [phone]);

  const shareMessage = useMemo(() => {
    const greeting = guardianName?.trim() ? `Hi ${guardianName.trim()},` : "Hi,";
    return [
      greeting,
      "",
      `Please complete ${studentName}'s profile for Silver Hills Global using this private link:`,
      url,
      "",
      "School-filled details are locked. You can update photo, gender, DOB, email, address, phone, guardian details, and bus points.",
    ].join("\n");
  }, [guardianName, studentName, url]);

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Parent link copied", {
        description: "Send it to the guardian to complete the profile",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link · select and copy manually");
    }
  };

  const shareOnWhatsApp = () => {
    if (!url) return;
    if (!whatsappNumber) {
      toast.error("Add guardian WhatsApp number", {
        description: "Enter a 10-digit mobile number to open WhatsApp",
      });
      return;
    }
    const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(shareMessage)}`;
    window.open(href, "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp", {
      description: guardianName?.trim()
        ? `Message drafted for ${guardianName.trim()}`
        : "Parent link attached to the message",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-[#2563EB]" />
            Share with parent
          </DialogTitle>
          <DialogDescription>
            Send this private link so the guardian can complete {studentName}&apos;s profile.
            School-filled details stay read-only; parents can update photo, gender, DOB, email,
            address, phone, and guardian name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Public parent link
            </label>
            <div className="flex gap-2">
              <Input readOnly value={url} className="font-mono text-[12px]" />
              <Button type="button" onClick={copyLink} className="shrink-0 rounded-full">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Guardian WhatsApp number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, ""))}
              placeholder="e.g. 9810045221"
              className="font-mono text-[13px]"
              inputMode="tel"
            />
            <p className="text-[11px] text-black/45">
              Opens WhatsApp with the parent link ready to send
              {guardianName?.trim() ? ` to ${guardianName.trim()}` : ""}.
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
            <MessageCircle className="mr-1.5 h-4 w-4" />
            WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
