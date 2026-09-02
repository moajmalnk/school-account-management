import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { LegalLink, LegalSection, LegalShell } from "@/components/legal/LegalShell";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/terms")({
  component: TermsOfUsePage,
});

function TermsOfUsePage() {
  const email = BRAND.legal.supportEmail;

  useEffect(() => {
    document.title = `Terms of Use · ${BRAND.name}`;
    return () => {
      document.title = BRAND.name;
    };
  }, []);

  return (
    <LegalShell
      activePage="terms"
      title="Terms of Use"
      subtitle={`These Terms govern access to and use of ${BRAND.name} for schools, staff, and authorised users.`}
    >
      <p>
        Welcome to <strong>{BRAND.name}</strong> (“Feezo”, “we”, “us”, or “our”). By creating an
        account, starting a trial, or using our website, progressive web app, or mobile
        applications (together, the “Service”), you agree to these Terms of Use (“Terms”). If you
        do not agree, do not use the Service.
      </p>

      <LegalSection title="1. The Service">
        <p>
          {BRAND.name} is a cloud-based school account management platform. It helps schools manage
          students, fees, receipts, staff, finance records, reports, and related operations in one
          workspace. Features may vary by subscription plan and may change over time as we improve
          the product.
        </p>
      </LegalSection>

      <LegalSection title="2. Who may use the Service">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Schools and educational organisations</strong> that subscribe or start a trial
          </li>
          <li>
            <strong>Authorised staff</strong> invited or created by a School administrator
          </li>
          <li>
            <strong>Platform administrators</strong> acting on behalf of {BRAND.name}
          </li>
        </ul>
        <p>
          You must be at least 18 years old (or the age of majority in your jurisdiction) to create
          an administrator account. You are responsible for ensuring that users you add comply with
          these Terms.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and security">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Provide accurate registration information and keep it up to date</li>
          <li>Maintain the confidentiality of login credentials</li>
          <li>Notify us promptly of unauthorised access or suspected compromise</li>
          <li>Accept responsibility for activity under your account, except where caused by our fault</li>
        </ul>
        <p>
          We may suspend or restrict access if we reasonably believe an account has been compromised
          or is being misused.
        </p>
      </LegalSection>

      <LegalSection title="4. School responsibilities">
        <p>
          Schools are responsible for the accuracy, legality, and appropriateness of data they enter
          into the Service, including student, parent/guardian, staff, and financial information.
          Schools must:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Obtain any consents required by applicable law before collecting or processing personal data</li>
          <li>Configure roles and permissions appropriately for staff</li>
          <li>Comply with education, finance, and data-protection laws that apply to their operations</li>
          <li>Respond to parent, guardian, or student requests relating to School-controlled records</li>
        </ul>
        <p>
          Our <LegalLink href={BRAND.legal.privacyPath}>Privacy Policy</LegalLink> explains how we
          handle personal information as a service provider to Schools.
        </p>
      </LegalSection>

      <LegalSection title="5. Trials, subscriptions, and billing">
        <p>
          {BRAND.name} may offer a free evaluation period (for example, a 14-day trial) and paid
          subscription plans. Pricing, plan features, seat limits, and billing cycles are shown at
          signup or in your workspace billing settings.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Trials convert to paid plans unless cancelled before the trial ends, where applicable</li>
          <li>Fees are quoted in Indian Rupees (INR) unless stated otherwise</li>
          <li>Taxes may apply as required by law</li>
          <li>We may change plan pricing for future billing periods with reasonable notice</li>
        </ul>
        <p>
          Refunds are governed by our{" "}
          <LegalLink href={BRAND.legal.refundPolicyPath}>Refund Policy</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Use the Service for unlawful, fraudulent, or harmful purposes</li>
          <li>Attempt to access another School’s workspace without authorisation</li>
          <li>Reverse engineer, scrape, overload, or disrupt the Service or its infrastructure</li>
          <li>Upload malware or content that infringes third-party rights</li>
          <li>Resell or sublicense the Service except as expressly permitted in writing</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
        <p>
          {BRAND.name}, its logos, software, design, and documentation are owned by us or our
          licensors. We grant you a limited, non-exclusive, non-transferable right to use the
          Service during your subscription or trial for your School’s internal operations.
        </p>
        <p>
          You retain ownership of data you submit. You grant us a licence to host, process, back up,
          and display that data solely to provide and improve the Service.
        </p>
      </LegalSection>

      <LegalSection title="8. Confidentiality and data">
        <p>
          We implement reasonable technical and organisational measures to protect the Service. No
          system is perfectly secure. You are responsible for device security and credential hygiene
          on your side.
        </p>
        <p>
          For data subject requests relating to your login, see our{" "}
          <LegalLink href={BRAND.legal.dataDeletionPath}>Data deletion</LegalLink> page.
        </p>
      </LegalSection>

      <LegalSection title="9. Third-party services">
        <p>
          The Service may integrate with or link to third-party tools (for example messaging,
          payment, or hosting providers). Those services are governed by their own terms. We are not
          responsible for third-party products we do not control.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimers">
        <p>
          The Service is provided on an “as is” and “as available” basis. To the fullest extent
          permitted by law, we disclaim warranties of merchantability, fitness for a particular
          purpose, and non-infringement. We do not guarantee uninterrupted or error-free operation.
        </p>
        <p>
          {BRAND.name} is a software tool. We do not provide legal, tax, accounting, or educational
          compliance advice. Schools should verify reports and records independently where required.
        </p>
      </LegalSection>

      <LegalSection title="11. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {BRAND.name} and its officers, employees, and
          suppliers will not be liable for indirect, incidental, special, consequential, or punitive
          damages, or for loss of profits, data, goodwill, or business interruption.
        </p>
        <p>
          Our total liability for any claim arising from these Terms or the Service will not exceed
          the amount you paid us for the Service in the twelve (12) months before the event giving
          rise to the claim, or INR 10,000 if you are on a free trial and have not paid fees.
        </p>
      </LegalSection>

      <LegalSection title="12. Suspension and termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate access if you
          materially breach these Terms, fail to pay applicable fees, or if continued provision
          becomes impractical for legal or security reasons.
        </p>
        <p>
          Upon termination, your right to access the Service ends. We may retain or delete data as
          described in our Privacy Policy and applicable law.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to these Terms">
        <p>
          We may update these Terms from time to time. Material changes will be reflected by updating
          the “Last updated” date. Continued use after changes become effective constitutes acceptance,
          except where consent is required by law.
        </p>
      </LegalSection>

      <LegalSection title="14. Governing law">
        <p>
          These Terms are governed by the laws of India, without regard to conflict-of-law principles.
          Courts in India shall have exclusive jurisdiction, subject to any mandatory consumer
          protections in your jurisdiction.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>
          Questions about these Terms:{" "}
          <a
            href={`mailto:${email}`}
            className="font-medium text-[var(--mkt-green-deep)] hover:underline"
          >
            {email}
          </a>
        </p>
        <p>
          {BRAND.name} ·{" "}
          <a
            href="https://www.feezo.app"
            className="font-medium text-[var(--mkt-green-deep)] hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            www.feezo.app
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
