import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { LegalLink, LegalSection, LegalShell } from "@/components/legal/LegalShell";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  const email = BRAND.legal.supportEmail;

  useEffect(() => {
    document.title = `Refund Policy · ${BRAND.name}`;
    return () => {
      document.title = BRAND.name;
    };
  }, []);

  return (
    <LegalShell
      activePage="refund"
      title="Refund Policy"
      subtitle={`How trials, subscriptions, and refunds work for ${BRAND.name} school plans.`}
    >
      <p>
        This Refund Policy explains how billing, cancellations, and refunds apply when your School
        uses <strong>{BRAND.name}</strong>. It should be read together with our{" "}
        <LegalLink href={BRAND.legal.termsPath}>Terms of Use</LegalLink> and{" "}
        <LegalLink href={BRAND.legal.privacyPath}>Privacy Policy</LegalLink>.
      </p>

      <LegalSection title="1. Overview">
        <p>
          {BRAND.name} offers subscription plans for schools (such as Basic, Premium, and Enterprise)
          with optional free trials. Fees are generally billed in advance on a monthly or annual
          cycle, depending on the plan you select.
        </p>
      </LegalSection>

      <LegalSection title="2. Free trial">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            New Schools may receive a <strong>14-day full-feature trial</strong> on eligible plans,
            unless otherwise stated at signup.
          </li>
          <li>
            No payment is required to start a standard trial when a payment method is not collected
            upfront.
          </li>
          <li>
            If you do not wish to continue on a paid plan, cancel before the trial ends through
            your workspace billing settings or by contacting support.
          </li>
          <li>
            Trial access may be limited or ended if these Terms are violated or if fraudulent
            activity is suspected.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Paid subscriptions">
        <p>When you purchase a paid plan:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>You authorise us (or our payment processor) to charge the applicable subscription fee</li>
          <li>Plans renew automatically at the end of each billing period unless cancelled</li>
          <li>Plan upgrades may be charged on a prorated basis where supported</li>
          <li>Downgrades typically take effect at the next renewal date</li>
        </ul>
        <p>
          Current list prices are shown on our pricing page and during signup. Taxes, if applicable,
          are added as required by law.
        </p>
      </LegalSection>

      <LegalSection title="4. Refund eligibility">
        <p>We want Schools to evaluate {BRAND.name} with confidence. Refunds may be available in these cases:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Duplicate or erroneous charge:</strong> we will refund verified duplicate
            payments or clear billing errors.
          </li>
          <li>
            <strong>First paid period within 7 days:</strong> if your School’s first paid subscription
            charge was made in error or the Service was materially unavailable due to our fault, contact
            us within 7 days of the charge for review.
          </li>
          <li>
            <strong>Annual plan cancellation:</strong> if you cancel an annual plan within 14 days of
            initial purchase and have not materially used paid-only features beyond reasonable
            evaluation, we may offer a partial or full refund at our discretion.
          </li>
        </ul>
        <p>
          Refund decisions are made case by case. Approved refunds are processed to the original
          payment method within <strong>7–14 business days</strong>, depending on your bank or card
          issuer.
        </p>
      </LegalSection>

      <LegalSection title="5. Non-refundable items">
        <p>The following are generally not refundable:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Subscription fees for billing periods that have already started, except as stated above</li>
          <li>Partial months after a renewal when the Service remained available</li>
          <li>Third-party fees, SMS/WhatsApp credits, or add-ons billed by external providers</li>
          <li>Custom development, onboarding, or professional services unless agreed in writing</li>
          <li>Accounts terminated for breach of our Terms of Use</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. How to request a refund">
        <p>To request a refund or billing review, email us with:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>School / workspace name and subdomain</li>
          <li>Administrator name and registered email</li>
          <li>Invoice or transaction reference (if available)</li>
          <li>Reason for the request</li>
        </ul>
        <p>
          Email:{" "}
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`${BRAND.name} refund request`)}`}
            className="font-medium text-[var(--mkt-green-deep)] hover:underline"
          >
            {email}
          </a>
        </p>
        <p>We aim to acknowledge requests within 2 business days.</p>
      </LegalSection>

      <LegalSection title="7. Cancellations">
        <p>
          You may cancel a subscription at any time. Cancellation stops future renewals; access
          continues until the end of the current paid period unless we agree otherwise.
        </p>
        <p>
          Cancelling does not automatically delete School data. To request account or personal data
          deletion, use our <LegalLink href={BRAND.legal.dataDeletionPath}>Data deletion</LegalLink>{" "}
          page.
        </p>
      </LegalSection>

      <LegalSection title="8. Chargebacks">
        <p>
          If you believe a charge is incorrect, please contact us before initiating a chargeback
          with your bank. Unresolved chargebacks may result in suspension of the workspace while we
          investigate.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to this policy">
        <p>
          We may update this Refund Policy from time to time. The “Last updated” date at the top will
          change when we do. Material changes apply to future purchases and renewals.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Billing and refund questions:{" "}
          <a
            href={`mailto:${email}`}
            className="font-medium text-[var(--mkt-green-deep)] hover:underline"
          >
            {email}
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
