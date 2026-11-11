import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { FamilyApp } from "@/components/family/FamilyApp";
import { applyNoindex } from "@/lib/seo/public-pages";

export const Route = createFileRoute("/family")({
  component: FamilyLayout,
});

function FamilyLayout() {
  useEffect(() => {
    applyNoindex();
  }, []);

  return <FamilyApp />;
}
