/**
 * Post-build: inject per-route SEO head + crawlable body HTML for public pages.
 * Reads dist/index.html (Vite output) and writes:
 *   dist/index.html (patched home meta)
 *   dist/contact/index.html
 *   dist/download/index.html
 *   dist/not-found.html  (not named 404.html — Vercel auto-serves 404.html for every miss and breaks SPA routes)
 */
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const SITE = "https://www.feezo.app";
const OG_IMAGE = `${SITE}/og/feezo-share.jpg`;

const BRAND = {
  name: "Feezo",
  email: "info@feezo.app",
  phoneDisplay: "+91 77364 83502",
  phoneE164: "+917736483502",
  whatsappDisplay: "+91 77364 83502",
  whatsappNumber: "917736483502",
  location: "Malappuram, Kerala",
  registeredAddress:
    "Building No. 15-566/G, Kuzhimanna, Melekeezhisseri, Malappuram, Kerala - 673641",
  operator: "MAC ADZ",
  hours: "Mon – Sat · 9:30 AM – 6:30 PM IST",
  responseTime: "Replies within 1 business day",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.bzole.feezo",
  appStoreUrl: "https://apps.apple.com/in/app/feezo/id6811416005",
  mark: "/icons/feezo-mark.webp",
};

const WA_PREFILL = "Hi Feezo team, I'd like to know more about Feezo for my school.";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    legalName: BRAND.operator,
    url: `${SITE}/`,
    logo: `${SITE}${BRAND.mark}`,
    email: BRAND.email,
    telephone: BRAND.phoneE164,
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
}

function softwareLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Feezo Edu Books",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android, iOS, Web",
    url: `${SITE}/`,
    description:
      "School accounts simplified — fees, receipts, reports in one place. Start a 14-day trial.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      description: "14-day free trial",
    },
    publisher: { "@type": "Organization", name: BRAND.operator },
  };
}

function breadcrumbLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

function headTags({ title, description, canonical, ogTitle, ogDescription, ogUrl, jsonLd, noindex }) {
  const robots = noindex
    ? `<meta name="robots" content="noindex, nofollow" />`
    : `<meta name="robots" content="index, follow" />`;
  const ld = (jsonLd || [])
    .map(
      (block) =>
        `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n    ");
  return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    ${robots}
    <link rel="canonical" href="${esc(canonical)}" />
    <meta property="og:title" content="${esc(ogTitle)}" />
    <meta property="og:description" content="${esc(ogDescription)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(ogUrl)}" />
    <meta property="og:image" content="${esc(OG_IMAGE)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(ogTitle)}" />
    <meta name="twitter:description" content="${esc(ogDescription)}" />
    <meta name="twitter:image" content="${esc(OG_IMAGE)}" />
    <link rel="manifest" href="/manifest.webmanifest" />
    ${ld}`.trim();
}

function patchHead(html, tags) {
  let out = html;
  // Remove existing title / description / og / twitter / canonical so we can inject cleanly
  out = out.replace(/<title>[^<]*<\/title>/i, "");
  out = out.replace(/<meta\s+name="description"[^>]*>/gi, "");
  out = out.replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, "");
  out = out.replace(/<link\s+rel="canonical"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="robots"[^>]*>/gi, "");
  out = out.replace(/<\/head>/i, `    ${tags}\n  </head>`);
  return out;
}

function contactBody() {
  const wa = `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(WA_PREFILL)}`;
  return `
<main id="seo-content" style="max-width:40rem;margin:0 auto;padding:4.5rem 1.25rem 3rem;font-family:system-ui,sans-serif;color:#1a1c2c;line-height:1.5">
  <p style="margin:0;font-size:0.875rem;font-weight:600;color:#64748b">${esc(BRAND.name)}</p>
  <h1 style="margin:0.75rem 0 0;font-size:2rem;letter-spacing:-0.02em">Contact Feezo</h1>
  <p style="margin:1rem 0 0;font-size:1.05rem;color:#3f3f46">
    Questions about fees, receipts, pricing, or getting started? Reach the team operated by
    ${esc(BRAND.operator)} in ${esc(BRAND.location)}.
  </p>
  <address style="margin:1.5rem 0 0;font-style:normal">
    <strong>${esc(BRAND.operator)}</strong><br />
    ${esc(BRAND.registeredAddress)}
  </address>
  <ul style="margin:1.25rem 0 0;padding:0;list-style:none">
    <li style="margin:0.5rem 0"><a href="tel:${esc(BRAND.phoneE164)}">Phone: ${esc(BRAND.phoneDisplay)}</a></li>
    <li style="margin:0.5rem 0"><a href="mailto:${esc(BRAND.email)}">Email: ${esc(BRAND.email)}</a></li>
    <li style="margin:0.5rem 0"><a href="${esc(wa)}" rel="noopener" target="_blank">WhatsApp: ${esc(BRAND.whatsappDisplay)}</a></li>
  </ul>
  <p style="margin:1rem 0 0;font-size:0.9rem;color:#64748b">${esc(BRAND.hours)}. ${esc(BRAND.responseTime)}.</p>
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
</main>`;
}

function downloadBody() {
  return `
<main id="seo-content" style="max-width:28rem;margin:0 auto;padding:4.5rem 1.25rem 3rem;font-family:system-ui,sans-serif;color:#0B1B33;text-align:center;line-height:1.5">
  <p style="margin:0;font-size:0.875rem;font-weight:600;color:#64748b">${esc(BRAND.name)}</p>
  <h1 style="margin:0.75rem 0 0;font-size:1.75rem;letter-spacing:-0.02em">Download Feezo</h1>
  <p style="margin:0.75rem 0 0;color:#64748B">
    Choose your store — manage school fees, receipts, and accounts from your phone.
  </p>
  <p style="margin:1.5rem 0 0;display:flex;flex-direction:column;gap:0.75rem;align-items:center">
    <a href="${esc(BRAND.appStoreUrl)}" rel="noopener" target="_blank">Download on the App Store</a>
    <a href="${esc(BRAND.playStoreUrl)}" rel="noopener" target="_blank">Get it on Google Play</a>
  </p>
  <p style="margin:2rem 0 0">
    <a href="/">Feezo home</a> ·
    <a href="/contact">Contact</a> ·
    <a href="/signup/school">Start a 14-day trial</a>
  </p>
</main>`;
}

function notFoundBody() {
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
</main>`;
}

function stripBootShell(html) {
  return html
    .replace(/<div id="boot-shell">[\s\S]*?<\/div>\s*<div id="root"><\/div>/i, '<div id="root"></div>')
    .replace(
      /var marketing = path === "\/" \|\| path === "\/home" \|\| path === "\/index\.html";/,
      'var marketing = false;',
    );
}

function injectSeoBody(html, bodyHtml) {
  // Place crawlable content before #root; React will hydrate #root and can hide #seo-content
  return html.replace(
    /<div id="root"><\/div>/i,
    `${bodyHtml}\n    <div id="root"></div>
    <script>
      (function () {
        function hideSeo() {
          var el = document.getElementById("seo-content");
          if (el) el.setAttribute("hidden", "");
        }
        window.addEventListener("feezo:hydrated", hideSeo);
        // Fallback if the app event is missed
        setTimeout(hideSeo, 8000);
      })();
    </script>`,
  );
}

function pageHtml(base, seo, bodyHtml, { stripBoot = true } = {}) {
  let html = patchHead(base, headTags(seo));
  if (stripBoot) html = stripBootShell(html);
  if (bodyHtml) html = injectSeoBody(html, bodyHtml);
  // Ensure no-boot class for non-home pages so leftover boot CSS does not flash
  if (stripBoot) {
    html = html.replace(
      "<html lang=\"en\">",
      '<html lang="en" class="no-boot">',
    );
  }
  return html;
}

const pages = {
  home: {
    title: "Feezo · School Accounts Simplified",
    description:
      "School accounts simplified — fees, receipts, reports in one place. Start a 14-day trial with Feezo Edu Books.",
    canonical: `${SITE}/`,
    ogTitle: "Feezo · School Accounts Simplified",
    ogDescription:
      "School accounts simplified — fees, receipts, reports in one place. Start a 14-day trial.",
    ogUrl: `${SITE}/`,
    jsonLd: [organizationLd(), softwareLd()],
  },
  download: {
    title: "Download Feezo · App Store & Google Play",
    description:
      "Download Feezo for iOS and Android. Manage school fees, receipts, and accounts from your phone.",
    canonical: `${SITE}/download`,
    ogTitle: "Download Feezo",
    ogDescription:
      "Get Feezo on the App Store or Google Play. School accounts for fees, receipts, and follow-ups.",
    ogUrl: `${SITE}/download`,
    jsonLd: [
      organizationLd(),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Download", path: "/download" },
      ]),
    ],
  },
  contact: {
    title: "Contact Feezo · Demo, sales & support",
    description: `Contact Feezo at ${BRAND.email} or ${BRAND.phoneDisplay}. MAC ADZ, Malappuram, Kerala. Book a demo or start a 14-day trial.`,
    canonical: `${SITE}/contact`,
    ogTitle: "Contact Feezo",
    ogDescription: `Reach the Feezo team — ${BRAND.phoneDisplay}, ${BRAND.email}. Operated by ${BRAND.operator} in Malappuram, Kerala.`,
    ogUrl: `${SITE}/contact`,
    jsonLd: [
      organizationLd(),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
      ]),
    ],
  },
};

async function main() {
  const base = await readFile(path.join(dist, "index.html"), "utf8");

  // Home: keep boot shell, patch head only
  const homeHtml = pageHtml(base, pages.home, null, { stripBoot: false });
  // Still mark marketing home correctly (drop /home)
  const homePatched = homeHtml.replace(
    /var marketing = path === "\/" \|\| path === "\/home" \|\| path === "\/index\.html";/,
    'var marketing = path === "/" || path === "/index.html";',
  );
  await writeFile(path.join(dist, "index.html"), homePatched, "utf8");

  await mkdir(path.join(dist, "contact"), { recursive: true });
  await writeFile(
    path.join(dist, "contact", "index.html"),
    pageHtml(base, pages.contact, contactBody()),
    "utf8",
  );

  await mkdir(path.join(dist, "download"), { recursive: true });
  await writeFile(
    path.join(dist, "download", "index.html"),
    pageHtml(base, pages.download, downloadBody()),
    "utf8",
  );

  // Standalone 404 (no SPA shell required for crawlers; still include basic chrome)
  const notFound = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page not found · Feezo</title>
    <meta name="robots" content="noindex, nofollow" />
    <link rel="canonical" href="${SITE}/404" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      html,body{margin:0;background:#fff;color:#1a1c2c}
    </style>
  </head>
  <body>
    ${notFoundBody()}
  </body>
</html>
`;
  // Do not ship 404.html — Vercel treats it as a global fallback and ignores SPA rewrites.
  await writeFile(path.join(dist, "not-found.html"), notFound, "utf8");
  await unlink(path.join(dist, "404.html")).catch(() => undefined);

  console.log("Prerendered public pages: /, /contact, /download, not-found.html");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
