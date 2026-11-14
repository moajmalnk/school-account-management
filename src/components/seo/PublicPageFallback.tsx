import { BRAND } from "@/lib/brand";
import { MARKETING } from "@/lib/marketing-content";

type FallbackPage = {
  title: string;
  paragraphs: string[];
  links: readonly { href: string; label: string }[];
};

const SHARED_LINKS = [
  { href: "/", label: "Feezo home" },
  { href: "/signup/school", label: "Start a 14-day trial" },
  { href: "/contact", label: "Contact the team" },
  { href: "/download", label: "Download the app" },
] as const;

function pageForPath(pathname: string): FallbackPage {
  if (pathname === "/signup" || pathname.startsWith("/signup/")) {
    return {
      title: "Start Your 14-Day Free Trial",
      paragraphs: [
        "No card required. Set up your school and try Feezo with your own data for 14 days.",
        "This step asks for the school name, board, state, district, phone number, and workspace address. The next step creates the admin login.",
        `${BRAND.name} is a school management system for fees, receipts, follow-ups, and accounts. It is operated by ${BRAND.legal.operator} in ${BRAND.contact.location}.`,
      ],
      links: SHARED_LINKS,
    };
  }

  if (pathname === "/contact") {
    return {
      title: "Contact Feezo",
      paragraphs: [
        `Talk to the Feezo team in Malappuram, Kerala. Book a demo or ask about fee collection software and setup.`,
        `Email ${BRAND.contact.email} or call ${BRAND.contact.phoneDisplay}.`,
        BRAND.contact.registeredAddress,
      ],
      links: SHARED_LINKS,
    };
  }

  if (pathname === "/why-feezo") {
    return {
      title: "Why Schools Choose Feezo for Fee Collection and Accounts",
      paragraphs: [
        "Feezo gives schools one simple system for fee collection, receipts, follow-ups and accounts.",
        MARKETING.description,
      ],
      links: SHARED_LINKS,
    };
  }

  if (pathname === "/product") {
    return {
      title: "Feezo: Mini ERP for School Fees and Accounts",
      paragraphs: [MARKETING.description],
      links: SHARED_LINKS,
    };
  }

  if (pathname === "/features") {
    return {
      title: "Feezo Features for School Fee Management",
      paragraphs: [
        "Online fee receipts, WhatsApp fee reminders, fee due tracking, reports and school accounts.",
      ],
      links: SHARED_LINKS,
    };
  }

  if (pathname === "/setup") {
    return {
      title: "Set Up Feezo for Your School in Minutes",
      paragraphs: [
        "Create your account, add students, set fees and start collecting. Free for 14 days.",
      ],
      links: SHARED_LINKS,
    };
  }

  if (pathname === "/pricing") {
    return {
      title: "Feezo Pricing: Start with a 14-Day Free Trial",
      paragraphs: [
        "Compare Feezo plans for schools and academies and start with a free 14-day trial.",
      ],
      links: SHARED_LINKS,
    };
  }

  if (pathname === "/download") {
    return {
      title: "Download the Feezo App for Schools and Parents",
      paragraphs: [
        "Check fee dues, view receipts and stay updated. Download Feezo from the App Store or Google Play.",
      ],
      links: SHARED_LINKS,
    };
  }

  return {
    title: "School Management System for Fees, Receipts & Accounts",
    paragraphs: [
      MARKETING.hero.support,
      MARKETING.description,
      `Plans start with a 14-day trial. ${BRAND.name} is operated by ${BRAND.legal.operator} in ${BRAND.contact.location}, India.`,
    ],
    links: SHARED_LINKS,
  };
}

/** Indexable copy for a public URL when a client chunk fails to render. */
export function PublicPageFallback({ pathname }: { pathname: string }) {
  const page = pageForPath(pathname);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col bg-white px-6 py-16 text-zinc-950">
      <p className="text-sm font-semibold tracking-wide text-zinc-500">{BRAND.name}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{page.title}</h1>
      {page.paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-4 text-base leading-relaxed text-zinc-700">
          {paragraph}
        </p>
      ))}
      <ul className="mt-8 space-y-2 text-base">
        {page.links.map((link) => (
          <li key={link.href}>
            <a className="font-medium text-zinc-950 underline" href={link.href}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function isPublicIndexablePath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/why-feezo" ||
    pathname === "/product" ||
    pathname === "/features" ||
    pathname === "/setup" ||
    pathname === "/pricing" ||
    pathname === "/contact" ||
    pathname === "/download" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/refund-policy" ||
    pathname === "/data-deletion" ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/")
  );
}
