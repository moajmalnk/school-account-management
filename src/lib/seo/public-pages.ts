import { BRAND } from "@/lib/brand";
import { MARKETING } from "@/lib/marketing-content";

export const SITE_ORIGIN = "https://www.feezo.app";
export const OG_IMAGE_PATH = "/og/feezo-share.jpg";
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;

export type PublicPageKey = "home" | "download" | "contact";

export type PublicPageSeo = {
  path: string;
  canonical: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  noindex?: boolean;
  jsonLd: Record<string, unknown>[];
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND.name,
  legalName: BRAND.legal.operator,
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}${BRAND.mark}`,
  email: BRAND.contact.email,
  telephone: BRAND.contact.phoneE164,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Building No. 15-566/G, Kuzhimanna, Melekeezhisseri",
    addressLocality: "Malappuram",
    addressRegion: "Kerala",
    postalCode: "673641",
    addressCountry: "IN",
  },
  sameAs: [BRAND.playStoreUrl, BRAND.appStoreUrl],
};

const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: `${BRAND.name} Edu Books`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Android, iOS, Web",
  url: `${SITE_ORIGIN}/`,
  description: MARKETING.description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    description: "14-day free trial",
  },
  publisher: {
    "@type": "Organization",
    name: BRAND.legal.operator,
  },
};

function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_ORIGIN}${item.path}`,
    })),
  };
}

export const PUBLIC_PAGE_SEO: Record<PublicPageKey, PublicPageSeo> = {
  home: {
    path: "/",
    canonical: `${SITE_ORIGIN}/`,
    title: MARKETING.title,
    description:
      "School accounts simplified — fees, receipts, reports in one place. Start a 14-day trial with Feezo Edu Books.",
    ogTitle: MARKETING.title,
    ogDescription: MARKETING.description,
    ogUrl: `${SITE_ORIGIN}/`,
    ogImage: OG_IMAGE_URL,
    jsonLd: [organizationLd, softwareApplicationLd],
  },
  download: {
    path: "/download",
    canonical: `${SITE_ORIGIN}/download`,
    title: "Download Feezo · App Store & Google Play",
    description:
      "Download Feezo for iOS and Android. Manage school fees, receipts, and accounts from your phone.",
    ogTitle: "Download Feezo",
    ogDescription:
      "Get Feezo on the App Store or Google Play. School accounts for fees, receipts, and follow-ups.",
    ogUrl: `${SITE_ORIGIN}/download`,
    ogImage: OG_IMAGE_URL,
    jsonLd: [
      organizationLd,
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Download", path: "/download" },
      ]),
    ],
  },
  contact: {
    path: "/contact",
    canonical: `${SITE_ORIGIN}/contact`,
    title: "Contact Feezo · Demo, sales & support",
    description: `Contact Feezo at ${BRAND.contact.email} or ${BRAND.contact.phoneDisplay}. MAC ADZ, Malappuram, Kerala. Book a demo or start a 14-day trial.`,
    ogTitle: "Contact Feezo",
    ogDescription: `Reach the Feezo team — ${BRAND.contact.phoneDisplay}, ${BRAND.contact.email}. Operated by ${BRAND.legal.operator} in Malappuram, Kerala.`,
    ogUrl: `${SITE_ORIGIN}/contact`,
    ogImage: OG_IMAGE_URL,
    jsonLd: [
      organizationLd,
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
      ]),
    ],
  },
};

export const WHATSAPP_PREFILL =
  "Hi Feezo team, I'd like to know more about Feezo for my school.";

export function whatsappChatUrl(text: string = WHATSAPP_PREFILL): string {
  return `https://wa.me/${BRAND.contact.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function contactPrerenderBodyHtml(): string {
  const wa = whatsappChatUrl();
  const tel = `tel:${BRAND.contact.phoneE164}`;
  return `
<main id="seo-content" style="max-width:40rem;margin:0 auto;padding:4.5rem 1.25rem 3rem;font-family:system-ui,sans-serif;color:#1a1c2c;line-height:1.5">
  <p style="margin:0;font-size:0.875rem;font-weight:600;color:#64748b">${escapeHtml(BRAND.name)}</p>
  <h1 style="margin:0.75rem 0 0;font-size:2rem;letter-spacing:-0.02em">Contact Feezo</h1>
  <p style="margin:1rem 0 0;font-size:1.05rem;color:#3f3f46">
    Questions about fees, receipts, pricing, or getting started? Reach the team operated by
    ${escapeHtml(BRAND.legal.operator)} in ${escapeHtml(BRAND.contact.location)}.
  </p>
  <address style="margin:1.5rem 0 0;font-style:normal">
    <strong>${escapeHtml(BRAND.legal.operator)}</strong><br />
    ${escapeHtml(BRAND.contact.registeredAddress)}
  </address>
  <ul style="margin:1.25rem 0 0;padding:0;list-style:none">
    <li style="margin:0.5rem 0"><a href="${tel}">Phone: ${escapeHtml(BRAND.contact.phoneDisplay)}</a></li>
    <li style="margin:0.5rem 0"><a href="mailto:${escapeHtml(BRAND.contact.email)}">Email: ${escapeHtml(BRAND.contact.email)}</a></li>
    <li style="margin:0.5rem 0"><a href="${wa}" rel="noopener" target="_blank">WhatsApp: ${escapeHtml(BRAND.contact.whatsappDisplay)}</a></li>
  </ul>
  <p style="margin:1rem 0 0;font-size:0.9rem;color:#64748b">${escapeHtml(BRAND.contact.hours)}. ${escapeHtml(BRAND.contact.responseTime)}.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Request a demo or trial</h2>
  <form method="post" action="https://api.feezo.app/api/public/contact.php" style="margin-top:1rem;display:grid;gap:0.75rem">
    <label>Name <input name="name" required maxlength="120" autocomplete="name" /></label>
    <label>School / academy name <input name="school" required maxlength="200" autocomplete="organization" /></label>
    <label>Phone <input name="phone" type="tel" required maxlength="32" autocomplete="tel" /></label>
    <label>Email <input name="email" type="email" required maxlength="255" autocomplete="email" /></label>
    <label>City / country <input name="cityCountry" maxlength="120" autocomplete="address-level2" /></label>
    <label>Institute type
      <select name="instituteType">
        <option value="school">School</option>
        <option value="academy">Academy</option>
        <option value="tuition">Tuition</option>
        <option value="other">Other</option>
      </select>
    </label>
    <label>Message <textarea name="message" required maxlength="4000" rows="4"></textarea></label>
    <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true" />
    <input type="hidden" name="topic" value="demo" />
    <input type="hidden" name="page" value="/contact" />
    <p style="margin:0;font-size:0.8rem;color:#64748b">
      By submitting, you agree to our <a href="/privacy">Privacy Policy</a>.
    </p>
    <button type="submit">Send message</button>
  </form>
  <p style="margin:2rem 0 0">
    <a href="/">Feezo home</a> ·
    <a href="/signup/school">Start a 14-day trial</a> ·
    <a href="/download">Download the app</a>
  </p>
</main>`.trim();
}

export function downloadPrerenderBodyHtml(): string {
  return `
<main id="seo-content" style="max-width:28rem;margin:0 auto;padding:4.5rem 1.25rem 3rem;font-family:system-ui,sans-serif;color:#0B1B33;text-align:center;line-height:1.5">
  <p style="margin:0;font-size:0.875rem;font-weight:600;color:#64748b">${escapeHtml(BRAND.name)}</p>
  <h1 style="margin:0.75rem 0 0;font-size:1.75rem;letter-spacing:-0.02em">Download Feezo</h1>
  <p style="margin:0.75rem 0 0;color:#64748B">
    Choose your store — manage school fees, receipts, and accounts from your phone.
  </p>
  <p style="margin:1.5rem 0 0;display:flex;flex-direction:column;gap:0.75rem;align-items:center">
    <a href="${escapeHtml(BRAND.appStoreUrl)}" rel="noopener" target="_blank">Download on the App Store</a>
    <a href="${escapeHtml(BRAND.playStoreUrl)}" rel="noopener" target="_blank">Get it on Google Play</a>
  </p>
  <p style="margin:2rem 0 0">
    <a href="/">Feezo home</a> ·
    <a href="/contact">Contact</a> ·
    <a href="/signup/school">Start a 14-day trial</a>
  </p>
</main>`.trim();
}

export function notFoundPrerenderBodyHtml(): string {
  return `
<main style="max-width:28rem;margin:0 auto;padding:5rem 1.25rem;font-family:system-ui,sans-serif;color:#1a1c2c;text-align:center;line-height:1.5">
  <p style="margin:0;font-size:0.875rem;font-weight:600;color:#64748b">404</p>
  <h1 style="margin:0.75rem 0 0;font-size:1.75rem">Page not found</h1>
  <p style="margin:0.75rem 0 0;color:#64748b">
    That URL is not part of Feezo. Head home or start a free trial.
  </p>
  <p style="margin:1.5rem 0 0;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
    <a href="/">Go to homepage</a>
    <a href="/signup/school">Start 14-day trial</a>
  </p>
</main>`.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Apply public-page meta tags in the browser after client navigations. */
export function applyDocumentSeo(page: PublicPageSeo): void {
  if (typeof document === "undefined") return;
  document.title = page.title;
  setMeta('meta[name="description"]', "content", page.description);
  setMeta('meta[property="og:title"]', "content", page.ogTitle);
  setMeta('meta[property="og:description"]', "content", page.ogDescription);
  setMeta('meta[property="og:url"]', "content", page.ogUrl);
  setMeta('meta[property="og:image"]', "content", page.ogImage);
  setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
  setMeta('meta[name="twitter:image"]', "content", page.ogImage);
  setMeta('meta[name="twitter:title"]', "content", page.ogTitle);
  setMeta('meta[name="twitter:description"]', "content", page.ogDescription);
  setLinkCanonical(page.canonical);
  if (page.noindex) {
    setMeta('meta[name="robots"]', "content", "noindex, nofollow");
  } else {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots?.getAttribute("content")?.includes("noindex")) {
      robots.setAttribute("content", "index, follow");
    }
  }
}

export function applyNoindex(): void {
  if (typeof document === "undefined") return;
  setMeta('meta[name="robots"]', "content", "noindex, nofollow");
}

function setMeta(selector: string, attr: string, value: string): void {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (selector.includes('property=')) {
      const prop = selector.match(/property="([^"]+)"/)?.[1];
      if (prop) el.setAttribute("property", prop);
    } else {
      const name = selector.match(/name="([^"]+)"/)?.[1];
      if (name) el.setAttribute("name", name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setLinkCanonical(href: string): void {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}
