/**
 * Post-build: inject per-route SEO head + crawlable body HTML for public pages.
 * Reads dist/index.html (Vite output) and writes prerendered routes + not-found.html.
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
  phoneDisplay: "+91 94473 39048",
  phoneE164: "+919447339048",
  whatsappDisplay: "+91 94473 39048",
  whatsappNumber: "919447339048",
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

const PLANS = [
  {
    name: "Basic",
    monthlyInr: 899,
    annualInr: 9499,
    blurb: "Core school ops, fees, and reporting.",
    features: [
      "Financial module",
      "Student & class management",
      "Staff & vehicle management",
      "Analytical reporting",
      "Manual fee reminders",
    ],
  },
  {
    name: "Premium",
    monthlyInr: 1499,
    annualInr: 16499,
    blurb: "Fee collection, extra users, and branches.",
    features: ["Everything in Basic", "Fee collection", "Extra user access", "Multiple branches"],
  },
  {
    name: "Enterprise",
    monthlyInr: 2299,
    annualInr: 25499,
    blurb: "Full platform — payroll, WhatsApp, automation.",
    features: [
      "Everything in Premium",
      "Staff attendance & payroll",
      "Automatic fee collection",
      "WhatsApp integration",
    ],
  },
];

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
    name: "Feezo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android, iOS, Web",
    url: `${SITE}/`,
    description:
      "Feezo is a school management system and mini ERP for schools. Collect fees, issue online receipts and manage accounts. Try it free for 14 days.",
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

function contactPageLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Feezo",
    url: `${SITE}/contact`,
    description:
      "Talk to the Feezo team in Malappuram, Kerala. Book a demo of our school management system or ask about fee collection software and setup.",
    mainEntity: {
      "@type": "Organization",
      name: BRAND.name,
      telephone: BRAND.phoneE164,
      email: BRAND.email,
      address: organizationLd().address,
    },
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
  out = out.replace(/<title>[^<]*<\/title>/i, "");
  out = out.replace(/<meta\s+name="description"[^>]*>/gi, "");
  out = out.replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, "");
  out = out.replace(/<link\s+rel="canonical"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="robots"[^>]*>/gi, "");
  out = out.replace(/<\/head>/i, `    ${tags}\n  </head>`);
  return out;
}

function seoShell(inner) {
  return `
<main id="seo-content" style="max-width:40rem;margin:0 auto;padding:4.5rem 1.25rem 3rem;font-family:system-ui,sans-serif;color:#1a1c2c;line-height:1.5">
${inner}
  <p style="margin:2rem 0 0">
    <a href="/">Feezo home</a> ·
    <a href="/signup/school">Start a 14-day trial</a> ·
    <a href="/contact">Contact</a> ·
    <a href="/download">Download the app</a>
  </p>
</main>`;
}

function homeBody() {
  // Hero H1 lives in #boot-shell; this block only adds indexable section copy.
  return seoShell(`
  <p style="margin:0">
    <a href="/signup/school">Start free 14-day trial</a> ·
    <a href="/contact">Book a demo</a> ·
    <a href="/download">Download the app</a>
  </p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Fee Collection Problems Schools Face Every Month</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Late payments, handwritten receipts and scattered records make fee collection a monthly struggle. Staff chase parents one by one, and accounts are matched by hand at the month end. Feezo replaces this routine with one simple system for fees, receipts and follow-ups, so nothing slips through.</p>
  <p style="margin:0.5rem 0 0"><a href="/why-feezo">See why schools choose Feezo</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Feezo: ERP for Schools That Runs Fees and Accounts</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Feezo is a mini ERP for schools. It brings fee collection, online receipts, reports and day-to-day school accounts into one simple system, so your office does not depend on separate registers, spreadsheets and accounting software. Management sees income, expenses and cash position on one dashboard.</p>
  <p style="margin:0.5rem 0 0"><a href="/product">Explore the Feezo product overview</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">School Management Software Features: Fees, Receipts, Reminders &amp; Reports</h2>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">Online Fee Receipts</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">Issue a digital receipt as soon as a payment is recorded and find it in seconds.</p>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">Fee Reminder Messages for Students and Parents</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">Send follow-ups for pending fees without calling each parent.</p>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">Fee Due Tracking</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">See who has paid and who has pending fees at a glance.</p>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">Reports and School Accounts</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">Track income, expenses and cash position on one dashboard.</p>
  <p style="margin:0.75rem 0 0"><a href="/features">See all features</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Set Up Your School Management System in Minutes</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Create your school account, add your students, set up your fee structure and start collecting. Most schools can finish setup in a single sitting, and you do not need accounting knowledge to begin.</p>
  <p style="margin:0.5rem 0 0"><a href="/setup">See the four setup steps</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Feezo Pricing: Start a 14-Day Free Trial</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Try Feezo free for 14 days with your own school data, then choose the plan that fits your school. Compare plans, see what is included and start your free trial today.</p>
  <p style="margin:0.5rem 0 0"><a href="/pricing">Compare Feezo plans</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Frequently Asked Questions About School Management Software</h2>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">What is a school management system?</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">A school management system is software that helps a school run daily administration in one place, such as fees, student records, receipts and accounts. Feezo focuses first on fee collection and school accounts, the work that takes most office time.</p>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">How does Feezo help track pending fees?</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">Feezo keeps a record of every fee, shows which payments are pending and helps send reminders to parents. Receipts are issued from the same system, so the school always has an up-to-date view of what has been collected and what is due.</p>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">Can fees be managed without an accountant?</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">Yes. Feezo is designed so a school office can handle fees, receipts and basic accounts without a separate accountant for daily entries.</p>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">How much does Feezo cost?</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">Every new school can start with a free 14-day trial before choosing a plan.</p>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">Is there a free trial?</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">Yes. You can start a 14-day free trial from the Feezo website. Create a school account, add your fee details and try the system with your own data before you decide.</p>
`);
}

function whyFeezoBody() {
  return seoShell(`
  <h1 style="margin:0;font-size:2rem">Why Schools Choose Feezo for Fee Collection and Accounts</h1>
  <p style="margin:1rem 0 0;color:#3f3f46">Collecting fees should not take over your school office. Feezo gives schools one simple system for fee collection, receipts, follow-ups and accounts, so staff spend less time on paperwork and management always knows where the money stands.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">The Monthly Fee Problem</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Every month, school offices repeat the same work. Parents pay late or forget the due date. Receipts are written by hand and sometimes lost. Payment records sit in registers, spreadsheets and phone messages, so nobody can say quickly which student has paid and which has not.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">How Feezo Fixes It</h2>
  <ul style="margin:0.75rem 0 0;padding-left:1.25rem">
    <li>Receipts are issued instantly and saved against each student.</li>
    <li>Reminder messages go to parents for pending fees.</li>
    <li>Pending fees are visible at a glance.</li>
    <li>Income, expenses and cash position sit on one dashboard.</li>
  </ul>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Who Feezo Is For</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">School owners and principals who want clear numbers. Office staff who want less manual work. Academies and institutes that collect fees every month and need reliable records.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Operated from Kerala</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Feezo is operated by MAC ADZ in Malappuram, Kerala. Our team is available to help your school get started.</p>
  <p style="margin:1.25rem 0 0">
    <a href="/signup/school">Start free 14-day trial</a> ·
    <a href="/contact">Book a demo</a> ·
    <a href="/product">Product</a> ·
    <a href="/features">Features</a> ·
    <a href="/pricing">Pricing</a>
  </p>
`);
}

function productBody() {
  return seoShell(`
  <h1 style="margin:0;font-size:2rem">Feezo: Mini ERP for School Fees and Accounts</h1>
  <p style="margin:1rem 0 0;color:#3f3f46">Feezo is a mini ERP for schools. It brings fee collection, online receipts, reports and day-to-day school accounts into one simple system, so your office does not depend on separate registers, spreadsheets and accounting software.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">What You Can Do With Feezo</h2>
  <ul style="margin:0.75rem 0 0;padding-left:1.25rem">
    <li>Record student fees and payments</li>
    <li>Issue online receipts</li>
    <li>Send fee follow-ups to parents</li>
    <li>Track pending fees</li>
    <li>See income, expenses and cash position</li>
  </ul>
  <p style="margin:0.75rem 0 0"><a href="/features">See all features</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">One System for Management and Office Staff</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Management sees income, expenses and cash position on one dashboard. Office staff record payments and issue receipts in a few steps, without keeping separate registers.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Web and Mobile App</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Use Feezo on the web and download the app from the App Store or Google Play. Check fee dues, view receipts and stay updated from your phone.</p>
  <p style="margin:0.5rem 0 0"><a href="/download">Download the Feezo app</a></p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Made for Schools and Academies</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Feezo suits schools and academies that collect fees every month. Start with a 14-day free trial or book a demo.</p>
`);
}

function featuresBody() {
  return seoShell(`
  <h1 style="margin:0;font-size:2rem">Feezo Features for School Fee Management</h1>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Online Fee Receipts</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Issue a digital receipt as soon as a payment is recorded. Receipts are saved against each student, so you can find, reprint or share them in seconds.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Fee Reminder Messages</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Send WhatsApp follow-ups to parents for pending fees without calling each one. Timely reminders reduce late payments and save staff hours every month.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Fee Due Tracking</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">See who has paid and who has pending fees at a glance. Spot late payers early and follow up before dues pile up at the month end.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Reports and School Accounts</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Track income, expenses and cash position on one dashboard. Management can check the numbers at any time, without waiting for month-end accounts.</p>
`);
}

function setupBody() {
  return seoShell(`
  <h1 style="margin:0;font-size:2rem">Set Up Feezo for Your School in Minutes</h1>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Four Steps to Start</h2>
  <ol style="margin:0.75rem 0 0;padding-left:1.25rem">
    <li style="margin:0.5rem 0"><strong>Create your school account.</strong> Sign up and start the 14-day free trial.</li>
    <li style="margin:0.5rem 0"><strong>Add your classes and students.</strong> Enter the details of the students whose fees you collect.</li>
    <li style="margin:0.5rem 0"><strong>Set up your fee structure.</strong> Add fee types and due dates for each class.</li>
    <li style="margin:0.5rem 0"><strong>Start collecting.</strong> Record payments, issue receipts and send reminders to parents.</li>
  </ol>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">What to Keep Ready</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">A student list, class details and your fee structure for the year.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Need Help Getting Started?</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Book a demo and our team in Malappuram will walk you through the setup step by step.</p>
  <p style="margin:1rem 0 0"><a href="/contact">Book a demo</a> · <a href="/signup/school">Start free 14-day trial</a></p>
`);
}

function pricingBody() {
  const planHtml = PLANS.map(
    (plan) => `
  <h3 style="margin:1.25rem 0 0;font-size:1.1rem">${esc(plan.name)} — ₹${plan.monthlyInr}/month or ₹${plan.annualInr}/year</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">${esc(plan.blurb)}</p>
  <ul style="margin:0.5rem 0 0;padding-left:1.25rem">
    ${plan.features.map((f) => `<li>${esc(f)}</li>`).join("\n    ")}
  </ul>
  <p style="margin:0.5rem 0 0"><a href="/signup/school">Start free 14-day trial</a></p>`,
  ).join("\n");

  return seoShell(`
  <h1 style="margin:0;font-size:2rem">Feezo Pricing: Start with a 14-Day Free Trial</h1>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Choose a Plan</h2>
  ${planHtml}
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Your 14-Day Free Trial</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Try Feezo with your own school data before you decide. No card is required to start. When the trial ends, choose a plan to keep your school workspace active.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Pricing Questions</h2>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">How does billing work?</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">Plans are billed in INR on a monthly or annual basis.</p>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">Can I change plans later?</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">Yes. You can move between Basic, Premium and Enterprise as your school grows.</p>
  <h3 style="margin:1rem 0 0;font-size:1.05rem">Do I need a card for the trial?</h3>
  <p style="margin:0.35rem 0 0;color:#3f3f46">No. You can start the 14-day free trial without entering a payment card.</p>
`);
}

function contactBody() {
  const wa = `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(WA_PREFILL)}`;
  return `
<main id="seo-content" style="max-width:40rem;margin:0 auto;padding:4.5rem 1.25rem 3rem;font-family:system-ui,sans-serif;color:#1a1c2c;line-height:1.5">
  <h1 style="margin:0;font-size:2rem">Contact Feezo</h1>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Book a Demo of Feezo</h2>
  <p style="margin:0.75rem 0 0;color:#3f3f46">Want to see how Feezo handles fee collection, receipts and school accounts? Book a demo, ask a question or get help with setup. Our team is based in Malappuram, Kerala.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Contact Details</h2>
  <address style="margin:1rem 0 0;font-style:normal">
    <strong>${esc(BRAND.operator)}</strong><br />
    ${esc(BRAND.registeredAddress)}
  </address>
  <ul style="margin:1.25rem 0 0;padding:0;list-style:none">
    <li style="margin:0.5rem 0"><a href="tel:${esc(BRAND.phoneE164)}">Phone: ${esc(BRAND.phoneDisplay)}</a></li>
    <li style="margin:0.5rem 0"><a href="mailto:${esc(BRAND.email)}">Email: ${esc(BRAND.email)}</a></li>
    <li style="margin:0.5rem 0"><a href="${esc(wa)}" rel="noopener" target="_blank">WhatsApp: ${esc(BRAND.whatsappDisplay)}</a></li>
  </ul>
  <p style="margin:1rem 0 0;font-size:0.9rem;color:#64748b">${esc(BRAND.hours)}. ${esc(BRAND.responseTime)}.</p>
  <h2 style="margin:2rem 0 0;font-size:1.25rem">Send Us a Message</h2>
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
  <h1 style="margin:0;font-size:1.75rem">Download the Feezo App for Schools and Parents</h1>
  <p style="margin:0.75rem 0 0;color:#64748B">Get the Feezo app on your phone to check fee dues, view receipts and stay updated. Download it from the App Store or Google Play and log in with your school details.</p>
  <h2 style="margin:1.5rem 0 0;font-size:1.15rem">What You Can Do in the Feezo App</h2>
  <ul style="margin:0.75rem 0 0;padding-left:1.25rem;text-align:left">
    <li>Check fee dues and payment status</li>
    <li>View and share fee receipts</li>
    <li>Stay updated on pending follow-ups</li>
    <li>Manage school fees and accounts on the go</li>
  </ul>
  <p style="margin:1.5rem 0 0;display:flex;flex-direction:column;gap:0.75rem;align-items:center">
    <a href="${esc(BRAND.appStoreUrl)}" rel="noopener" target="_blank">Download Feezo on the App Store</a>
    <a href="${esc(BRAND.playStoreUrl)}" rel="noopener" target="_blank">Get Feezo on Google Play</a>
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
      "var marketing = false;",
    );
}

function injectSeoBody(html, bodyHtml) {
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
        setTimeout(hideSeo, 8000);
      })();
    </script>`,
  );
}

function pageHtml(base, seo, bodyHtml, { stripBoot = true } = {}) {
  let html = patchHead(base, headTags(seo));
  if (stripBoot) html = stripBootShell(html);
  if (bodyHtml) html = injectSeoBody(html, bodyHtml);
  if (stripBoot) {
    html = html.replace('<html lang="en">', '<html lang="en" class="no-boot">');
  }
  return html;
}

function pageSeo(pathName, title, description, crumbName, extraLd = []) {
  const canonical = pathName === "/" ? `${SITE}/` : `${SITE}${pathName}`;
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    jsonLd: [
      organizationLd(),
      ...(pathName === "/"
        ? [softwareLd()]
        : [
            breadcrumbLd([
              { name: "Home", path: "/" },
              { name: crumbName, path: pathName },
            ]),
            ...extraLd,
          ]),
    ],
  };
}

const pages = {
  home: pageSeo(
    "/",
    "Feezo | School Management System with Fees Collection",
    "Feezo is a school management system and mini ERP for schools. Collect fees, issue online receipts and manage accounts. Try it free for 14 days.",
    "Home",
  ),
  whyFeezo: pageSeo(
    "/why-feezo",
    "Why Choose Feezo | Fee Collection & School Accounts",
    "See why schools choose Feezo to replace paper receipts, spreadsheets and manual follow-ups with one simple system for fees and school accounts.",
    "Why Feezo",
  ),
  product: pageSeo(
    "/product",
    "Feezo Product Overview | Mini ERP for Schools",
    "Feezo is a mini ERP for schools. See what is inside: fee collection, online receipts, reminders, reports and school accounts in one system.",
    "Product",
  ),
  features: pageSeo(
    "/features",
    "Fee Management Features for Schools | Feezo",
    "Explore Feezo features: online fee receipts, fee reminder messages, fee due tracking, reports and school accounts, all in one place.",
    "Features",
  ),
  setup: pageSeo(
    "/setup",
    "How to Set Up Feezo for Your School | Feezo",
    "Set up Feezo in four simple steps: create your account, add students, set fees and start collecting. Free for 14 days.",
    "Setup",
  ),
  pricing: pageSeo(
    "/pricing",
    "Feezo Pricing | Plans for Schools & Academies",
    "See Feezo plans for schools and academies and start with a free 14-day trial. Pick the plan that fits your school when you are ready.",
    "Pricing",
  ),
  download: pageSeo(
    "/download",
    "Feezo App Download | Student App for Schools & Parents",
    "Download the Feezo app, a student app for schools and parents. Check fee dues, get receipts and stay updated from your phone.",
    "Download",
  ),
  contact: pageSeo(
    "/contact",
    "Contact Feezo | School ERP Demo & Support in Kerala",
    "Talk to the Feezo team in Malappuram, Kerala. Book a demo of our school management system or ask about fee collection software and setup.",
    "Contact",
    [contactPageLd()],
  ),
};

async function writeRoute(base, routePath, seo, bodyHtml) {
  const dir = path.join(dist, routePath.replace(/^\//, ""));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), pageHtml(base, seo, bodyHtml), "utf8");
}

async function main() {
  const base = await readFile(path.join(dist, "index.html"), "utf8");

  // Home: keep boot shell, patch head, inject crawlable body for no-JS crawlers
  let homeHtml = pageHtml(base, pages.home, homeBody(), { stripBoot: false });
  homeHtml = homeHtml.replace(
    /var marketing = path === "\/" \|\| path === "\/home" \|\| path === "\/index\.html";/,
    'var marketing = path === "/" || path === "/index.html";',
  );
  await writeFile(path.join(dist, "index.html"), homeHtml, "utf8");

  await writeRoute(base, "/why-feezo", pages.whyFeezo, whyFeezoBody());
  await writeRoute(base, "/product", pages.product, productBody());
  await writeRoute(base, "/features", pages.features, featuresBody());
  await writeRoute(base, "/setup", pages.setup, setupBody());
  await writeRoute(base, "/pricing", pages.pricing, pricingBody());
  await writeRoute(base, "/contact", pages.contact, contactBody());
  await writeRoute(base, "/download", pages.download, downloadBody());

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
  await writeFile(path.join(dist, "not-found.html"), notFound, "utf8");
  await unlink(path.join(dist, "404.html")).catch(() => undefined);

  console.log(
    "Prerendered public pages: /, /why-feezo, /product, /features, /setup, /pricing, /contact, /download, not-found.html",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
