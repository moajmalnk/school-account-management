import type { FinanceViewKey, PermissionKey, SettingsTabId } from "@/lib/permissions";

export type HelpCategoryId =
  | "start"
  | "students"
  | "staff"
  | "finance"
  | "reports"
  | "settings"
  | "subscription";

export type HelpCategory = {
  id: HelpCategoryId;
  title: string;
  description: string;
};

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: "start", title: "Getting started", description: "Find your way around in five minutes" },
  { id: "students", title: "Students", description: "Admissions, profiles and follow-ups" },
  { id: "staff", title: "Staff", description: "Team, roles, salary and leave" },
  { id: "finance", title: "Finance", description: "Receipts, payments, transfers and books" },
  { id: "reports", title: "Reports", description: "Ledgers, P&L, balance sheet and exports" },
  { id: "settings", title: "Settings", description: "School profile, classes, fees and users" },
  { id: "subscription", title: "Subscription", description: "Plan, renewal and invoices" },
];

/** Who can open the screen a guide describes. Unset = everyone. */
export type HelpAccess =
  | { kind: "permission"; key: PermissionKey }
  | { kind: "finance"; view?: FinanceViewKey }
  | { kind: "settings"; tab?: SettingsTabId };

export type HelpStep = {
  title: string;
  body: string;
  image?: string;
  tip?: string;
};

export type HelpGuide = {
  id: string;
  category: HelpCategoryId;
  title: string;
  summary: string;
  minutes: number;
  access?: HelpAccess;
  keywords: string[];
  steps: HelpStep[];
  openTo?: { href: string; label: string };
  warning?: string;
  related?: string[];
};

/**
 * YouTube video ids per guide. Add a recording by adding one line here,
 * e.g. `"receive-payment": "dQw4w9WgXcQ"`.
 */
export const HELP_VIDEOS: Partial<Record<string, string>> = {};

const IMG = {
  dashboard: "/marketing/product-dashboard.jpg",
  students: "/marketing/product-students.png",
  studentPayments: "/marketing/product-student-payments.png",
  staffProfile: "/marketing/product-staff-profile.png",
  setup: "/marketing/product-setup.png",
  subscriptions: "/marketing/product-subscriptions.png",
  support: "/marketing/product-support.png",
} as const;

export const HELP_GUIDES: HelpGuide[] = [
  /* ------------------------------ Getting started ----------------------------- */
  {
    id: "workspace-tour",
    category: "start",
    title: "Tour of your workspace",
    summary: "What every menu does and where to find things.",
    minutes: 3,
    keywords: ["tour", "menu", "navigation", "dashboard", "home", "overview", "start"],
    openTo: { href: "/tenant/dashboard", label: "Open Dashboard" },
    steps: [
      {
        title: "The Dashboard is your home",
        body: "School Overview shows total students and staff. Financial Summary shows this month's income and expenses. Cash Position shows cash in hand and bank balance. Outstanding Payments shows fees still due.",
        image: IMG.dashboard,
      },
      {
        title: "Use the menu to move between modules",
        body: "Dashboard, Students, Staff, Finance, Support, Subscription and Settings. On a phone the same menu sits at the bottom of the screen.",
      },
      {
        title: "Quick actions on the Dashboard",
        body: "Tap Receive payment to collect a fee, Make payment to pay salaries or expenses, and Admit a Student to add a new admission. The To do list and Notes are private reminders for you.",
      },
      {
        title: "The top bar",
        body: "The campus name (for example Main Campus) and the green academic year chip tell you which books you are working in. The bell opens notifications, and the sparkle button opens the Feezo AI assistant.",
        tip: "If numbers look wrong, first check the campus and academic year in the top bar.",
      },
    ],
    related: ["switch-campus-year", "ai-assistant", "appearance"],
  },
  {
    id: "switch-campus-year",
    category: "start",
    title: "Switch campus or academic year",
    summary: "Open another branch's books or last year's records.",
    minutes: 1,
    keywords: ["campus", "branch", "academic year", "financial year", "switch", "books", "AY"],
    steps: [
      {
        title: "Switch campus",
        body: "Tap the campus name in the top bar and pick another branch. Students, receipts and reports reload for that campus.",
      },
      {
        title: "Switch academic year",
        body: "Tap the green year chip (for example AY 2026-27) and choose another year. Feezo shows how many receipts and enrolled students that year has.",
      },
      {
        title: "Reopen a closed year",
        body: "Closed years appear under Closed years in the same menu. Choose “reopen” only if you need to correct something in that year.",
        tip: "Every receipt and payment is saved into the campus and year shown in the top bar, so check them before recording.",
      },
    ],
    related: ["academic-year", "branches"],
  },
  {
    id: "appearance",
    category: "start",
    title: "Dark mode, colours and menu position",
    summary: "Make the workspace look and feel the way you like.",
    minutes: 2,
    access: { kind: "settings", tab: "system" },
    keywords: ["dark mode", "theme", "color", "colour", "font", "menu position", "layout", "brand"],
    openTo: { href: "/tenant/settings?tab=system", label: "Open System settings" },
    steps: [
      {
        title: "Toggle dark mode",
        body: "Use the moon / sun button in the top bar to switch between light and dark.",
      },
      {
        title: "Brand colours",
        body: "Settings → System → Colors. Pick Primary and Secondary colours or tap a preset. These colours are used on receipts and invoices too.",
      },
      {
        title: "Text and layout",
        body: "In the same page choose font, font size, density and where the navigation sits (Left, Right, Top or Bottom).",
      },
    ],
    related: ["school-profile"],
  },
  {
    id: "mobile-app",
    category: "start",
    title: "Use Feezo on your phone",
    summary: "Install the Android or iPhone app and sign in with the same account.",
    minutes: 2,
    keywords: ["mobile", "app", "android", "iphone", "ios", "play store", "app store", "install"],
    steps: [
      {
        title: "Download the app",
        body: "Search “Feezo” on Google Play or the App Store, or use the links below this guide.",
      },
      {
        title: "Sign in",
        body: "Use the same email and password you use on the web. Your data is the same everywhere.",
      },
      {
        title: "Collect fees on the go",
        body: "Open Finance → Receive payment on the phone to issue a receipt and share it on WhatsApp straight away.",
      },
    ],
    related: ["receive-payment"],
  },
  {
    id: "ai-assistant",
    category: "start",
    title: "Ask the Feezo AI assistant",
    summary: "Get answers and open screens by just asking.",
    minutes: 1,
    keywords: ["ai", "assistant", "chat", "ask", "feezo ai", "help", "question"],
    steps: [
      {
        title: "Open the assistant",
        body: "Tap the sparkle button. It asks “How can I help today?”.",
      },
      {
        title: "Ask in plain words",
        body: "Try “What is our current financial status?”, “Show overdue fee students” or “Open fees report”. It can also open the right screen for you.",
      },
      {
        title: "Ask how to do something",
        body: "Ask “How do I collect a fee?” and it can open the matching guide on this Support page.",
      },
    ],
    related: ["workspace-tour"],
  },

  /* --------------------------------- Students -------------------------------- */
  {
    id: "admit-student",
    category: "students",
    title: "Admit a new student",
    summary: "Add a student to the open academic year in under a minute.",
    minutes: 2,
    access: { kind: "permission", key: "students" },
    keywords: ["admit", "admission", "new student", "add student", "enroll", "register"],
    openTo: { href: "/tenant/students/admit", label: "Open Admit Student" },
    steps: [
      {
        title: "Open the admission form",
        body: "Go to Students and tap Admit Student (or Admit a Student on the Dashboard).",
        image: IMG.students,
      },
      {
        title: "Fill the basics",
        body: "Full Name, Class and Guardian Name are required. Add a contact phone so you can send receipts and reminders on WhatsApp.",
        tip: "Class missing from the list? Choose “Add new class” inside the class picker to create it without leaving the form.",
      },
      {
        title: "Add a concession if needed",
        body: "Turn on Fee concession to give a discount for this student. It reduces what they owe for the year.",
      },
      {
        title: "Save",
        body: "Tap Admit Student to save. Tap Admit & Collect instead to save and get a link you can send to the parent to fill in the remaining details.",
      },
    ],
    related: ["student-profile", "import-students", "concessions"],
  },
  {
    id: "import-students",
    category: "students",
    title: "Import many students from Excel / CSV",
    summary: "Move your existing student list in one go.",
    minutes: 5,
    access: { kind: "permission", key: "students" },
    keywords: ["import", "csv", "excel", "bulk", "upload", "template", "migrate"],
    openTo: { href: "/tenant/students", label: "Open Students" },
    steps: [
      {
        title: "Download the template",
        body: "Students → Import → Download template. Open it in Excel or Google Sheets.",
      },
      {
        title: "Fill one student per row",
        body: "Keep the column headings unchanged. Put the class (e.g. 1, UKG) and division (A, B) in separate columns. Optional columns: Mother Name, Date of Birth, Gender, Address, Pin code, Email, Admission No.",
      },
      {
        title: "Upload",
        body: "Students → Import / Export → Upload Excel / CSV. You can upload the .xlsx file directly (first sheet is used) or a CSV.",
        tip: "Duplicates and unreadable rows are skipped, so you can safely upload the same file again after fixing it. If a broken upload ever created strange class names, Settings → Class Tier shows a one-click cleanup.",
      },
    ],
    related: ["admit-student", "classes-fees"],
  },
  {
    id: "student-profile",
    category: "students",
    title: "Student profile, fee status and edits",
    summary: "See what a student has paid and owes, and update details.",
    minutes: 2,
    access: { kind: "permission", key: "students" },
    keywords: ["profile", "edit student", "fee status", "due", "overdue", "paid", "class change"],
    openTo: { href: "/tenant/students", label: "Open Students" },
    steps: [
      {
        title: "Find the student",
        body: "In Students Directory, search by name, ID, guardian or phone, or filter by class and division. Tap the student to open their profile.",
      },
      {
        title: "Check fees",
        body: "The Payments tab shows Total Fee, Total Paid and Total Due, plus every installment with its status. Download report for parents gives a printable statement.",
        image: IMG.studentPayments,
      },
      {
        title: "Collect from the profile",
        body: "Tap Collect to open Receive payment with the student already selected.",
      },
      {
        title: "Edit details",
        body: "Tap Edit Profile to change name, class, guardian, bus point or documents. Use the Documents tab to keep ID copies and certificates.",
      },
    ],
    related: ["receive-payment", "bulk-actions"],
  },
  {
    id: "bulk-actions",
    category: "students",
    title: "WhatsApp guardians and bulk actions",
    summary: "Send reminders, change class or status for many students at once.",
    minutes: 2,
    access: { kind: "permission", key: "students" },
    keywords: [
      "whatsapp",
      "reminder",
      "bulk",
      "promote",
      "change class",
      "follow up",
      "message",
      "status",
    ],
    openTo: { href: "/tenant/students", label: "Open Students" },
    steps: [
      {
        title: "Message one guardian",
        body: "Each row has WhatsApp and call buttons next to the guardian's number.",
      },
      {
        title: "Select many students",
        body: "Tick the boxes, or use Select all shown, Select overdue or Select paid.",
      },
      {
        title: "Choose an action",
        body: "Bulk WhatsApp sends one message to every selected guardian. Change Class moves them to another class (for example at promotion time). Change Status sets them Active or Inactive.",
        tip: "Use Select overdue + Bulk WhatsApp for a one-click fee reminder.",
      },
      {
        title: "Deleted by mistake?",
        body: "Deleted students go to the Recycle Bin, where you can restore them.",
      },
    ],
    related: ["student-profile", "fees-report"],
  },

  /* ---------------------------------- Staff ---------------------------------- */
  {
    id: "add-staff",
    category: "staff",
    title: "Add a staff member",
    summary: "Create a teacher or office staff profile.",
    minutes: 2,
    access: { kind: "permission", key: "staff" },
    keywords: ["staff", "teacher", "employee", "recruit", "add staff", "hire"],
    openTo: { href: "/tenant/staff", label: "Open Staff" },
    steps: [
      {
        title: "Open Recruit",
        body: "Go to Staff and tap Recruit.",
      },
      {
        title: "Fill the details",
        body: "Enter Full Name, Role, Department and Phone. Leave Employee ID empty to auto-generate one. A profile photo is optional.",
        tip: "Role or department missing? Choose “Add new role” / “Add new department” inside the picker.",
      },
      {
        title: "Save",
        body: "Tap Recruit Staff. The person now appears in the staff list and can be picked for salary payments.",
      },
    ],
    related: ["salary-setup", "departments-roles", "team-users"],
  },
  {
    id: "departments-roles",
    category: "staff",
    title: "Departments and positions",
    summary: "Group staff so reports and payroll stay organised.",
    minutes: 2,
    access: { kind: "settings", tab: "departments" },
    keywords: ["department", "role", "position", "designation"],
    openTo: { href: "/tenant/settings?tab=departments", label: "Open Departments" },
    steps: [
      {
        title: "Open Class Tier settings",
        body: "Settings → Class Tier holds Classes, Departments and Positions.",
      },
      {
        title: "Add departments",
        body: "Under Departments tap add and name it (for example Primary, Accounts, Transport).",
      },
      {
        title: "Add positions",
        body: "Under Positions add titles such as Teacher, Accountant or Driver. They appear in the Role picker when you add staff.",
      },
    ],
    related: ["add-staff"],
  },
  {
    id: "salary-setup",
    category: "staff",
    title: "Set salary and pay staff",
    summary: "Record basic salary once, then pay every month in a few taps.",
    minutes: 3,
    access: { kind: "finance", view: "make" },
    keywords: ["salary", "payroll", "pay staff", "basic salary", "attendance", "hold salary"],
    openTo: { href: "/tenant/finance?tab=make", label: "Open Make Payment" },
    steps: [
      {
        title: "Set the salary",
        body: "Open the staff member's profile → Professional tab → Payroll Structure and enter the Basic Salary.",
        image: IMG.staffProfile,
      },
      {
        title: "Pay the salary",
        body: "Finance → Make payment → Payee Type: Salary. Choose the staff member and Salary month. Days Present, Paid Leave and Unpaid Leave adjust the amount automatically.",
      },
      {
        title: "Pay now or hold",
        body: "Confirm Payment, then choose Pay Now (money has gone out) or Hold (salary is owed but not yet paid).",
        tip: "Held salaries show as Salary Outstanding on the Dashboard until you pay them.",
      },
    ],
    related: ["make-payment", "salary-report", "leave-types"],
  },
  {
    id: "leave-types",
    category: "staff",
    title: "Leave types",
    summary: "Define paid and unpaid leave used in salary runs.",
    minutes: 1,
    access: { kind: "settings", tab: "leave" },
    keywords: ["leave", "holiday", "absence", "paid leave", "unpaid leave"],
    openTo: { href: "/tenant/settings?tab=leave", label: "Open Leave settings" },
    steps: [
      {
        title: "Open Leave Management",
        body: "Settings → Leave. Add types such as Casual, Sick or Loss of pay.",
      },
      {
        title: "Use them in payroll",
        body: "When paying salary, paid and unpaid leave days change the final amount.",
      },
    ],
    related: ["salary-setup"],
  },

  /* --------------------------------- Finance --------------------------------- */
  {
    id: "receive-payment",
    category: "finance",
    title: "Collect a fee and share the receipt",
    summary: "Record a student's payment and send the receipt on WhatsApp.",
    minutes: 2,
    access: { kind: "finance", view: "receive" },
    keywords: ["receive", "collect", "fee", "receipt", "payment", "upi", "cash", "bank", "print"],
    openTo: { href: "/tenant/finance?tab=receive", label: "Open Receive Payment" },
    steps: [
      {
        title: "Open Receive payment",
        body: "Finance → Receive payment, or the green Receive payment tile on the Dashboard.",
      },
      {
        title: "Pick the student",
        body: "Received From: Student. Choose Class, then Student. Their pending fees appear automatically.",
        tip: "Money from someone who is not a student (donation, canteen rent)? Choose External payer and pick an Income ledger.",
      },
      {
        title: "Choose what is being paid",
        body: "Each fee line has a Fee description, Fee period(s) and Amount. Class Tier one-time fees (Admission, Exam, …) appear under Fee description for that class and prefill once. Tap Add fee item to collect several fees in one receipt.",
      },
      {
        title: "Mode, date and proof",
        body: "Choose Bank, Cash or Both (split between the two). Adjust Date / Time if the money came earlier, and attach a UPI screenshot or bank slip with the paperclip.",
      },
      {
        title: "Record and share",
        body: "Tap Record Payment. In Payment History use WhatsApp, Print or Download on the receipt.",
        tip: "Made a mistake? Tap Edit on the receipt in Payment History. The student's balance updates automatically.",
      },
    ],
    related: ["student-profile", "fees-report", "daybook"],
  },
  {
    id: "make-payment",
    category: "finance",
    title: "Record an expense",
    summary: "Pay bills, suppliers or any school expense.",
    minutes: 2,
    access: { kind: "finance", view: "make" },
    keywords: ["expense", "make payment", "bill", "supplier", "voucher", "spend", "pay"],
    openTo: { href: "/tenant/finance?tab=make", label: "Open Make Payment" },
    steps: [
      {
        title: "Open Make payment",
        body: "Finance → Make payment, or the red tile on the Dashboard.",
      },
      {
        title: "Choose Other Expense",
        body: "Payee Type: Other Expense. Pick the Expense ledger (for example Electricity, Stationery).",
      },
      {
        title: "Describe and pay",
        body: "Add Description / Line Items and Amount, choose the payment mode and attach the bill.",
      },
      {
        title: "Confirm",
        body: "Confirm Payment, then Pay Now. It appears in Made Payment Details, where you can edit, share or download it.",
      },
    ],
    related: ["salary-setup", "fund-transfer", "pl-report"],
  },
  {
    id: "fund-transfer",
    category: "finance",
    title: "Move money between cash and bank",
    summary: "Record a cash deposit, withdrawal or bank-to-bank transfer.",
    minutes: 1,
    access: { kind: "finance", view: "transfer" },
    keywords: [
      "transfer",
      "contra",
      "deposit",
      "withdraw",
      "cash to bank",
      "bank account",
      "move money",
    ],
    openTo: { href: "/tenant/finance?tab=transfer", label: "Open Transfer money" },
    steps: [
      {
        title: "Open Transfer money",
        body: "Finance → Transfer money. Add your bank account first with Add bank if it is not listed.",
      },
      {
        title: "From, To and amount",
        body: "Choose From (for example Cash in hand) and To (for example HDFC Current), then the amount, Date and an optional Narration.",
      },
      {
        title: "Save",
        body: "It is not income or expense, so P&L does not change. Only cash and bank balances move. See all transfers in Transfer Reports.",
      },
    ],
    related: ["reconciliation", "daybook"],
  },
  {
    id: "classes-fees",
    category: "finance",
    title: "Set up classes and fee structure",
    summary: "Tell Feezo what each class pays so collection is automatic.",
    minutes: 5,
    access: { kind: "settings", tab: "classes" },
    keywords: [
      "fee structure",
      "class",
      "installment",
      "term",
      "monthly",
      "tuition",
      "division",
      "setup",
    ],
    openTo: { href: "/tenant/settings?tab=classes", label: "Open Class Tier" },
    steps: [
      {
        title: "Add a class",
        body: "Settings → Class Tier → Classes → add. Enter Class (for example Grade 8) and Division (for example B). A class teacher is optional.",
      },
      {
        title: "Pick a billing mode",
        body: "Monthly bills by calendar month; Term bills by terms. Receive payment then shows months or terms to match.",
      },
      {
        title: "Enter the amounts",
        body: "Add each installment with its Amount and Due date, choose Fee collection starts from, and add One-time fees (admission, books) with Add fee.",
        tip: "Every student in this class inherits this schedule, so the dues on their profile are filled in for you.",
      },
      {
        title: "Extra fee categories",
        body: "Add from Finance → Receive Payment → Add fee category, or Settings → Fee Category. Same Add Fee Category popup either way — name, optional installments, and Active.",
        image: IMG.setup,
      },
    ],
    related: ["concessions", "admit-student", "receive-payment"],
  },
  {
    id: "concessions",
    category: "finance",
    title: "Give a fee concession",
    summary: "Discounts and waivers that reduce what a student owes.",
    minutes: 2,
    access: { kind: "permission", key: "students" },
    keywords: ["concession", "discount", "waiver", "scholarship", "sibling", "reduce fee"],
    openTo: { href: "/tenant/finance?tab=concession", label: "Open Concession Report" },
    steps: [
      {
        title: "At admission or later",
        body: "Turn on Fee concession in Admit Student, or open the student → Edit Profile → Fee concession.",
      },
      {
        title: "Enter the discount",
        body: "Set the amount. The student's Total Due drops immediately.",
      },
      {
        title: "Track them",
        body: "Finance → Concession Report lists every waiver given, useful for audits and management review.",
      },
    ],
    related: ["classes-fees", "fees-report"],
  },
  {
    id: "journals",
    category: "finance",
    title: "Journals: edit or delete entries safely",
    summary: "Manual vouchers, opening balances and the rules that keep books balanced.",
    minutes: 3,
    access: { kind: "finance", view: "journals" },
    keywords: [
      "journal",
      "voucher",
      "edit",
      "delete",
      "opening balance",
      "debit",
      "credit",
      "correction",
    ],
    openTo: { href: "/tenant/finance?tab=journals", label: "Open Journals" },
    steps: [
      {
        title: "Where entries come from",
        body: "Every receipt, payment and transfer posts its own journal automatically. The Source column shows Receipt, Payment, Year-end close or Manual.",
      },
      {
        title: "Fix automatic entries at the source",
        body: "To change an entry that came from a receipt or payment, edit that receipt or payment. The journal updates itself.",
      },
      {
        title: "Manual vouchers",
        body: "Tap New journal for adjustments, or Opening balances when you start using Feezo mid-year.",
      },
      {
        title: "The two rules",
        body: "Total debits must equal total credits, and the same account cannot be on both sides of one voucher. Feezo will not save a voucher that breaks either rule.",
      },
    ],
    warning:
      "Deleting a voucher changes balances in every report for that year. Edit instead of delete where possible.",
    related: ["year-close", "trial-balance", "ledger"],
  },
  {
    id: "year-close",
    category: "finance",
    title: "Close or reopen the financial year",
    summary: "Lock last year's books and start the new year fresh.",
    minutes: 3,
    access: { kind: "finance", view: "journals" },
    keywords: [
      "year end",
      "close books",
      "reopen",
      "retained earnings",
      "new year",
      "financial year",
    ],
    openTo: { href: "/tenant/finance?tab=journals", label: "Open Journals" },
    steps: [
      {
        title: "Create the new year",
        body: "Settings → System → Financial Year → choose the months → Add year. Classes and fee periods are copied from the previous year.",
      },
      {
        title: "Close the old year's books",
        body: "Switch to the old year in the top bar, open Finance → Journals and tap Close books. Income and expense move into Retained Earnings so next year's P&L starts at zero.",
      },
      {
        title: "Need to correct something?",
        body: "Tap Reopen books, fix the entry, then Close books again.",
        tip: "Seeing an amount in Suspense after an older close? Reopen books, then Close books again. Feezo re-posts it correctly and Suspense returns to zero.",
      },
    ],
    related: ["academic-year", "journals", "balance-sheet"],
  },

  /* --------------------------------- Reports --------------------------------- */
  {
    id: "fees-report",
    category: "reports",
    title: "Fees report: who paid and who is due",
    summary: "Collections, dues and overdue fees by class.",
    minutes: 1,
    access: { kind: "finance", view: "fees" },
    keywords: ["fees report", "due", "overdue", "collection", "pending", "defaulters"],
    openTo: { href: "/tenant/finance?tab=fees", label: "Open Fees Report" },
    steps: [
      {
        title: "Open it",
        body: "Finance → Fees Report.",
      },
      {
        title: "Filter",
        body: "Use the filters to narrow down to a class or to overdue students.",
      },
      {
        title: "Act on it",
        body: "Export to share with management, or go to Students → Select overdue → Bulk WhatsApp to send reminders.",
      },
    ],
    related: ["bulk-actions", "concessions"],
  },
  {
    id: "daybook",
    category: "reports",
    title: "Day Book: today's cash activity",
    summary: "Every receipt and payment for a day, for end-of-day cash counts.",
    minutes: 1,
    access: { kind: "finance", view: "daybook" },
    keywords: ["day book", "daily", "cash count", "today", "closing"],
    openTo: { href: "/tenant/finance?tab=daybook", label: "Open Day Book" },
    steps: [
      {
        title: "Open Day Book",
        body: "Finance → Day Book lists everything collected and paid on the chosen date.",
      },
      {
        title: "Count the cash",
        body: "Compare the cash total with the money in the drawer at closing time.",
      },
    ],
    related: ["receive-payment", "reconciliation"],
  },
  {
    id: "salary-report",
    category: "reports",
    title: "Salary report",
    summary: "Payroll paid and still owed per month.",
    minutes: 1,
    access: { kind: "finance", view: "salary" },
    keywords: ["salary report", "payroll", "staff payable"],
    openTo: { href: "/tenant/finance?tab=salary", label: "Open Salary Report" },
    steps: [
      {
        title: "Open it",
        body: "Finance → Salary Report shows paid and held salaries by staff and month.",
      },
      {
        title: "Pay what is pending",
        body: "Held salaries can be paid from Make payment.",
      },
    ],
    related: ["salary-setup"],
  },
  {
    id: "reconciliation",
    category: "reports",
    title: "Bank reconciliation",
    summary: "Match your bank statement with Feezo's books.",
    minutes: 3,
    access: { kind: "finance", view: "reconciliation" },
    keywords: ["reconciliation", "bank statement", "match", "cleared", "bank balance"],
    openTo: { href: "/tenant/finance?tab=reconciliation", label: "Open Bank Reconciliation" },
    steps: [
      {
        title: "Open Bank Reconciliation",
        body: "Finance → Bank Reconciliation lists every bank and UPI receipt and payment.",
      },
      {
        title: "Enter the statement balance",
        body: "Type the closing balance from your bank statement.",
      },
      {
        title: "Untick what the bank hasn't shown yet",
        body: "Every entry starts as cleared. Untick the ones missing from the statement (cheques not yet deposited, payments not yet debited). The difference should reach zero.",
        tip: "A difference that won't go away is usually a bank charge or a transfer not recorded yet.",
      },
    ],
    related: ["fund-transfer", "daybook"],
  },
  {
    id: "analytics",
    category: "reports",
    title: "Analytics",
    summary: "Charts of income, expense and collection trends.",
    minutes: 1,
    access: { kind: "finance", view: "analytics" },
    keywords: ["analytics", "charts", "insights", "trend", "graph"],
    openTo: { href: "/tenant/finance?tab=analytics", label: "Open Analytics" },
    steps: [
      {
        title: "Open Analytics",
        body: "Finance → Analytics shows where money comes from and where it goes.",
      },
      {
        title: "Use it monthly",
        body: "Compare months to spot falling collections or rising expenses early.",
      },
    ],
    related: ["pl-report"],
  },
  {
    id: "ledger",
    category: "reports",
    title: "Ledger statements",
    summary: "Every movement in one account, with running balance.",
    minutes: 1,
    access: { kind: "finance", view: "ledger" },
    keywords: ["ledger", "account statement", "running balance", "general ledger"],
    openTo: { href: "/tenant/finance?tab=ledger", label: "Open Ledger" },
    steps: [
      {
        title: "Pick an account",
        body: "Finance → Ledger, then choose an account such as Cash, a bank or Tuition Fee.",
      },
      {
        title: "Open the source",
        body: "Tap any line to open the receipt, payment or journal behind it.",
      },
    ],
    related: ["journals", "trial-balance"],
  },
  {
    id: "trial-balance",
    category: "reports",
    title: "Trial balance",
    summary: "Quick check that the books are balanced.",
    minutes: 1,
    access: { kind: "finance", view: "trial" },
    keywords: ["trial balance", "debit", "credit", "balanced", "check"],
    openTo: { href: "/tenant/finance?tab=trial", label: "Open Trial Balance" },
    steps: [
      {
        title: "Open it",
        body: "Finance → Trial Balance lists every account with its debit or credit balance.",
      },
      {
        title: "Totals must match",
        body: "Debit total equals credit total when everything is right. If not, see the “Balances don't match” question below.",
      },
    ],
    related: ["journals", "balance-sheet"],
  },
  {
    id: "pl-report",
    category: "reports",
    title: "Profit & Loss",
    summary: "Income vs expenses for the year.",
    minutes: 1,
    access: { kind: "finance", view: "pl" },
    keywords: ["profit", "loss", "p&l", "pl", "income statement", "surplus", "deficit"],
    openTo: { href: "/tenant/finance?tab=pl", label: "Open Profit & Loss" },
    steps: [
      {
        title: "Open it",
        body: "Finance → Profit & Loss shows total income, total expenses and the surplus or deficit.",
      },
      {
        title: "Export",
        body: "Download as PDF or CSV for your auditor or management meeting.",
      },
    ],
    related: ["balance-sheet", "year-close"],
  },
  {
    id: "balance-sheet",
    category: "reports",
    title: "Balance sheet",
    summary: "What the school owns and owes on a date.",
    minutes: 1,
    access: { kind: "finance", view: "balance" },
    keywords: ["balance sheet", "assets", "liabilities", "equity", "retained earnings"],
    openTo: { href: "/tenant/finance?tab=balance", label: "Open Balance Sheet" },
    steps: [
      {
        title: "Open it",
        body: "Finance → Balance Sheet lists assets (cash, bank, receivables) and liabilities.",
      },
      {
        title: "Suspense should be zero",
        body: "If Suspense shows an amount, follow the fix in “Close or reopen the financial year”.",
      },
    ],
    related: ["year-close", "trial-balance"],
  },

  /* --------------------------------- Settings -------------------------------- */
  {
    id: "school-profile",
    category: "settings",
    title: "School profile, logo and signature",
    summary: "The details printed on every receipt and report.",
    minutes: 3,
    access: { kind: "settings", tab: "school" },
    keywords: ["school details", "logo", "letterhead", "seal", "signature", "address", "profile"],
    openTo: { href: "/tenant/settings?tab=school", label: "Open School Details" },
    steps: [
      {
        title: "Open School Details",
        body: "Settings → School Details.",
        image: IMG.setup,
      },
      {
        title: "Upload branding",
        body: "Upload Logo, Letterhead, Seal and Signature. You can draw a signature with Draw, and use Adjust to position each image.",
      },
      {
        title: "Fill details",
        body: "School name, address, phone, email, registration and affiliation numbers and principal. Tap Save Changes.",
        tip: "Receipts look professional once the logo, seal and signature are set.",
      },
    ],
    related: ["appearance", "branches"],
  },
  {
    id: "academic-year",
    category: "settings",
    title: "Academic / financial year",
    summary: "Add a new year, rename or close old ones.",
    minutes: 2,
    access: { kind: "settings", tab: "system" },
    keywords: ["academic year", "financial year", "add year", "new year", "AY"],
    openTo: { href: "/tenant/settings?tab=system", label: "Open System settings" },
    steps: [
      {
        title: "Open Financial Year",
        body: "Settings → System → Financial Year lists every year with its status: Open books, Closed or Available.",
      },
      {
        title: "Add a year",
        body: "Choose the start and closing months and tap Add year. Classes and fee periods are copied from the nearest year.",
      },
      {
        title: "Manage years",
        body: "Use Open, Close, Reopen, Edit or Delete on each row.",
      },
    ],
    warning:
      "Delete removes that year's receipts, enrollments and fee periods. Close the year instead unless it was created by mistake.",
    related: ["year-close", "switch-campus-year"],
  },
  {
    id: "branches",
    category: "settings",
    title: "Branches (campuses)",
    summary: "Run several campuses with separate books from one login.",
    minutes: 2,
    access: { kind: "settings", tab: "branches" },
    keywords: ["branch", "campus", "multi campus", "location"],
    openTo: { href: "/tenant/settings?tab=branches", label: "Open Branches" },
    steps: [
      {
        title: "Add a campus",
        body: "Settings → Branches, or the campus menu in the top bar → Add branch.",
        tip: "Multiple campuses need the Premium or Enterprise plan.",
      },
      {
        title: "Switch between them",
        body: "Pick the campus from the top bar. Each campus has its own students and receipts.",
      },
    ],
    related: ["switch-campus-year", "team-users"],
  },
  {
    id: "team-users",
    category: "settings",
    title: "Team logins and permissions",
    summary: "Give your accountant or office staff their own login.",
    minutes: 3,
    access: { kind: "settings", tab: "users" },
    keywords: [
      "users",
      "login",
      "permission",
      "access",
      "accountant",
      "team",
      "role",
      "password",
      "reset",
      "forgot",
    ],
    openTo: { href: "/tenant/settings?tab=users", label: "Open Users" },
    steps: [
      {
        title: "Add a user",
        body: "Settings → Users → Add User. Enter their name, email and a password (at least 8 characters).",
      },
      {
        title: "Choose Module access",
        body: "Tick only what they need, for example Receive payment but not Settings. Under Campuses, limit which branches they can open.",
      },
      {
        title: "Reset a password",
        body: "On the user row, tap Send reset link — they get an email and choose a new password. Or open Settings → Support and ask about password reset. Locked-out users can also use Forgot password on the sign-in page. No Feezo or super admin needed.",
      },
      {
        title: "Test before saving",
        body: "Test without saving opens a preview tab showing exactly what they will see.",
      },
      {
        title: "Turn access off",
        body: "Uncheck Active (can sign in) to block a login without deleting it.",
        tip: "Use Login as to see the workspace as that user when they report a problem.",
      },
    ],
    related: ["branches"],
  },
  {
    id: "transport",
    category: "settings",
    title: "Bus points and vehicles",
    summary: "Routes, vehicles and transport fees.",
    minutes: 3,
    access: { kind: "settings", tab: "transport" },
    keywords: ["bus", "transport", "vehicle", "route", "pickup", "drop", "vehicle fee"],
    openTo: { href: "/tenant/settings?tab=transport", label: "Open Bus Point" },
    steps: [
      {
        title: "Add routes",
        body: "Settings → Bus Point → Transport Routes → add a route with pickup and drop points on the map.",
      },
      {
        title: "Add vehicles",
        body: "Under Vehicle Management add each bus with Seat Capacity, Driver Name, Driver Phone and document validity (insurance, fitness). Feezo reminds you before they expire.",
      },
      {
        title: "Assign students",
        body: "In the student's Edit Profile tick Requires school bus and choose pickup and drop points. The vehicle fee is then collected in Receive payment.",
      },
    ],
    related: ["student-profile", "receive-payment"],
  },
  {
    id: "live-support",
    category: "settings",
    title: "Chat with the Feezo team",
    summary: "Raise a ticket and get help from a real person.",
    minutes: 1,
    keywords: ["support", "chat", "ticket", "help", "contact", "whatsapp", "problem"],
    openTo: { href: "/tenant/settings?tab=support", label: "Open live chat" },
    steps: [
      {
        title: "Open live chat",
        body: "Settings → Support. Pick a suggested question or type your own. Attach a screenshot if it helps.",
        image: IMG.support,
      },
      {
        title: "Prefer WhatsApp or a call?",
        body: "Use the contact options at the bottom of this Support page.",
      },
    ],
  },

  /* ------------------------------- Subscription ------------------------------ */
  {
    id: "subscription",
    category: "subscription",
    title: "Your plan, renewal and invoices",
    summary: "See what your plan includes and renew in a few taps.",
    minutes: 2,
    keywords: [
      "subscription",
      "plan",
      "renew",
      "upgrade",
      "invoice",
      "billing",
      "trial",
      "premium",
    ],
    openTo: { href: "/tenant/billing", label: "Open Subscription" },
    steps: [
      {
        title: "Open Subscription",
        body: "The Subscription menu shows your plan, Renewal date, Auto-renewal and Renewal price.",
        image: IMG.subscriptions,
      },
      {
        title: "Check features",
        body: "Features included lists what your plan unlocks. Locked items need a higher plan.",
      },
      {
        title: "Renew or upgrade",
        body: "Tap Renew to pay online. Invoices & receipts keeps every bill for your records.",
        tip: "On a free trial, renew before the trial ends to keep working without a break. Your data stays safe either way.",
      },
    ],
    related: ["branches", "team-users"],
  },
];

export const HELP_GUIDE_BY_ID: ReadonlyMap<string, HelpGuide> = new Map(
  HELP_GUIDES.map((g) => [g.id, g]),
);

export type HelpFaq = {
  id: string;
  question: string;
  answer: string;
  guideId?: string;
};

export const HELP_FAQS: HelpFaq[] = [
  {
    id: "receipt-missing",
    question: "I recorded a receipt but can't see it",
    answer:
      "Check the campus and academic year in the top bar. Receipts belong to the campus and year that were open when you recorded them. If they are right, tap the refresh button in the top bar to reload the latest data.",
    guideId: "switch-campus-year",
  },
  {
    id: "wrong-campus",
    question: "I recorded something in the wrong campus or year",
    answer:
      "Open the receipt or payment from Payment History / Made Payment Details, note the details, delete it, then switch to the correct campus or year and record it again.",
    guideId: "receive-payment",
  },
  {
    id: "balances-mismatch",
    question: "Balances don't match / trial balance is off",
    answer:
      "Look for Suspense on the Balance Sheet. If it came from an older year-end close, Reopen books then Close books again in Journals. Otherwise check Opening balances and any recent manual journals.",
    guideId: "year-close",
  },
  {
    id: "student-due-wrong",
    question: "A student's due amount looks wrong",
    answer:
      "Dues come from the class fee schedule minus concessions and receipts. Check the class in Settings → Class Tier, then any concession on the student, then their Payments tab.",
    guideId: "classes-fees",
  },
  {
    id: "logged-out",
    question: "I keep getting logged out",
    answer:
      "For security, a session ends when it expires or when your admin changes your access. Sign in again; everything you saved is kept. If it happens every few minutes, clear this site's data in the browser and sign in once more.",
  },
  {
    id: "deactivated",
    question: "It says my account is deactivated",
    answer:
      "Your school admin has turned off your login in Settings → Users. Ask them to tick Active (can sign in). If you are the admin, check your subscription is active.",
    guideId: "team-users",
  },
  {
    id: "menu-missing",
    question: "I can't see Finance, Staff or Settings",
    answer:
      "Your login only includes the modules your admin allowed, or your plan doesn't include that module. Ask your admin to update your Module access.",
    guideId: "team-users",
  },
  {
    id: "whatsapp-not-opening",
    question: "WhatsApp doesn't open when I share a receipt",
    answer:
      "Make sure the guardian has a valid 10-digit phone number and WhatsApp is installed on this device. On a computer, WhatsApp Web opens in a new tab, so allow pop-ups for Feezo.",
    guideId: "bulk-actions",
  },
  {
    id: "data-safe",
    question: "Is my school's data safe?",
    answer:
      "Yes. Every school's data is kept separate, connections are encrypted, and only the logins you create can open your workspace. You control exactly what each login can see in Settings → Users.",
  },
];

export type QuickTask = { label: string; guideId: string };

export const HELP_QUICK_TASKS: QuickTask[] = [
  { label: "Collect a fee", guideId: "receive-payment" },
  { label: "Admit a student", guideId: "admit-student" },
  { label: "Set fee structure", guideId: "classes-fees" },
  { label: "Pay salary", guideId: "salary-setup" },
  { label: "Add a team login", guideId: "team-users" },
  { label: "Close the year", guideId: "year-close" },
];
