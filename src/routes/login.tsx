import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, ShieldCheck, Building2, AlertCircle, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { OrganicCard } from "@/components/ui/organic-card";
import { INVALID_CREDENTIALS_MESSAGE, MOCK_CREDENTIALS, useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type TierMeta = {
  key: Role;
  label: string;
  icon: typeof ShieldCheck;
  placeholderEmail: string;
};

const TIERS: TierMeta[] = [
  {
    key: "super_admin",
    label: "Super Admin",
    icon: ShieldCheck,
    placeholderEmail: MOCK_CREDENTIALS.super_admin.email,
  },
  {
    key: "school_admin",
    label: "School Admin",
    icon: Building2,
    placeholderEmail: MOCK_CREDENTIALS.school_admin.email,
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const { session, hydrated, login } = useAuth();
  const [tier, setTier] = useState<Role>("super_admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && session) {
      const dest = MOCK_CREDENTIALS[session.role].redirect;
      navigate({ to: dest });
    }
  }, [hydrated, session, navigate]);

  const tierMeta = TIERS.find((t) => t.key === tier)!;

  const handleTierSwitch = (next: Role) => {
    if (next === tier) return;
    setTier(next);
    setBannerError(false);
    setFieldErrors({});
  };

  const handleAutofill = (next: Role) => {
    const creds = MOCK_CREDENTIALS[next];
    setTier(next);
    setEmail(creds.email);
    setPassword(creds.password);
    setBannerError(false);
    setFieldErrors({});
    setShowPw(false);
    toast.message(`${creds.displayName} credentials loaded`, {
      description: "Hit Authenticate to continue · or edit before submitting",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setBannerError(false);
      return;
    }

    setSubmitting(true);
    const result = login(tier, email, password);
    setSubmitting(false);

    if (!result.ok) {
      setBannerError(true);
      toast.error(INVALID_CREDENTIALS_MESSAGE);
      return;
    }

    setBannerError(false);
    toast.success(`Welcome, ${result.session.displayName}`, {
      description: "Session initialised · secure handshake complete",
    });
    navigate({ to: result.redirect });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#EAEAEA] px-3 py-[calc(1rem+env(safe-area-inset-top))] sm:px-4 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center sm:mb-8">
          <div className="flex items-center gap-3 rounded-[1.75rem] border border-white/70 bg-white/80 px-3 py-2.5 shadow-[0_14px_44px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black text-base font-bold text-white">
              S
            </div>
            <div className="text-left leading-tight">
              <div className="text-[15px] font-semibold text-black">School Accounts</div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-black/50">
                Unified Control
              </div>
            </div>
          </div>
        </div>

        <OrganicCard tone="white" cornerSide="tr" className="p-6 sm:p-8">
          <h1 className="text-title">Sign in to continue</h1>
          <p className="mt-2 text-[14px] text-black/55">Select your authentication tier.</p>

  

          {bannerError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-2xl border border-[#B91C1C]/20 bg-[#FEE2E2] px-3 py-2.5 text-[12px] text-[#B91C1C]"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{INVALID_CREDENTIALS_MESSAGE}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label
                htmlFor="login-email"
                className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
              >
                Email / Username
              </Label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                  if (bannerError) setBannerError(false);
                }}
                placeholder={tierMeta.placeholderEmail}
                aria-invalid={!!fieldErrors.email}
                className={`h-12 w-full rounded-2xl border bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${
                  fieldErrors.email ? "border-[#B91C1C]/40" : "border-[#E5E5E5]"
                }`}
              />
              {fieldErrors.email && (
                <div className="text-[11px] text-[#B91C1C]">{fieldErrors.email}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="login-password"
                className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
              >
                Password
              </Label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((f) => ({ ...f, password: undefined }));
                    if (bannerError) setBannerError(false);
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  className={`h-12 w-full rounded-2xl border bg-white px-4 pr-11 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${
                    fieldErrors.password ? "border-[#B91C1C]/40" : "border-[#E5E5E5]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-black/45 hover:bg-[#F4F4F5] hover:text-black"
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="text-[11px] text-[#B91C1C]">{fieldErrors.password}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/90 disabled:opacity-60"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C7F33C]" />
              Authenticate · {tier === "super_admin" ? "Super Admin" : "Tenant Workspace"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 text-[10.5px] text-black/40">
            <div className="h-px flex-1 bg-[#E5E5E5]" />
            <span className="font-mono uppercase tracking-wider">
              Demo credentials · click to autofill
            </span>
            <div className="h-px flex-1 bg-[#E5E5E5]" />
          </div>
          <div className="mt-3 grid gap-2">
            {TIERS.map((t) => {
              const creds = MOCK_CREDENTIALS[t.key];
              const isActive = tier === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleAutofill(t.key)}
                  aria-label={`Auto-fill ${t.label} credentials`}
                  className={`group flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left font-mono text-[10.5px] transition-all hover:-translate-y-px hover:border-black/30 hover:bg-[#E1F2AE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                    isActive ? "border-black/30 bg-[#E1F2AE]" : "border-[#E5E5E5] bg-[#F4F4F5]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-3 w-3 text-black/45 group-hover:text-black" />
                    <span className="font-sans font-medium text-black">{t.label}</span>
                  </span>
                  <span className="flex items-center gap-2 text-black/65">
                    <span className="hidden sm:inline">{creds.email}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>{creds.password}</span>
                    <span className="rounded-full bg-black px-1.5 py-0.5 font-sans text-[9.5px] font-semibold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Fill
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </OrganicCard>

        <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-black/40">
          School Accounts SaaS · v2.0
        </div>
      </div>
    </div>
  );
}
