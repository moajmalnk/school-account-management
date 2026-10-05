import { useRouterState } from "@tanstack/react-router";

import { FeezoChatPanel } from "@/components/ai/FeezoChatPanel";
import { FeezoFab } from "@/components/ai/FeezoFab";
import { useFeezoAssistant } from "@/components/ai/useFeezoAssistant";

/** Hide the FAB over Support chat so Send / mic stay fully visible. */
function useHideFeezoFab(): boolean {
  return useRouterState({
    select: (s) => {
      const path = s.location.pathname;
      if (path.startsWith("/tenant/support")) return true;
      if (!path.startsWith("/tenant/settings")) return false;
      const tab = new URLSearchParams(s.location.searchStr).get("tab");
      return tab === "support";
    },
  });
}

/** Tenant-wide Feezo AI — FAB + chat panel. */
export function FeezoAssistant() {
  const assistant = useFeezoAssistant();
  const hideFab = useHideFeezoFab();

  return (
    <>
      {hideFab ? null : (
        <FeezoFab
          open={assistant.open}
          onOpen={() => assistant.setOpen(true)}
          label={assistant.locale === "ml" ? "ഫീസോ AI" : "Feezo AI"}
        />
      )}
      <FeezoChatPanel assistant={assistant} />
    </>
  );
}
