import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { schoolParentPay, schoolSaveParentPay } from "@/lib/api/school-family";
import { ApiError } from "@/lib/api/client";

export function ParentPayCard() {
  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = enabled !== saved;

  useEffect(() => {
    schoolParentPay()
      .then((data) => {
        setEnabled(data.enabled);
        setSaved(data.enabled);
        setConfigured(data.configured !== false);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
      onSubmit={(event) => {
        event.preventDefault();
        if (!dirty || busy) return;
        setError("");
        setBusy(true);
        void schoolSaveParentPay({ enabled })
          .then(() => {
            setSaved(enabled);
            toast.success(enabled ? "Parents can pay online" : "Parent online payment is off");
          })
          .catch((err) => {
            const message = err instanceof ApiError ? err.message : "Could not save";
            setError(message);
            toast.error(message);
          })
          .finally(() => setBusy(false));
      }}
    >
      <div>
        <h2 className="text-sm font-semibold">Parent Pay now</h2>
        <p className="text-xs text-slate-500">
          Parents pay due fees in the app through Feezo’s Cashfree checkout. A receipt is saved only after Cashfree confirms the amount.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            setEnabled(event.target.checked);
            setError("");
          }}
        />
        Allow parents to pay online
      </label>
      {!configured ? (
        <p className="text-xs text-rose-600">Online payment is not configured for this school yet.</p>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      <Button type="submit" disabled={busy || !dirty} className="rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59]">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save
      </Button>
    </form>
  );
}
