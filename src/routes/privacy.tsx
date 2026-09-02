import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { LegalLink, LegalSection, LegalShell } from "@/components/legal/LegalShell";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const email = BRAND.legal.supportEmail;

  useEffect(() => {
    document.title = `Privacy Policy · ${BRAND.name}`;
    return () => {
      document.title = BRAND.name;
    };
  }, []);

  return (
    <LegalShell
      activePage="privacy"
      title="Privacy Policy"
      subtitle={`How ${BRAND.name} collects, uses, and protects information across our web and mobile apps.`}
    >
      <p>
        This Privacy Policy explains how <strong>{BRAND.name}</strong> (“we”, “us”, or “our”)
        collects, uses, stores, and shares information when you use our school account management
        platform, including our website, progressive web app, and any iOS or Android applications
        that connect to the same services (together, the “Service”).
      </p>

      <LegalSection title="1. Who this applies to">
        <p>
          The Service is provided primarily to schools and educational organisations (“Schools”).
          Individual accounts are typically created by a School administrator for staff, or accessed
          by parents/guardians through links or credentials issued by the School.
        </p>
        <p>
          For student, parent, fee, and attendance records entered by a School, that School is
          generally the organisation responsible for deciding why and how that data is processed. We
          process that data as a service provider on the School’s instructions.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Account details:</strong> name, email address, username, password (stored as a
            hash), role, and permissions.
          </li>
          <li>
            <strong>School / workspace data:</strong> school profile, branches, classes, staff,
            students, fees, finance records, notifications, and related documents you or your School
            upload or enter.
          </li>
          <li>
            <strong>Device and session data:</strong> device identifiers, browser type, IP address,
            approximate location derived from IP, login times, and session tokens used to keep you
            signed in securely.
          </li>
          <li>
            <strong>Support communications:</strong> messages, attachments, and contact details you
            send to support or through in-app help.
          </li>
          <li>
            <strong>Usage logs:</strong> technical logs needed to operate, secure, and improve the
            Service (for example error reports and access logs).
          </li>
        </ul>
        <p>
          We do not sell personal information. We do not use your School’s student data for
          advertising.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Provide, maintain, and secure the Service</li>
          <li>Authenticate users and manage sessions across devices</li>
          <li>Process password resets and account-related notices</li>
          <li>Respond to support and data-deletion requests</li>
          <li>Monitor reliability, prevent abuse, and comply with law</li>
          <li>Communicate service updates or security notices</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Legal bases (where applicable)">
        <p>
          Where data-protection laws require a legal basis, we rely on: performance of a contract
          with the School or user; legitimate interests in operating a secure SaaS product; consent
          where required (for example certain optional communications); and legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="5. Sharing">
        <p>We may share information with:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Your School and authorised users within that School’s workspace</li>
          <li>
            Infrastructure and email providers that host or deliver the Service under
            confidentiality and security obligations
          </li>
          <li>Authorities when required by law or to protect rights and safety</li>
          <li>A successor entity if we are involved in a merger, acquisition, or asset transfer</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Retention">
        <p>
          We retain account and School data while the School’s subscription or workspace remains
          active, and for a limited period afterward as needed for backups, dispute resolution,
          security, and legal compliance. You may request deletion as described in Section 8 and on
          our{" "}
          <LegalLink href={BRAND.legal.dataDeletionPath}>Data deletion</LegalLink>{" "}
          page.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We use industry-standard measures such as encrypted transport (HTTPS), hashed passwords,
          access controls, and session management. No method of transmission or storage is
          completely secure; please use strong unique passwords and keep devices protected.
        </p>
      </LegalSection>

      <LegalSection title="8. Your choices and rights">
        <p>Depending on your location and role, you may have rights to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Access or correct personal information associated with your login</li>
          <li>Request deletion of your account and related personal data</li>
          <li>Ask your School to correct or delete School-controlled student records</li>
          <li>Withdraw consent where processing is based on consent</li>
        </ul>
        <p>
          To request deletion of your {BRAND.name} account or personal data, use{" "}
          <LegalLink href={BRAND.legal.dataDeletionPath}>
            {BRAND.legal.dataDeletionUrl}
          </LegalLink>{" "}
          or email{" "}
          <a href={`mailto:${email}`} className="font-medium text-[#0F766E] hover:underline">
            {email}
          </a>
          . We aim to complete verified requests within 30 days, unless a longer period is required
          by law or by legitimate School record-keeping needs.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          The Service is designed for Schools to manage educational operations. We do not knowingly
          market the Service directly to children. Student information is entered and controlled by
          Schools. Parents or guardians with privacy questions about a child’s school records should
          contact the School first; we will assist the School as needed.
        </p>
      </LegalSection>

      <LegalSection title="10. International transfers">
        <p>
          The Service may be hosted or supported from servers and providers in different countries.
          Where required, we use appropriate safeguards for cross-border transfers.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes">
        <p>
          We may update this Privacy Policy from time to time. The “Last updated” date at the top
          will change when we do. Continued use of the Service after an update means you accept the
          revised policy, except where consent is required by law.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          Privacy and data questions:{" "}
          <a href={`mailto:${email}`} className="font-medium text-[#0F766E] hover:underline">
            {email}
          </a>
        </p>
        <p>
          Product: {BRAND.name} · Web:{" "}
          <a
            href="https://www.feezo.app"
            className="font-medium text-[#0F766E] hover:underline"
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
