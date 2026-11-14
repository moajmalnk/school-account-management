/** Indexable marketing page copy for feezo.app — English only. */

export const MARKETING_NAV = [
  { path: "/why-feezo", label: "Why Feezo", hint: "Stop chasing paper registers" },
  { path: "/product", label: "Product", hint: "Dashboard, students & fees" },
  { path: "/features", label: "Features", hint: "Everything in one workspace" },
  { path: "/setup", label: "Setup", hint: "Live in minutes, not weeks" },
  { path: "/pricing", label: "Pricing", hint: "14-day free trial included" },
] as const;

export type MarketingNavPath = (typeof MARKETING_NAV)[number]["path"];

/** Old homepage hash → new page (for bookmarks and shared links). */
export const LEGACY_HASH_REDIRECTS: Record<string, MarketingNavPath> = {
  problems: "/why-feezo",
  product: "/product",
  features: "/features",
  setup: "/setup",
  pricing: "/pricing",
};

export const HOME_PAGE = {
  title: "Feezo | School Management System with Fees Collection",
  description:
    "Feezo is a school management system and mini ERP for schools. Collect fees, issue online receipts and manage accounts. Try it free for 14 days.",
  eyebrow: "Welcome To Feezo",
  h1: "School Management System for Fees, Receipts & Accounts",
  tagline: "School accounts simplified",
  intro:
    "Feezo is a school management system and mini ERP for schools. Collect fees, issue online receipts, send follow-ups and manage school accounts in one place, with no accounting staff needed.",
  primaryCta: "Start free 14-day trial",
  secondaryCta: "Book a demo",
  tertiaryCta: "Download the app",
  heroImageAlt:
    "Feezo school management system dashboard showing fee income, expenses and cash position",
  sections: {
    whyFeezo: {
      id: "why-feezo",
      h2: "Fee Collection Problems Schools Face Every Month",
      body: "Late payments, handwritten receipts and scattered records make fee collection a monthly struggle. Staff chase parents one by one, and accounts are matched by hand at the month end. Feezo replaces this routine with one simple system for fees, receipts and follow-ups, so nothing slips through.",
      linkLabel: "See why schools choose Feezo",
      href: "/why-feezo",
    },
    product: {
      id: "product-overview",
      h2: "Feezo: ERP for Schools That Runs Fees and Accounts",
      body: "Feezo is a mini ERP for schools. It brings fee collection, online receipts, reports and day-to-day school accounts into one simple system, so your office does not depend on separate registers, spreadsheets and accounting software. Management sees income, expenses and cash position on one dashboard.",
      linkLabel: "Explore the Feezo product overview",
      href: "/product",
    },
    features: {
      id: "features-overview",
      h2: "School Management Software Features: Fees, Receipts, Reminders & Reports",
      items: [
        {
          h3: "Online Fee Receipts",
          body: "Issue a digital receipt as soon as a payment is recorded and find it in seconds.",
        },
        {
          h3: "Fee Reminder Messages for Students and Parents",
          body: "Send follow-ups for pending fees without calling each parent.",
        },
        {
          h3: "Fee Due Tracking",
          body: "See who has paid and who has pending fees at a glance.",
        },
        {
          h3: "Reports and School Accounts",
          body: "Track income, expenses and cash position on one dashboard.",
        },
      ],
      linkLabel: "See all features",
      href: "/features",
    },
    setup: {
      id: "setup-overview",
      h2: "Set Up Your School Management System in Minutes",
      body: "Create your school account, add your students, set up your fee structure and start collecting. Most schools can finish setup in a single sitting, and you do not need accounting knowledge to begin. Not sure where to start? Book a demo and our team will walk you through it.",
      linkLabel: "See the four setup steps",
      href: "/setup",
    },
    pricing: {
      id: "pricing-overview",
      h2: "Feezo Pricing: Start a 14-Day Free Trial",
      body: "Try Feezo free for 14 days with your own school data, then choose the plan that fits your school. Compare plans, see what is included and start your free trial today.",
      linkLabel: "Compare Feezo plans",
      href: "/pricing",
    },
    faq: {
      id: "faq",
      h2: "Frequently Asked Questions About School Management Software",
      items: [
        {
          q: "What is a school management system?",
          a: "A school management system is software that helps a school run daily administration in one place, such as fees, student records, receipts and accounts. Feezo focuses first on fee collection and school accounts, the work that takes most office time.",
        },
        {
          q: "How does Feezo help track pending fees?",
          a: "Feezo keeps a record of every fee, shows which payments are pending and helps send reminders to parents. Receipts are issued from the same system, so the school always has an up-to-date view of what has been collected and what is due.",
        },
        {
          q: "Can fees be managed without an accountant?",
          a: "Yes. Feezo is designed so a school office can handle fees, receipts and basic accounts without a separate accountant for daily entries. Schools that already have an accountant can use the reports to save time.",
        },
        {
          q: "How much does Feezo cost?",
          a: "Every new school can start with a free 14-day trial before choosing a plan.",
        },
        {
          q: "Is there a free trial?",
          a: "Yes. You can start a 14-day free trial from the Feezo website. Create a school account, add your fee details and try the system with your own data before you decide.",
        },
      ],
    },
  },
} as const;

export const WHY_FEEZO_PAGE = {
  title: "Why Choose Feezo | Fee Collection & School Accounts",
  description:
    "See why schools choose Feezo to replace paper receipts, spreadsheets and manual follow-ups with one simple system for fees and school accounts.",
  h1: "Why Schools Choose Feezo for Fee Collection and Accounts",
  intro:
    "Collecting fees should not take over your school office. Feezo gives schools one simple system for fee collection, receipts, follow-ups and accounts, so staff spend less time on paperwork and management always knows where the money stands.",
  monthlyProblem: {
    h2: "The Monthly Fee Problem",
    body: "Every month, school offices repeat the same work. Parents pay late or forget the due date. Receipts are written by hand and sometimes lost. Payment records sit in registers, spreadsheets and phone messages, so nobody can say quickly which student has paid and which has not. Following up means calling parents one by one, and month-end accounts have to be matched by hand. Many schools also pay an accountant just to keep these records straight.",
  },
  howFeezoFixes: {
    h2: "How Feezo Fixes It",
    items: [
      "Receipts are issued instantly and saved against each student.",
      "Reminder messages go to parents for pending fees.",
      "Pending fees are visible at a glance.",
      "Income, expenses and cash position sit on one dashboard.",
    ],
  },
  whoFor: {
    h2: "Who Feezo Is For",
    body: "School owners and principals who want clear numbers. Office staff who want less manual work. Academies and institutes that collect fees every month and need reliable records.",
  },
  operatedFrom: {
    h2: "Operated from Kerala",
    body: "Feezo is operated by MAC ADZ in Malappuram, Kerala. Our team is available to help your school get started.",
  },
} as const;

export const PRODUCT_PAGE = {
  title: "Feezo Product Overview | Mini ERP for Schools",
  description:
    "Feezo is a mini ERP for schools. See what is inside: fee collection, online receipts, reminders, reports and school accounts in one system.",
  h1: "Feezo: Mini ERP for School Fees and Accounts",
  intro:
    "Feezo is a mini ERP for schools. It brings fee collection, online receipts, reports and day-to-day school accounts into one simple system, so your office does not depend on separate registers, spreadsheets and accounting software.",
  whatYouCanDo: {
    h2: "What You Can Do With Feezo",
    items: [
      "Record student fees and payments",
      "Issue online receipts",
      "Send fee follow-ups to parents",
      "Track pending fees",
      "See income, expenses and cash position",
    ],
  },
  oneSystem: {
    h2: "One System for Management and Office Staff",
    body: "Management sees income, expenses and cash position on one dashboard. Office staff record payments and issue receipts in a few steps, without keeping separate registers.",
  },
  webAndMobile: {
    h2: "Web and Mobile App",
    body: "Use Feezo on the web and download the app from the App Store or Google Play. Check fee dues, view receipts and stay updated from your phone.",
  },
  madeFor: {
    h2: "Made for Schools and Academies",
    body: "Feezo suits schools and academies that collect fees every month. Start with a 14-day free trial or book a demo.",
  },
} as const;

export const FEATURES_PAGE = {
  title: "Fee Management Features for Schools | Feezo",
  description:
    "Explore Feezo features: online fee receipts, fee reminder messages, fee due tracking, reports and school accounts, all in one place.",
  h1: "Feezo Features for School Fee Management",
  features: [
    {
      h2: "Online Fee Receipts",
      body: "Issue a digital receipt as soon as a payment is recorded. Receipts are saved against each student, so you can find, reprint or share them in seconds. Parents get clear proof of payment and the office keeps a clean record.",
    },
    {
      h2: "Fee Reminder Messages",
      body: "Send WhatsApp follow-ups to parents for pending fees without calling each one. Timely reminders reduce late payments and save staff hours every month.",
    },
    {
      h2: "Fee Due Tracking",
      body: "See who has paid and who has pending fees at a glance. Spot late payers early and follow up before dues pile up at the month end.",
    },
    {
      h2: "Reports and School Accounts",
      body: "Track income, expenses and cash position on one dashboard. Management can check the numbers at any time, without waiting for month-end accounts.",
    },
  ],
} as const;

export const SETUP_PAGE = {
  title: "How to Set Up Feezo for Your School | Feezo",
  description:
    "Set up Feezo in four simple steps: create your account, add students, set fees and start collecting. Free for 14 days.",
  h1: "Set Up Feezo for Your School in Minutes",
  steps: {
    h2: "Four Steps to Start",
    items: [
      {
        title: "Create your school account",
        body: "Sign up and start the 14-day free trial.",
      },
      {
        title: "Add your classes and students",
        body: "Enter the details of the students whose fees you collect.",
      },
      {
        title: "Set up your fee structure",
        body: "Add fee types and due dates for each class.",
      },
      {
        title: "Start collecting",
        body: "Record payments, issue receipts and send reminders to parents.",
      },
    ],
  },
  keepReady: {
    h2: "What to Keep Ready",
    body: "A student list, class details and your fee structure for the year.",
  },
  needHelp: {
    h2: "Need Help Getting Started?",
    body: "Book a demo and our team in Malappuram will walk you through the setup step by step.",
  },
} as const;

export const PRICING_PAGE = {
  title: "Feezo Pricing | Plans for Schools & Academies",
  description:
    "See Feezo plans for schools and academies and start with a free 14-day trial. Pick the plan that fits your school when you are ready.",
  h1: "Feezo Pricing: Start with a 14-Day Free Trial",
  choosePlan: {
    h2: "Choose a Plan",
  },
  trial: {
    h2: "Your 14-Day Free Trial",
    body: "Try Feezo with your own school data before you decide. No card is required to start. When the trial ends, choose a plan to keep your school workspace active.",
  },
  questions: {
    h2: "Pricing Questions",
    items: [
      {
        q: "How does billing work?",
        a: "Plans are billed in INR on a monthly or annual basis. Prices shown in other currencies on the site are approximate for display only.",
      },
      {
        q: "Can I change plans later?",
        a: "Yes. You can move between Basic, Premium and Enterprise as your school grows. Contact the Feezo team if you need help switching.",
      },
      {
        q: "What is included in every plan?",
        a: "Every plan includes a full 14-day evaluation period so you can try Feezo with your own students, fees and receipts before you subscribe.",
      },
      {
        q: "Do I need a card for the trial?",
        a: "No. You can start the 14-day free trial without entering a payment card.",
      },
    ],
  },
} as const;

export const CONTACT_PAGE_SEO = {
  title: "Contact Feezo | School ERP Demo & Support in Kerala",
  description:
    "Talk to the Feezo team in Malappuram, Kerala. Book a demo of our school management system or ask about fee collection software and setup.",
  h1: "Contact Feezo",
  bookDemo: {
    h2: "Book a Demo of Feezo",
    body: "Want to see how Feezo handles fee collection, receipts and school accounts? Book a demo, ask a question or get help with setup. Our team is based in Malappuram, Kerala.",
  },
  details: {
    h2: "Contact Details",
  },
  form: {
    h2: "Send Us a Message",
  },
} as const;

export const DOWNLOAD_PAGE = {
  title: "Feezo App Download | Student App for Schools & Parents",
  description:
    "Download the Feezo app, a student app for schools and parents. Check fee dues, get receipts and stay updated from your phone.",
  h1: "Download the Feezo App for Schools and Parents",
  intro:
    "Get the Feezo app on your phone to check fee dues, view receipts and stay updated. Download it from the App Store or Google Play and log in with your school details.",
  whatYouCanDo: {
    h2: "What You Can Do in the Feezo App",
    items: [
      "Check fee dues and payment status",
      "View and share fee receipts",
      "Stay updated on pending follow-ups",
      "Manage school fees and accounts on the go",
    ],
  },
} as const;

export const SIGNUP_PAGE_SEO = {
  title: "Start Your 14-Day Free Trial | Feezo",
  description:
    "Create your school account and start a 14-day free trial of Feezo. Collect fees and manage accounts in minutes.",
  h1: "Start Your 14-Day Free Trial",
  reassurance: "No card required. Set up your school and try Feezo with your own data for 14 days.",
} as const;
