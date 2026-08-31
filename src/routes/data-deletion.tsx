import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LegalSection, LegalShell } from "@/components/legal/LegalShell";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { apiRequestDataDeletion } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/data-deletion")({
  component: DataDeletionPage,
});

function DataDeletionPage() {
  const { session } = useAuth();
  const supportEmail = BRAND.legal.supportEmail;

  useEffect(() => {
    document.title = `Account & data deletion · ${BRAND.name}`;
    return () => {
      document.title = BRAND.name;
    };
  }, []);

  const [fullName, setFullName] = useState(session?.displayName ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [schoolName, setSchoolName] = useState(session?.tenantName ?? "");
  const [details, setDetails] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    confirm?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!fullName.trim()) errs.fullName = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email address";
    }
    if (!confirm) errs.confirm = "Confirm that you want to request deletion";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await apiRequestDataDeletion({
        fullName: fullName.trim(),
        email: email.trim(),
        schoolName: schoolName.trim() || undefined,
        details: details.trim() || undefined,
      });
      setSubmitted(true);
      toast.success("Deletion request submitted");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Unable to submit request. Email support or try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LegalShell
      title="Account & data deletion"
      subtitle={`Use this page to request deletion of your ${BRAND.name} login and associated personal data. Required for App Store and Google Play account deletion.`}
    >
      <LegalSection title="What you can request">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Your login account:</strong> email, display name, password hash, permissions,
            and device sessions tied to your user.
          </li>
          <li>
            <strong>Support history:</strong> tickets and messages you opened with platform support,
            where feasible.
          </li>
        </ul>
        <p>
          <strong>School-controlled records</strong> (students, fees, staff profiles created by your
          School, finance ledgers, etc.) belong to the School workspace. Those are deleted or
          anonymised only when the School admin requests it, or when the School’s entire workspace
          is closed — not automatically when a single staff login is removed.
        </p>
      </LegalSection>

      <LegalSection title="How deletion works">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Submit the form below (or email {supportEmail}).</li>
          <li>We verify you control the email / account named in the request.</li>
          <li>
            We delete or anonymise eligible personal data, usually within <strong>30 days</strong>.
          </li>
          <li>
            We email you when the request is completed, or if we need more information (for example
            School-owner accounts that must transfer ownership first).
          </li>
        </ol>
        <p>
          Read our{" "}
          <a href="/privacy" className="font-medium text-[#0F766E] hover:underline">
            Privacy Policy
          </a>{" "}
          for full details on retention and School-controlled data.
        </p>
      </LegalSection>

      {submitted ? (
        <div className="flex items-start gap-2 rounded-2xl border border-[#0F766E]/20 bg-[#CCFBF1]/40 px-3 py-3 text-[13px] text-black/75">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
          <div>
            <p className="font-medium text-black">Request received</p>
            <p className="mt-1">
              If an account exists for <span className="font-medium">{email.trim()}</span>, we will
              process your deletion request and contact you at that address. You can also reach us
              at{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="font-medium text-[#0F766E] hover:underline"
              >
                {supportEmail}
              </a>
              .
            </p>
            <a
              href="/login"
              className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-[#0F766E] px-4 text-[13px] font-semibold text-white hover:bg-[#0D9488]"
            >
              Back to sign in
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex items-start gap-2 rounded-2xl border border-black/8 bg-[#F4F6F9] px-3 py-2.5 text-[12px] text-black/60">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Store listing URL:{" "}
              <span className="font-mono text-[11px] text-black/75">
                {BRAND.legal.dataDeletionUrl}
              </span>
            </span>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="deletion-name"
              className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
            >
              Full name
            </Label>
            <input
              id="deletion-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors((f) => ({ ...f, fullName: undefined }));
              }}
              className={`h-12 w-full rounded-2xl border bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${
                fieldErrors.fullName ? "border-[#EF4444]/40" : "border-[#E5E5E5]"
              }`}
              placeholder="Your name"
            />
            {fieldErrors.fullName ? (
              <div className="text-[11px] text-[#EF4444]">{fieldErrors.fullName}</div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="deletion-email"
              className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
            >
              Account email
            </Label>
            <input
              id="deletion-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
              }}
              className={`h-12 w-full rounded-2xl border bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${
                fieldErrors.email ? "border-[#EF4444]/40" : "border-[#E5E5E5]"
              }`}
              placeholder="you@school.com"
            />
            {fieldErrors.email ? (
              <div className="text-[11px] text-[#EF4444]">{fieldErrors.email}</div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="deletion-school"
              className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
            >
              School / organisation (optional)
            </Label>
            <input
              id="deletion-school"
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="h-12 w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5"
              placeholder="School name or subdomain"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="deletion-details"
              className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
            >
              Additional details (optional)
            </Label>
            <textarea
              id="deletion-details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full resize-y rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5"
              placeholder="Anything that helps us find your account"
            />
          </div>

          <label className="flex items-start gap-2.5 text-[13px] text-black/70">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => {
                setConfirm(e.target.checked);
                if (fieldErrors.confirm) setFieldErrors((f) => ({ ...f, confirm: undefined }));
              }}
              className="mt-1 h-4 w-4 rounded border-[#E5E5E5]"
            />
            <span>
              I request deletion of my {BRAND.name} account and associated personal data, and I
              understand School-owned student/finance records may remain until the School removes
              them.
            </span>
          </label>
          {fieldErrors.confirm ? (
            <div className="text-[11px] text-[#EF4444]">{fieldErrors.confirm}</div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F766E] text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(15,118,110,0.4)] transition-colors hover:bg-[#0D9488] disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit deletion request"}
          </button>

          <p className="text-center text-[12px] text-black/45">
            Prefer email?{" "}
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(`${BRAND.name} account deletion request`)}`}
              className="font-medium text-[#0F766E] hover:underline"
            >
              {supportEmail}
            </a>
          </p>
        </form>
      )}
    </LegalShell>
  );
}
