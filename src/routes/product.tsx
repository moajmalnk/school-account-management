import { createFileRoute } from "@tanstack/react-router";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ProductPage } from "@/components/marketing/pages/ProductPage";
import "@/file-routes";

export const Route = createFileRoute("/product")({
  component: ProductRoute,
});

function ProductRoute() {
  return (
    <MarketingShell>
      <ProductPage />
    </MarketingShell>
  );
}
