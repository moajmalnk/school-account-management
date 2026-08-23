import { createFileRoute, redirect } from "@tanstack/react-router";

import { SignupWizard } from "@/components/signup/SignupWizard";
import {
  isSignupStepSlug,
  loadSignupDraft,
  maxAllowedSignupStep,
  slugFromStepNumber,
  stepNumberFromSlug,
} from "@/lib/signup-content";

export const Route = createFileRoute("/signup/$step")({
  beforeLoad: ({ params }) => {
    const slug = params.step;
    if (!isSignupStepSlug(slug)) {
      throw redirect({
        href: "/signup/school",
        replace: true,
      });
    }

    if (slug === "success") return;

    const draft = loadSignupDraft();
    const requested = stepNumberFromSlug(slug);
    const allowed = maxAllowedSignupStep(draft);
    if (requested > allowed) {
      throw redirect({
        href: `/signup/${slugFromStepNumber(allowed)}`,
        replace: true,
      });
    }
  },
  component: SignupStepPage,
});

function SignupStepPage() {
  const { step } = Route.useParams();
  return <SignupWizard stepSlug={step} />;
}
