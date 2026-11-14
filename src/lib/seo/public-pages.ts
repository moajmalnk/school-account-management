import { BRAND } from "@/lib/brand";
import { MARKETING } from "@/lib/marketing-content";
import {
  CONTACT_PAGE_SEO,
  DOWNLOAD_PAGE,
  FEATURES_PAGE,
  HOME_PAGE,
  PRICING_PAGE,
  PRODUCT_PAGE,
  SETUP_PAGE,
  SIGNUP_PAGE_SEO,
  WHY_FEEZO_PAGE,
} from "@/lib/seo/marketing-pages-content";

export const SITE_ORIGIN = "https://www.feezo.app";
export const OG_IMAGE_PATH = "/og/feezo-share.jpg";
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;

export type PublicPageKey =
  | "home"
  | "whyFeezo"
  | "product"
  | "features"
  | "setup"
  | "pricing"
  | "download"
  | "contact"
  | "signup";

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
  name: BRAND.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Android, iOS, Web",
  url: `${SITE_ORIGIN}/`,
  description: HOME_PAGE.description,
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

function contactPageLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: CONTACT_PAGE_SEO.h1,
    url: `${SITE_ORIGIN}/contact`,
    description: CONTACT_PAGE_SEO.description,
    mainEntity: {
      "@type": "Organization",
      name: BRAND.name,
      telephone: BRAND.contact.phoneE164,
      email: BRAND.contact.email,
      address: organizationLd.address,
    },
  };
}

function pageSeo(
  path: string,
  title: string,
  description: string,
  crumbName: string,
  extraLd: Record<string, unknown>[] = [],
): PublicPageSeo {
  const canonical = path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
  return {
    path,
    canonical,
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: OG_IMAGE_URL,
    jsonLd: [
      organizationLd,
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: crumbName, path },
      ]),
      ...extraLd,
    ],
  };
}

export const PUBLIC_PAGE_SEO: Record<PublicPageKey, PublicPageSeo> = {
  home: {
    path: "/",
    canonical: `${SITE_ORIGIN}/`,
    title: HOME_PAGE.title,
    description: HOME_PAGE.description,
    ogTitle: HOME_PAGE.title,
    ogDescription: HOME_PAGE.description,
    ogUrl: `${SITE_ORIGIN}/`,
    ogImage: OG_IMAGE_URL,
    jsonLd: [organizationLd, softwareApplicationLd],
  },
  whyFeezo: pageSeo("/why-feezo", WHY_FEEZO_PAGE.title, WHY_FEEZO_PAGE.description, "Why Feezo"),
  product: pageSeo("/product", PRODUCT_PAGE.title, PRODUCT_PAGE.description, "Product"),
  features: pageSeo("/features", FEATURES_PAGE.title, FEATURES_PAGE.description, "Features"),
  setup: pageSeo("/setup", SETUP_PAGE.title, SETUP_PAGE.description, "Setup"),
  pricing: pageSeo("/pricing", PRICING_PAGE.title, PRICING_PAGE.description, "Pricing"),
  download: pageSeo("/download", DOWNLOAD_PAGE.title, DOWNLOAD_PAGE.description, "Download"),
  contact: {
    ...pageSeo("/contact", CONTACT_PAGE_SEO.title, CONTACT_PAGE_SEO.description, "Contact", [
      contactPageLd(),
    ]),
  },
  signup: {
    path: "/signup/school",
    canonical: `${SITE_ORIGIN}/signup/school`,
    title: SIGNUP_PAGE_SEO.title,
    description: SIGNUP_PAGE_SEO.description,
    ogTitle: SIGNUP_PAGE_SEO.title,
    ogDescription: SIGNUP_PAGE_SEO.description,
    ogUrl: `${SITE_ORIGIN}/signup/school`,
    ogImage: OG_IMAGE_URL,
    noindex: true,
    jsonLd: [],
  },
};

export const WHATSAPP_PREFILL =
  "Hi Feezo team, I'd like to know more about Feezo for my school.";

export function whatsappChatUrl(text: string = WHATSAPP_PREFILL): string {
  return `https://wa.me/${BRAND.contact.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function seoMain(inner: string): string {
  return `
<main id="seo-content" style="max-width:40rem;margin:0 auto;padding:4.5rem 1.25rem 3rem;font-family:system-ui,sans-serif;color:#1a1c2c;line-height:1.5">
${inner}
  <p style="margin:2rem 0 0">
    <a href="/">Feezo home</a> ·
    <a href="/signup/school">Start a 14-day trial</a> ·
    <a href="/contact">Contact</a> ·
    <a href="/download">Download the app</a>
  </p>
</main>`.trim();
}

export function homePrerenderBodyHtml(): string {
  const s = HOME_PAGE.sections;
  return seoMain(`
  <p style="margin:0;font-size:0.875rem;font-weight:600;color:#64748b">${escapeHtml(HOME_PAGE.eyebrow)}</p>
  <h1 style="margin:0.75rem 0 0;font-size:2rem;letter-spacing:-0.02em">${escapeHtml(HOME_PAGE.h1)}</h1>
  <p style="margin:0.75rem 0 0;font-size:1.1rem;font-weight:600">${escapeHtml(HOME_PAGE.tagline)}</p>
  <p style="margin:1rem 0 0;font-size:1.05rem;color:#3f3f46">${escapeHtml(HOME_PAGE.intro)}</p>
  <p style="margin:1.25rem 0 0">
    <a href="/signup/school">${escapeHtml(HOME_PAGE.primaryCta)}</a> ·
    <a href="/contact">${escapeHtml(HOME_PAGE.secondaryCta)}</a> ·
    <a href="/download">${escapeHtml(HOME_PAGE.tertiaryCta)}</a>
  </p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(s.whyFeezo.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(s.whyFeezo.body)}</p>
  <p style="margin:0.5rem 0 0"><a href="${s.whyFeezo.href}">${escapeHtml(s.whyFeezo.linkLabel)}</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(s.product.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(s.product.body)}</p>
  <p style="margin:0.5rem 0 0"><a href="${s.product.href}">${escapeHtml(s.product.linkLabel)}</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(s.features.h2)}</h2>
  ${s.features.items
    .map(
      (item) =>
        `<h3 style="margin:1rem 0 0;font-size:1.05rem">${escapeHtml(item.h3)}</h3><p style="margin:0.35rem 0 0;color:#3f3f46">${escapeHtml(item.body)}</p>`,
    )
    .join("\n  ")}
  <p style="margin:0.75rem 0 0"><a href="${s.features.href}">${escapeHtml(s.features.linkLabel)}</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(s.setup.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(s.setup.body)}</p>
  <p style="margin:0.5rem 0 0"><a href="${s.setup.href}">${escapeHtml(s.setup.linkLabel)}</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(s.pricing.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(s.pricing.body)}</p>
  <p style="margin:0.5rem 0 0"><a href="${s.pricing.href}">${escapeHtml(s.pricing.linkLabel)}</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(s.faq.h2)}</h2>
  ${s.faq.items
    .map(
      (item) =>
        `<h3 style="margin:1rem 0 0;font-size:1.05rem">${escapeHtml(item.q)}</h3><p style="margin:0.35rem 0 0;color:#3f3f46">${escapeHtml(item.a)}</p>`,
    )
    .join("\n  ")}
`);
}

export function whyFeezoPrerenderBodyHtml(): string {
  const p = WHY_FEEZO_PAGE;
  return seoMain(`
  <h1 style="margin:0;font-size:2rem;letter-spacing:-0.02em">${escapeHtml(p.h1)}</h1>
  <p style="margin:1rem 0 0;color:#3f3f46">${escapeHtml(p.intro)}</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.monthlyProblem.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(p.monthlyProblem.body)}</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.howFeezoFixes.h2)}</h2>
  <ul style="margin:0.75rem 0 0;padding-left:1.25rem">
    ${p.howFeezoFixes.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n    ")}
  </ul>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.whoFor.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(p.whoFor.body)}</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.operatedFrom.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(p.operatedFrom.body)}</p>
  <p style="margin:1.25rem 0 0">
    <a href="/signup/school">Start free 14-day trial</a> ·
    <a href="/contact">Book a demo</a> ·
    <a href="/product">Product</a> ·
    <a href="/features">Features</a> ·
    <a href="/pricing">Pricing</a>
  </p>
`);
}

export function productPrerenderBodyHtml(): string {
  const p = PRODUCT_PAGE;
  return seoMain(`
  <h1 style="margin:0;font-size:2rem;letter-spacing:-0.02em">${escapeHtml(p.h1)}</h1>
  <p style="margin:1rem 0 0;color:#3f3f46">${escapeHtml(p.intro)}</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.whatYouCanDo.h2)}</h2>
  <ul style="margin:0.75rem 0 0;padding-left:1.25rem">
    ${p.whatYouCanDo.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n    ")}
  </ul>
  <p style="margin:0.75rem 0 0"><a href="/features">See all features</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.oneSystem.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(p.oneSystem.body)}</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.webAndMobile.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(p.webAndMobile.body)}</p>
  <p style="margin:0.5rem 0 0"><a href="/download">Download the Feezo app</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.madeFor.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(p.madeFor.body)}</p>
`);
}

export function featuresPrerenderBodyHtml(): string {
  const p = FEATURES_PAGE;
  return seoMain(`
  <h1 style="margin:0;font-size:2rem;letter-spacing:-0.02em">${escapeHtml(p.h1)}</h1>
  ${p.features
    .map(
      (f) =>
        `<h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(f.h2)}</h2><p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(f.body)}</p>`,
    )
    .join("\n  ")}
`);
}

export function setupPrerenderBodyHtml(): string {
  const p = SETUP_PAGE;
  return seoMain(`
  <h1 style="margin:0;font-size:2rem;letter-spacing:-0.02em">${escapeHtml(p.h1)}</h1>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.steps.h2)}</h2>
  <ol style="margin:0.75rem 0 0;padding-left:1.25rem">
    ${p.steps.items
      .map(
        (step) =>
          `<li style="margin:0.5rem 0"><strong>${escapeHtml(step.title)}</strong>. ${escapeHtml(step.body)}</li>`,
      )
      .join("\n    ")}
  </ol>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.keepReady.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(p.keepReady.body)}</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.needHelp.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(p.needHelp.body)}</p>
  <p style="margin:1rem 0 0"><a href="/contact">Book a demo</a> · <a href="/signup/school">Start free 14-day trial</a></p>
`);
}

export function pricingPrerenderBodyHtml(): string {
  const p = PRICING_PAGE;
  const plans = MARKETING.pricing.plans;
  return seoMain(`
  <h1 style="margin:0;font-size:2rem;letter-spacing:-0.02em">${escapeHtml(p.h1)}</h1>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.choosePlan.h2)}</h2>
  ${plans
    .map(
      (plan) => `
  <h3 style="margin:1.25rem 0 0;font-size:1.1rem">${escapeHtml(plan.name)} — ₹${plan.monthlyInr}/month or ₹${plan.annualInr}/year</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">${escapeHtml(plan.blurb)}</p>
  <ul style="margin:0.5rem 0 0;padding-left:1.25rem">
    ${plan.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("\n    ")}
  </ul>
  <p style="margin:0.5rem 0 0"><a href="/signup/school">Start free 14-day trial</a></p>`,
    )
    .join("\n")}
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.trial.h2)}</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">${escapeHtml(p.trial.body)}</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(p.questions.h2)}</h2>
  ${p.questions.items
    .map(
      (item) =>
        `<h3 style="margin:1rem 0 0;font-size:1.05rem">${escapeHtml(item.q)}</h3><p style="margin:0.35rem 0 0;color:#3f3f46">${escapeHtml(item.a)}</p>`,
    )
    .join("\n  ")}
`);
}

export function contactPrerenderBodyHtml(): string {
  const wa = whatsappChatUrl();
  const tel = `tel:${BRAND.contact.phoneE164}`;
  const c = CONTACT_PAGE_SEO;
  return `
<main id="seo-content" style="max-width:40rem;margin:0 auto;padding:4.5rem 1.25rem 3rem;font-family:system-ui,sans-serif;color:#1a1c2c;line-height:1.5">
  <h1 style="margin:0;font-size:2rem;letter-spacing:-0.02em">${escapeHtml(c.h1)}</h1>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(c.bookDemo.h2)}</h2>
  <p style="margin:0.75rem 0 0;font-size:1.05rem;color:#3f3f46">${escapeHtml(c.bookDemo.body)}</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(c.details.h2)}</h2>
  <address style="margin:1rem 0 0;font-style:normal">
    <strong>${escapeHtml(BRAND.legal.operator)}</strong><br />
    ${escapeHtml(BRAND.contact.registeredAddress)}
  </address>
  <ul style="margin:1.25rem 0 0;padding:0;list-style:none">
    <li style="margin:0.5rem 0"><a href="${tel}">Phone: ${escapeHtml(BRAND.contact.phoneDisplay)}</a></li>
    <li style="margin:0.5rem 0"><a href="mailto:${escapeHtml(BRAND.contact.email)}">Email: ${escapeHtml(BRAND.contact.email)}</a></li>
    <li style="margin:0.5rem 0"><a href="${wa}" rel="noopener" target="_blank">WhatsApp: ${escapeHtml(BRAND.contact.whatsappDisplay)}</a></li>
  </ul>
  <p style="margin:1rem 0 0;font-size:0.9rem;color:#64748b">${escapeHtml(BRAND.contact.hours)}. ${escapeHtml(BRAND.contact.responseTime)}.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">${escapeHtml(c.form.h2)}</h2>
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
  const p = DOWNLOAD_PAGE;
  return `
<main id="seo-content" style="max-width:28rem;margin:0 auto;padding:4.5rem 1.25rem 3rem;font-family:system-ui,sans-serif;color:#0B1B33;text-align:center;line-height:1.5">
  <h1 style="margin:0;font-size:1.75rem;letter-spacing:-0.02em">${escapeHtml(p.h1)}</h1>
  <p style="margin:0.75rem 0 0;color:#64748B">${escapeHtml(p.intro)}</p>
  <h2 style="margin:1.5rem 0 0;font-size:1.15rem">${escapeHtml(p.whatYouCanDo.h2)}</h2>
  <ul style="margin:0.75rem 0 0;padding-left:1.25rem;text-align:left">
    ${p.whatYouCanDo.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n    ")}
  </ul>
  <p style="margin:1.5rem 0 0;display:flex;flex-direction:column;gap:0.75rem;align-items:center">
    <a href="${escapeHtml(BRAND.appStoreUrl)}" rel="noopener" target="_blank">Download Feezo on the App Store</a>
    <a href="${escapeHtml(BRAND.playStoreUrl)}" rel="noopener" target="_blank">Get Feezo on Google Play</a>
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
    if (selector.includes("property=")) {
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
