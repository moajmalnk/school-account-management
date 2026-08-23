import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { SignupWizard } from "@/components/signup/SignupWizard";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  useEffect(() => {
    document.title = "Feezo · Start 14-day trial";
  }, []);

  return <SignupWizard />;
}
