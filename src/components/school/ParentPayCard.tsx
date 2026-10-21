import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { schoolParentPay, schoolSaveParentPay } from "@/lib/api/school-family";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function ParentPayCard() {
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<"easebuzz" | "razorpay">("easebuzz");
  const [env, setEnv] = useState<"test" | "prod">("test");
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [stored, setStored] = useState({ razorpayKeyId: "", easebuzzKey: "", hasRazorpaySecret: false, hasEasebuzzSalt: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    schoolParentPay()
      .then((data) => {
        const next = {
          razorpayKeyId: data.razorpayKeyId || (data.provider === "razorpay" ? data.keyId : ""),
          easebuzzKey: data.easebuzzKey || (data.provider === "easebuzz" ? data.keyId : ""),
          hasRazorpaySecret: data.hasRazorpaySecret ?? (data.provider === "razorpay" && data.hasSecret),
          hasEasebuzzSalt: data.hasEasebuzzSalt ?? (data.provider === "easebuzz" && data.hasSecret),
        };
        const active = data.provider === "razorpay" ? "razorpay" : "easebuzz";
        setStored(next);
        setEnabled(data.enabled);
        setProvider(active);
        setEnv(data.env === "prod" ? "prod" : "test");
        setKeyId(active === "easebuzz" ? next.easebuzzKey : next.razorpayKeyId);
        setHasSecret(active === "easebuzz" ? next.hasEasebuzzSalt : next.hasRazorpaySecret);
      })
      .catch(() => undefined);
  }, []);

  const easebuzz = provider === "easebuzz";
  const secretMissing = !keySecret.trim() && !hasSecret;

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
      onSubmit={(event) => {
        event.preventDefault();
        if (enabled && (!keyId.trim() || secretMissing)) {
          setError(easebuzz ? "Easebuzz key and salt are required before parents can pay" : "Key id and key secret are required before parents can pay");
          return;
        }
        setError("");
        setBusy(true);
        void schoolSaveParentPay({
          enabled,
          provider,
          env,
          keyId: keyId.trim(),
          keySecret: keySecret.trim(),
          webhookSecret: webhookSecret.trim(),
        })
          .then(() => {
            const savedKey = keyId.trim();
            setStored((current) =>
              provider === "easebuzz"
                ? { ...current, easebuzzKey: savedKey, hasEasebuzzSalt: true }
                : { ...current, razorpayKeyId: savedKey, hasRazorpaySecret: true },
            );
            setKeySecret("");
            setWebhookSecret("");
            setHasSecret(true);
            toast.success("Parent payment settings saved");
          })
          .catch((err) => toast.error(err instanceof ApiError ? err.message : "Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <div>
        <h2 className="text-sm font-semibold">Parent Pay now</h2>
        <p className="text-xs text-slate-500">
          Parents select due fees and pay in the app. Keys stay on the server. A receipt is saved only after the gateway confirms the amount.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["easebuzz", "razorpay"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setProvider(item);
              setKeyId(item === "easebuzz" ? stored.easebuzzKey : stored.razorpayKeyId);
              setKeySecret("");
              setHasSecret(item === "easebuzz" ? stored.hasEasebuzzSalt : stored.hasRazorpaySecret);
              setError("");
            }}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              provider === item ? "border-[#0F766E] bg-teal-50 text-[#0F766E]" : "border-slate-200 dark:border-white/10",
            )}
          >
            {item === "easebuzz" ? "Easebuzz" : "Razorpay"}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
        Allow parents to pay online
      </label>
      {easebuzz ? (
        <div className="grid grid-cols-2 gap-2">
          {(["test", "prod"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setEnv(item)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm",
                env === item ? "border-[#0F766E] bg-teal-50 text-[#0F766E]" : "border-slate-200 dark:border-white/10",
              )}
            >
              {item === "test" ? "Test checkout" : "Live checkout"}
            </button>
          ))}
        </div>
      ) : null}
      <Input
        value={keyId}
        onChange={(event) => setKeyId(event.target.value)}
        placeholder={easebuzz ? "Easebuzz merchant key" : "Razorpay key id"}
        className="rounded-xl"
        autoComplete="off"
        maxLength={128}
      />
      <Input
        value={keySecret}
        onChange={(event) => setKeySecret(event.target.value)}
        placeholder={hasSecret ? "Saved — enter a new value to replace" : easebuzz ? "Easebuzz salt" : "Razorpay key secret"}
        type="password"
        className="rounded-xl"
        autoComplete="new-password"
        maxLength={255}
      />
      {!easebuzz ? (
        <>
          <Input
            value={webhookSecret}
            onChange={(event) => setWebhookSecret(event.target.value)}
            placeholder="Webhook secret (optional)"
            type="password"
            className="rounded-xl"
            autoComplete="new-password"
            maxLength={255}
          />
          <p className="text-xs text-slate-500">Webhook URL: /api/family/razorpay-webhook.php</p>
        </>
      ) : (
        <p className="text-xs text-slate-500">
          Parents pay by card, UPI, or net banking. Use test checkout until a live payment succeeds.
        </p>
      )}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      <Button
        type="submit"
        disabled={busy || (enabled && (!keyId.trim() || secretMissing))}
        className="rounded-xl bg-[#0F766E] text-white"
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save checkout
      </Button>
    </form>
  );
}
