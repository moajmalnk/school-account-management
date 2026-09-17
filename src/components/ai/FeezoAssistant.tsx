import { FeezoChatPanel } from "@/components/ai/FeezoChatPanel";
import { FeezoFab } from "@/components/ai/FeezoFab";
import { useFeezoAssistant } from "@/components/ai/useFeezoAssistant";

/** Tenant-wide Feezo AI — FAB + chat panel. */
export function FeezoAssistant() {
  const assistant = useFeezoAssistant();

  return (
    <>
      <FeezoFab
        open={assistant.open}
        onOpen={() => assistant.setOpen(true)}
        label={assistant.locale === "ml" ? "ഫീസോ AI" : "Feezo AI"}
      />
      <FeezoChatPanel assistant={assistant} />
    </>
  );
}
