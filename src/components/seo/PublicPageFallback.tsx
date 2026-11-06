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
      title: "Start a 14-day Feezo trial",
      paragraphs: [
        "Set up your school in about a minute. Full access for 14 days, and no card is required.",
        "This step asks for the school name, board, state, district, phone number, and workspace address. The next step creates the admin login.",
        `${BRAND.name} is school accounts software for fees, receipts, follow-ups, and reports. It is operated by ${BRAND.legal.operator} in ${BRAND.contact.location}.`,
      ],
      links: SHARED_LINKS,
    };
  }

  if (pathname === "/contact") {
    return {
      title: "Contact Feezo",
      paragraphs: [
        `Questions about fees, receipts, pricing, or getting started? Email ${BRAND.contact.email} or call ${BRAND.contact.phoneDisplay}.`,
        `${BRAND.contact.hours}. ${BRAND.contact.responseTime}.`,
        BRAND.contact.registeredAddress,
      ],
      links: SHARED_LINKS,
    };
  }

  return {
    title: "School accounts, simplified",
    paragraphs: [
      MARKETING.hero.support,
      MARKETING.description,
      `Feezo is a mini ERP for schools: ${MARKETING.features.items.map((item) => item.title.toLowerCase()).join(", ")}.`,
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
    pathname === "/home" ||
    pathname === "/contact" ||
    pathname === "/download" ||
    pathname === "/login" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/refund-policy" ||
    pathname === "/data-deletion" ||
    pathname === "/forgot-password" ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/")
  );
}
