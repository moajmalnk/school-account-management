import type { PlanFlags } from "@/lib/permissions";

const IMG = {
  dashboard: "/marketing/product-dashboard.jpg",
  students: "/marketing/product-students.png",
  studentPayments: "/marketing/product-student-payments.png",
  staffProfile: "/marketing/product-staff-profile.png",
  setup: "/marketing/product-setup.png",
  subscriptions: "/marketing/product-subscriptions.png",
  support: "/marketing/product-support.png",
  accounts: "/marketing/accounts-one-place.jpg",
  miniErp: "/marketing/mini-erp.jpg",
  followUp: "/marketing/one-click-followup.jpg",
  digital: "/marketing/manual-to-digital.jpg",
} as const;

export type PlanFeatureStep = {
  title: string;
  body: string;
};

export type PlanFeatureImage = {
  src: string;
  caption: string;
};

export type PlanFeatureReference = {
  label: string;
  href: string;
  /** Optional Help Center guide id for deeper reading. */
  guideId?: string;
};

export type PlanFeatureDetail = {
  key: keyof PlanFlags;
  summary: string;
  flowTitle: string;
  mermaid: string;
  steps: PlanFeatureStep[];
  images: PlanFeatureImage[];
  references: PlanFeatureReference[];
};

export const PLAN_FEATURE_DETAILS: Record<keyof PlanFlags, PlanFeatureDetail> = {
  finance: {
    key: "finance",
    summary:
      "Run day-to-day school accounts in one place — receive fees, pay expenses, transfer funds, and keep ledgers balanced.",
    flowTitle: "Financial module flow",
    mermaid: `flowchart LR
      A[Open Finance] --> B[Receive or Make payment]
      B --> C[Pick ledger and amount]
      C --> D[Save voucher]
      D --> E[Day book and reports update]`,
    steps: [
      {
        title: "Open Finance",
        body: "Use the Finance menu for Receive payment, Make payment, Fund transfer, and ledgers.",
      },
      {
        title: "Record a voucher",
        body: "Choose the student or party, amount, mode, and ledger. Feezo posts the entry for you.",
      },
      {
        title: "Review reports",
        body: "Day book, ledger statements, and cash position stay in sync with every voucher.",
      },
    ],
    images: [
      { src: IMG.accounts, caption: "Accounts in one workspace" },
      { src: IMG.dashboard, caption: "Cash and dues on the dashboard" },
    ],
    references: [
      { label: "Receive a fee payment", href: "/tenant/finance?tab=receive", guideId: "receive-payment" },
      { label: "Make a payment", href: "/tenant/finance?tab=make", guideId: "make-payment" },
      { label: "Set up ledgers", href: "/tenant/finance?tab=ledgers", guideId: "ledgers-setup" },
    ],
  },
  students: {
    key: "students",
    summary:
      "Admit students, keep profiles current, track fee status, and share collection links with parents.",
    flowTitle: "Student management flow",
    mermaid: `flowchart LR
      A[Admit or import] --> B[Student profile]
      B --> C[Fees and status]
      C --> D[Collect or share link]
      D --> E[Parent updates profile]`,
    steps: [
      {
        title: "Admit or import",
        body: "Add one student from Admit, or import many from Excel / CSV.",
      },
      {
        title: "Maintain the profile",
        body: "Class, guardians, concessions, and documents live on the student profile.",
      },
      {
        title: "Collect fees",
        body: "Receive payment from the profile, or send a parent collection link.",
      },
    ],
    images: [
      { src: IMG.students, caption: "Student directory" },
      { src: IMG.studentPayments, caption: "Fee status on the profile" },
    ],
    references: [
      { label: "Admit a student", href: "/tenant/students/admit", guideId: "admit-student" },
      { label: "Open Students", href: "/tenant/students", guideId: "student-profile" },
      { label: "Import from Excel", href: "/tenant/students", guideId: "import-students" },
    ],
  },
  classes: {
    key: "classes",
    summary:
      "Define class tiers, sections, and fee schedules so every student bills against the right structure.",
    flowTitle: "Class management flow",
    mermaid: `flowchart LR
      A[Settings Class Tier] --> B[Add class and section]
      B --> C[Attach fee schedule]
      C --> D[Assign students]
      D --> E[Fees apply automatically]`,
    steps: [
      {
        title: "Create class tiers",
        body: "In Settings → Class Tier, add classes and sections for the academic year.",
      },
      {
        title: "Link fee schedules",
        body: "Attach fee categories so dues calculate correctly at admission and renewals.",
      },
      {
        title: "Assign students",
        body: "Place students in the right class; promotions move them year to year.",
      },
    ],
    images: [
      { src: IMG.setup, caption: "School setup and class structure" },
      { src: IMG.miniErp, caption: "Classes tied into the full school system" },
    ],
    references: [
      { label: "Class Tier settings", href: "/tenant/settings?tab=classes", guideId: "classes-fees" },
      { label: "Fee categories", href: "/tenant/settings?tab=fees", guideId: "classes-fees" },
    ],
  },
  staff: {
    key: "staff",
    summary:
      "Maintain staff profiles, departments, roles, and salary basics for your school team.",
    flowTitle: "Staff management flow",
    mermaid: `flowchart LR
      A[Add staff] --> B[Department and role]
      B --> C[Salary and docs]
      C --> D[Staff profile]
      D --> E[Payroll and attendance]`,
    steps: [
      {
        title: "Add a staff member",
        body: "Create the profile with contact details, joining date, and campus.",
      },
      {
        title: "Assign department and role",
        body: "Use Settings for departments and roles so permissions stay clear.",
      },
      {
        title: "Keep salary ready",
        body: "Set salary components so Make payment and payroll reports stay accurate.",
      },
    ],
    images: [
      { src: IMG.staffProfile, caption: "Staff profile" },
      { src: IMG.setup, caption: "Departments and roles setup" },
    ],
    references: [
      { label: "Open Staff", href: "/tenant/staff", guideId: "add-staff" },
      { label: "Departments & roles", href: "/tenant/settings?tab=departments", guideId: "departments-roles" },
      { label: "Salary setup", href: "/tenant/staff", guideId: "salary-setup" },
    ],
  },
  staffAttendance: {
    key: "staffAttendance",
    summary:
      "Mark daily staff attendance manually or from biometric devices, then review monthly summaries.",
    flowTitle: "Staff attendance flow",
    mermaid: `flowchart LR
      A[Open Attendance] --> B[Staff tab]
      B --> C[Mark day or sync device]
      C --> D[Save attendance]
      D --> E[Reports and payroll]`,
    steps: [
      {
        title: "Open Attendance → Staff",
        body: "Pick the date and campus, then mark Present, Absent, or Leave.",
      },
      {
        title: "Optional biometric sync",
        body: "Connect devices under Biometric so punches land in the same register.",
      },
      {
        title: "Use in payroll",
        body: "Attendance feeds salary and leave calculations when payroll is enabled.",
      },
    ],
    images: [
      { src: IMG.staffProfile, caption: "Staff linked to attendance" },
      { src: IMG.digital, caption: "From paper registers to digital marks" },
    ],
    references: [
      { label: "Staff attendance", href: "/tenant/attendance?tab=staff", guideId: "student-attendance" },
      { label: "Biometric devices", href: "/tenant/attendance?tab=biometric", guideId: "biometric-devices" },
    ],
  },
  studentAttendance: {
    key: "studentAttendance",
    summary:
      "Take class-wise student attendance, track absences, and keep parents informed.",
    flowTitle: "Student attendance flow",
    mermaid: `flowchart LR
      A[Open Attendance] --> B[Pick class and date]
      B --> C[Mark students]
      C --> D[Save register]
      D --> E[Parents see status]`,
    steps: [
      {
        title: "Choose class and date",
        body: "Open Attendance, select the class section and the school day.",
      },
      {
        title: "Mark the register",
        body: "Tap Present / Absent / Late for each student, then save.",
      },
      {
        title: "Follow up",
        body: "Absence history stays on the student profile and family app where enabled.",
      },
    ],
    images: [
      { src: IMG.students, caption: "Class roster for marking" },
      { src: IMG.digital, caption: "Digital attendance instead of paper" },
    ],
    references: [
      { label: "Student attendance", href: "/tenant/attendance", guideId: "student-attendance" },
      { label: "Open Students", href: "/tenant/students", guideId: "student-profile" },
    ],
  },
  payroll: {
    key: "payroll",
    summary:
      "Generate salary runs from staff pay components, deduct leave where configured, and pay from Finance.",
    flowTitle: "Automatic payroll flow",
    mermaid: `flowchart LR
      A[Salary setup] --> B[Attendance period]
      B --> C[Generate payroll]
      C --> D[Review sheet]
      D --> E[Pay from Finance]`,
    steps: [
      {
        title: "Complete salary setup",
        body: "Set basic pay and allowances on each staff profile first.",
      },
      {
        title: "Generate the run",
        body: "Create the payroll sheet for the month; Feezo applies attendance and leave rules.",
      },
      {
        title: "Pay out",
        body: "Settle salaries from Make payment so vouchers and salary reports stay aligned.",
      },
    ],
    images: [
      { src: IMG.staffProfile, caption: "Salary components on staff" },
      { src: IMG.accounts, caption: "Payments posted to accounts" },
    ],
    references: [
      { label: "Salary setup guide", href: "/tenant/staff", guideId: "salary-setup" },
      { label: "Salary report", href: "/tenant/finance?tab=salary", guideId: "salary-report" },
      { label: "Make payment", href: "/tenant/finance?tab=make", guideId: "make-payment" },
    ],
  },
  vehicle: {
    key: "vehicle",
    summary:
      "Register buses, drivers, documents, and routes — with reminders before insurance or fitness expires.",
    flowTitle: "Vehicle management flow",
    mermaid: `flowchart LR
      A[Add vehicle] --> B[Driver and capacity]
      B --> C[Documents and validity]
      C --> D[Routes and students]
      D --> E[Expiry reminders]`,
    steps: [
      {
        title: "Add each bus",
        body: "Settings → Bus Point → Vehicle Management: registration, seats, driver phone.",
      },
      {
        title: "Track documents",
        body: "Record insurance and fitness dates; Feezo reminds you before they expire.",
      },
      {
        title: "Assign routes",
        body: "Link students to routes so transport fees and pickups stay organised.",
      },
    ],
    images: [
      { src: IMG.setup, caption: "Transport and vehicle setup" },
      { src: IMG.miniErp, caption: "Vehicles inside school operations" },
    ],
    references: [
      { label: "Vehicle settings", href: "/tenant/settings?tab=vehicles", guideId: "transport" },
      { label: "Transport routes", href: "/tenant/settings?tab=transport", guideId: "transport" },
    ],
  },
  analytics: {
    key: "analytics",
    summary:
      "See collection trends, outstanding dues, and financial health beyond basic day-to-day vouchers.",
    flowTitle: "Analytics flow",
    mermaid: `flowchart LR
      A[Finance Analytics] --> B[Pick period]
      B --> C[Income vs expense]
      C --> D[Outstanding fees]
      D --> E[Act on insights]`,
    steps: [
      {
        title: "Open Analytics",
        body: "From Finance, open the analytics view for the campus and year in focus.",
      },
      {
        title: "Compare periods",
        body: "Review collections, expenses, and dues so you know what needs follow-up.",
      },
      {
        title: "Drill into detail",
        body: "Jump from a chart into day book or student dues when something looks off.",
      },
    ],
    images: [
      { src: IMG.dashboard, caption: "Overview metrics" },
      { src: IMG.accounts, caption: "Deep financial picture" },
    ],
    references: [
      { label: "Analytics guide", href: "/tenant/finance?tab=analytics", guideId: "analytics" },
      { label: "Fees report", href: "/tenant/finance?tab=fees", guideId: "fees-report" },
    ],
  },
  feeReminders: {
    key: "feeReminders",
    summary:
      "Send manual fee reminders to guardians for selected students — useful before due dates or after arrears build up.",
    flowTitle: "Manual fee reminder flow",
    mermaid: `flowchart LR
      A[Select students] --> B[Compose reminder]
      B --> C[Send via WhatsApp or share]
      C --> D[Guardian pays]
      D --> E[Mark collected]`,
    steps: [
      {
        title: "Select who owes",
        body: "From Students or Fees reports, choose the guardians who need a nudge.",
      },
      {
        title: "Send the reminder",
        body: "Use the bulk WhatsApp / share action with the due amount and period.",
      },
      {
        title: "Collect when they pay",
        body: "Receive payment or wait for online collection if that module is on.",
      },
    ],
    images: [
      { src: IMG.followUp, caption: "One-click follow-up with parents" },
      { src: IMG.studentPayments, caption: "Outstanding on the profile" },
    ],
    references: [
      { label: "WhatsApp guardians", href: "/tenant/students", guideId: "bulk-actions" },
      { label: "Fees report", href: "/tenant/finance?tab=fees", guideId: "fees-report" },
    ],
  },
  feeCollection: {
    key: "feeCollection",
    summary:
      "Collect school fees against schedules — counter payments, receipts, and student fee ledgers.",
    flowTitle: "Fee collection flow",
    mermaid: `flowchart LR
      A[Fee schedule] --> B[Student dues]
      B --> C[Receive payment]
      C --> D[Issue receipt]
      D --> E[Dues update]`,
    steps: [
      {
        title: "Configure fee categories",
        body: "Settings → Fee Category defines what you charge and when.",
      },
      {
        title: "Collect at the counter",
        body: "Receive payment against the student; Feezo allocates to due lines.",
      },
      {
        title: "Share the receipt",
        body: "Print or share the receipt; the student fee status refreshes immediately.",
      },
    ],
    images: [
      { src: IMG.studentPayments, caption: "Student fee collection" },
      { src: IMG.accounts, caption: "Receipts in the books" },
    ],
    references: [
      { label: "Receive payment", href: "/tenant/finance?tab=receive", guideId: "receive-payment" },
      { label: "Fee categories", href: "/tenant/settings?tab=fees", guideId: "classes-fees" },
      { label: "Fees report", href: "/tenant/finance?tab=fees", guideId: "fees-report" },
    ],
  },
  autoFeeCollection: {
    key: "autoFeeCollection",
    summary:
      "Let parents pay online against open dues — checkout links, gateways, and automatic receipting.",
    flowTitle: "Automatic fee collection flow",
    mermaid: `flowchart LR
      A[Enable online pay] --> B[Parent opens link]
      B --> C[Cashfree checkout]
      C --> D[Payment confirmed]
      D --> E[Receipt and dues clear]`,
    steps: [
      {
        title: "Turn on online payments",
        body: "Complete settlement / gateway setup so the school can accept cards and UPI.",
      },
      {
        title: "Share the pay link",
        body: "Parents open the family app or fee link for the selected dues.",
      },
      {
        title: "Auto-clear dues",
        body: "On success, Feezo posts the receipt and updates the student ledger.",
      },
    ],
    images: [
      { src: IMG.studentPayments, caption: "Online fee payment" },
      { src: IMG.followUp, caption: "Parents pay from a shared link" },
    ],
    references: [
      { label: "Parent pay guide", href: "/tenant/students", guideId: "parent-pay" },
      { label: "Enable online payment", href: "/tenant/settings?tab=support", guideId: "enable-online-payment" },
      { label: "Family / parent portal", href: "/tenant/students", guideId: "parent-portal" },
    ],
  },
  extraUsers: {
    key: "extraUsers",
    summary:
      "Invite extra school users with limited permissions — cashiers, accountants, or class teachers.",
    flowTitle: "Extra user access flow",
    mermaid: `flowchart LR
      A[Settings Users] --> B[Invite teammate]
      B --> C[Pick permissions]
      C --> D[They sign in]
      D --> E[Scoped workspace]`,
    steps: [
      {
        title: "Open Settings → Users",
        body: "Invite by email or create a login linked to a staff profile.",
      },
      {
        title: "Choose permissions",
        body: "Grant only the modules they need — finance views, students, or attendance.",
      },
      {
        title: "They sign in",
        body: "Teammates land on the first screen their role allows.",
      },
    ],
    images: [
      { src: IMG.setup, caption: "Users and access setup" },
      { src: IMG.support, caption: "Team collaboration in Feezo" },
    ],
    references: [
      { label: "Users settings", href: "/tenant/settings?tab=users", guideId: "team-users" },
      { label: "Google sign-in", href: "/tenant/settings?tab=users", guideId: "google-sign-in" },
    ],
  },
  whatsapp: {
    key: "whatsapp",
    summary:
      "Message guardians from Feezo — fee reminders, acknowledgements, and bulk follow-ups via WhatsApp.",
    flowTitle: "WhatsApp integration flow",
    mermaid: `flowchart LR
      A[Pick student or list] --> B[Choose message]
      B --> C[Open WhatsApp]
      C --> D[Guardian replies]
      D --> E[Collect or update]`,
    steps: [
      {
        title: "Select recipients",
        body: "From Students, use bulk actions or open a single guardian thread.",
      },
      {
        title: "Send the template",
        body: "Feezo opens WhatsApp with the drafted message and due context.",
      },
      {
        title: "Close the loop",
        body: "When they pay or reply, update the profile or receive the payment.",
      },
    ],
    images: [
      { src: IMG.followUp, caption: "WhatsApp follow-up" },
      { src: IMG.support, caption: "Parent communication" },
    ],
    references: [
      { label: "WhatsApp guardians", href: "/tenant/students", guideId: "bulk-actions" },
      { label: "WhatsApp not opening", href: "/tenant/students", guideId: "whatsapp-not-opening" },
    ],
  },
  branches: {
    key: "branches",
    summary:
      "Run multiple campuses under one school — switch campus in the top bar with separate books per branch.",
    flowTitle: "Multiple branches flow",
    mermaid: `flowchart LR
      A[Add campus] --> B[Switch in top bar]
      B --> C[Work in that campus]
      C --> D[Fees and staff scoped]
      D --> E[Org-wide subscription]`,
    steps: [
      {
        title: "Add campuses",
        body: "Settings → Branches: create Main Campus and any additional sites.",
      },
      {
        title: "Switch context",
        body: "Use the campus control in the top bar before admitting students or collecting fees.",
      },
      {
        title: "Keep books separate",
        body: "Vouchers and students stay on the campus that was active when you saved them.",
      },
    ],
    images: [
      { src: IMG.setup, caption: "Branch setup" },
      { src: IMG.dashboard, caption: "Campus-aware overview" },
    ],
    references: [
      { label: "Branches settings", href: "/tenant/settings?tab=branches", guideId: "branches" },
      { label: "Switch campus or year", href: "/tenant/dashboard", guideId: "switch-campus-year" },
    ],
  },
  globalSearch: {
    key: "globalSearch",
    summary:
      "Search the workspace from the top bar — jump to students, staff, settings, and actions in one keystroke.",
    flowTitle: "Global search flow",
    mermaid: `flowchart LR
      A[Open search] --> B[Type name or action]
      B --> C[Pick a result]
      C --> D[Land on the screen]
      D --> E[Continue work]`,
    steps: [
      {
        title: "Open search",
        body: "Use the Search workspace field in the top bar.",
      },
      {
        title: "Type what you need",
        body: "Student names, staff, settings tabs, or common actions appear as you type.",
      },
      {
        title: "Jump straight there",
        body: "Enter opens the selected result — no digging through menus.",
      },
    ],
    images: [
      { src: IMG.dashboard, caption: "Search from the workspace chrome" },
      { src: IMG.miniErp, caption: "Find anything across modules" },
    ],
    references: [
      { label: "Workspace tour", href: "/tenant/dashboard", guideId: "workspace-tour" },
      { label: "Open Dashboard", href: "/tenant/dashboard" },
    ],
  },
  exams: {
    key: "exams",
    summary:
      "Set up exams, enter marks, and share report cards with families from Academics.",
    flowTitle: "Exam grading flow",
    mermaid: `flowchart LR
      A[Academics setup] --> B[Create exam]
      B --> C[Enter marks]
      C --> D[Publish results]
      D --> E[Family report card]`,
    steps: [
      {
        title: "Configure academics",
        body: "Settings → Academics defines terms and exam structures for the year.",
      },
      {
        title: "Enter marks",
        body: "Teachers or admins record scores per subject and class.",
      },
      {
        title: "Share results",
        body: "Publish so the family app can show the report card where enabled.",
      },
    ],
    images: [
      { src: IMG.students, caption: "Class linked to exams" },
      { src: IMG.setup, caption: "Academics configuration" },
    ],
    references: [
      { label: "Academics settings", href: "/tenant/settings?tab=academics" },
      { label: "Parent portal", href: "/tenant/students", guideId: "parent-portal" },
    ],
  },
  backup: {
    key: "backup",
    summary:
      "Export an encrypted ZIP of your school data and optionally schedule daily or weekly uploads to Google Drive or OneDrive.",
    flowTitle: "Cloud backup flow",
    mermaid: `flowchart LR
      A[Settings Backup] --> B[Set passphrase]
      B --> C[Create backup or schedule]
      C --> D[Encrypted ZIP]
      D --> E[Download or Drive upload]`,
    steps: [
      {
        title: "Open Backup",
        body: "Go to Settings → Backup. Set a recovery passphrase before the first export.",
      },
      {
        title: "Manual or scheduled",
        body: "Create a backup now for download, or choose daily/weekly and connect Google Drive or OneDrive.",
      },
      {
        title: "Keep the passphrase",
        body: "The ZIP is password-protected. Store the passphrase offline — in-app restore is not available yet.",
      },
    ],
    images: [
      { src: IMG.setup, caption: "School settings workspace" },
      { src: IMG.subscriptions, caption: "Plan features include Cloud Backup" },
    ],
    references: [
      { label: "Open Backup settings", href: "/tenant/settings?tab=backup", guideId: "cloud-backup" },
      { label: "Backup help guide", href: "/tenant/support?guide=cloud-backup", guideId: "cloud-backup" },
      { label: "Subscription", href: "/tenant/settings?tab=subscription" },
    ],
  },
};

export function getPlanFeatureDetail(key: keyof PlanFlags): PlanFeatureDetail {
  return PLAN_FEATURE_DETAILS[key];
}
