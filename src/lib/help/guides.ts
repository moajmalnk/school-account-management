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
  {
    id: "finance",
    title: "Finance",
    description: "Cash ops, ledgers and day-to-day accounts",
  },
  {
    id: "reports",
    title: "Reports",
    description: "Day book through Balance Sheet",
  },
  { id: "settings", title: "Settings", description: "School profile, classes, fees and users" },
  { id: "subscription", title: "Subscription", description: "Plan, renewal and invoices" },
];

/** Accounts department workflow grouping (School Accounts Manual ch. 33). */
export type HelpProcedure = "setup" | "daily" | "monthly";

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
  /** Caution callout under the step (stronger than tip). */
  warning?: string;
};

export type HelpFlowchartSpec = {
  title: string;
  mermaid: string;
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
  /** Primary process diagram shown under the summary in GuideView. */
  flowchart?: HelpFlowchartSpec;
  /** Accounts workflow bucket for Setup / Daily / Monthly strips. */
  procedure?: HelpProcedure;
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
        body: "Dashboard, Students, Attendance, Staff, Finance, Support, and Settings. Subscription is a tab inside Settings.",
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
        body: "Staff: same email and password as the web, or **Continue with Google** when that Google email already has a Feezo login. Parents: use the parent portal with the phone on file.",
      },
      {
        title: "Collect fees on the go",
        body: "Open Finance → Receive payment on the phone to issue a receipt and share it on WhatsApp straight away.",
      },
    ],
    related: ["receive-payment", "google-sign-in", "parent-portal"],
  },
  {
    id: "ai-assistant",
    category: "start",
    title: "Ask the Feezo AI assistant",
    summary: "Get answers, open screens, and follow official how-to guides.",
    minutes: 1,
    keywords: ["ai", "assistant", "chat", "ask", "feezo ai", "help", "question", "biometric", "google"],
    steps: [
      {
        title: "Open the assistant",
        body: "Tap the sparkle button (or open **Feezo AI**). It asks how it can help today.",
      },
      {
        title: "Ask in plain words",
        body: "Try “Show overdue fees”, “Open biometric devices”, or “How do I sign in with Google?”. Feezo can open the right screen or guide for you.",
      },
      {
        title: "How-to answers",
        body: "For setup questions it uses the same Support guides you see under **Support** — short steps with exact button names.",
        tip: "Prefer English or Malayalam; Feezo matches the language you write in.",
      },
    ],
    related: ["workspace-tour", "biometric-devices", "google-sign-in", "live-support"],
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
      "promotion",
      "demote",
      "repeat",
      "next year",
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
        body: "Bulk WhatsApp sends one message to every selected guardian. Change Class moves them inside the open year only. Change Status sets them Active or Inactive.",
        tip: "Use Select overdue + Bulk WhatsApp for a one-click fee reminder.",
      },
      {
        title: "Promote to the next year",
        body: "Promote on the Students directory places the current class, or the students you selected, into the next academic year. Grade 8 becomes Grade 9 when that class exists. Repeat keeps the grade, Demote moves down, and the final grade graduates. This year’s fees stay put. One student can be placed from their Academic tab.",
      },
      {
        title: "Deleted by mistake?",
        body: "Deleted students go to the Recycle Bin, where you can restore them.",
      },
    ],
    related: ["student-profile", "fees-report", "student-attendance"],
  },
  {
    id: "student-attendance",
    category: "students",
    title: "Mark attendance and notify parents",
    summary: "Daily class rolls, monthly PDFs, and WhatsApp absence alerts.",
    minutes: 3,
    access: { kind: "permission", key: "students" },
    keywords: [
      "attendance",
      "absent",
      "present",
      "halfday",
      "leave",
      "late",
      "whatsapp",
      "pdf",
      "register",
      "class",
      "division",
    ],
    openTo: { href: "/tenant/attendance", label: "Open Attendance" },
    steps: [
      {
        title: "Open Attendance",
        body: "From the dock or mobile tab, open Attendance. Pick the date, then tap Mark students.",
      },
      {
        title: "Filter by class and division",
        body: "Use the Class and Division filters so you only see the roll you need. Set Present, Absent, Halfday, Late, or Leave for each student — or tap All present for the filtered list.",
      },
      {
        title: "Save and notify",
        body: "Confirm Save. Feezo can then WhatsApp parents of students who are not Present (when a phone number is on file).",
        tip: "Customise the alert wording in Settings → WhatsApp messages → Attendance alert.",
      },
      {
        title: "Export reports",
        body: "Use Daily, Monthly, or Detailed report to download a PDF or share it on WhatsApp. Each student profile also has an Attendance tab for month history.",
      },
    ],
    related: ["student-profile", "bulk-actions", "biometric-devices"],
  },
  {
    id: "biometric-devices",
    category: "students",
    title: "Connect a biometric attendance device",
    summary: "Register an eSSL / ZKTeco ADMS machine, map PINs, and sync punches into Feezo.",
    minutes: 5,
    access: { kind: "permission", key: "students" },
    keywords: [
      "biometric",
      "fingerprint",
      "device",
      "devices",
      "adms",
      "essl",
      "zkteco",
      "punch",
      "serial",
      "pin",
      "machine",
      "online",
      "attendance device",
    ],
    openTo: { href: "/tenant/attendance?tab=devices", label: "Open Devices" },
    steps: [
      {
        title: "Open Devices",
        body: "Go to **Attendance → Devices**. This is where Feezo lists biometric machines for the current campus.",
      },
      {
        title: "Register the serial number",
        body: "Tap **Add device** (or Register). Enter the machine’s **Serial Number** exactly as shown on the device. Save so Feezo can claim punches from that SN.",
      },
      {
        title: "Point the machine at Feezo",
        body: "On the device menu set Server Mode to **ADMS**, enable domain name, Server Address **api.feezo.app**, Port **80**. Prefer plain HTTP for `/iclock/*` (many firmwares do not follow HTTPS redirects).",
        tip: "When the machine is talking to Feezo, the device row shows **Online** (last seen within a few minutes).",
      },
      {
        title: "Map each PIN to a person",
        body: "Under user mapping, bind each biometric **PIN** to a student or staff member. Unmapped punches are stored but do not mark attendance until mapped.",
      },
      {
        title: "Confirm live punches",
        body: "Watch the live feed after a test punch. Use ADMS logs on the same screen if a device stays Offline.",
        warning:
          "Unregistered serial numbers stay unassigned and will not write tenant attendance until you claim them here.",
      },
    ],
    related: ["student-attendance", "add-staff"],
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
    procedure: "daily",
    keywords: ["salary", "payroll", "pay staff", "basic salary", "attendance", "hold salary"],
    openTo: { href: "/tenant/finance?tab=make", label: "Open Make Payment" },
    flowchart: {
      title: "Salary payment path",
      mermaid: `flowchart LR
  profile[Set_Basic_Salary_on_Staff] --> make[Make_Payment_Salary]
  make --> pick[Staff_Month_Amount_Mode]
  pick --> save[Review_and_Save]
  save --> history[Check_Salary_History]`,
    },
    steps: [
      {
        title: "Set the salary",
        body: "Open the staff member's profile → Professional tab → Payroll Structure and enter the Basic Salary.",
        image: IMG.staffProfile,
      },
      {
        title: "Pay the salary",
        body: "Finance → Make payment → Payee Type: Salary. Choose the staff member and Salary month. Days Present, Paid Leave and Unpaid Leave adjust the amount automatically. Accounting: Debit Salary Expense / Credit Cash or Bank.",
      },
      {
        title: "Pay now or hold",
        body: "Confirm Payment, then choose Pay Now (money has gone out) or Hold (salary is owed but not yet paid). Check Staff Salary History after save.",
        tip: "Held salaries show as Salary Outstanding on the Dashboard until you pay them.",
      },
    ],
    related: ["make-payment", "salary-report", "leave-types", "queued-payments"],
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
    summary:
      "Record a student fee collection with the correct category, mode and date — then print or share the receipt.",
    minutes: 3,
    access: { kind: "finance", view: "receive" },
    procedure: "daily",
    keywords: [
      "receive",
      "collect",
      "fee",
      "receipt",
      "payment",
      "upi",
      "cash",
      "bank",
      "print",
      "tuition",
    ],
    openTo: { href: "/tenant/finance?tab=receive", label: "Open Receive Payment" },
    flowchart: {
      title: "Receive payment",
      mermaid: `flowchart TD
  openNode[Open Receive Payment] --> pick[Select class and student]
  pick --> fee[Fee category and amount]
  fee --> mode[Mode: Cash / Bank / Both]
  mode --> when[Confirm paid date]
  when --> save[Review and save]
  save --> receipt[Print or share receipt]
  receipt --> verify[Fee status updated]`,
    },
    steps: [
      {
        title: "Confirm campus and year",
        body: "Check the header Campus / Branch and Academic Year before you collect. Wrong context mis-routes the receipt and fee status.",
      },
      {
        title: "Open Receive payment",
        body: "Finance → Receive payment, or the green Receive payment tile on the Dashboard.",
      },
      {
        title: "Pick the student",
        body: "Received From: Student. Choose Class, then Student. Pending fees appear automatically.",
        tip: "Money from a non-student (donation, rent)? Choose External payer and pick an Income ledger.",
      },
      {
        title: "Choose fee category and amount",
        body: "Select the fee line (Tuition, Admission, Exam, Transport, …). Verify the amount matches what was paid. Add fee item to collect several lines on one receipt.",
      },
      {
        title: "Mode, date and proof",
        body: "Choose Cash, Bank/UPI or Both. Set Paid Date & Time. Attach a UPI screenshot or bank slip if needed.",
      },
      {
        title: "Save, then share the receipt",
        body: "Record Payment. Open the receipt to Print or PDF, or share on WhatsApp from Payment History.",
        tip: "Mistake? Edit the receipt in Payment History — the student’s balance updates automatically.",
      },
    ],
    warning:
      "Always confirm Campus and Academic Year in the top bar before saving. Receipts belong to the campus and year that were open when you recorded them.",
    related: ["fees-report", "daybook", "fee-break", "daily-ops"],
  },
  {
    id: "make-payment",
    category: "finance",
    title: "Record an expense or vendor payment",
    summary:
      "Pay salary, other expenses or vendors from Make Payment — pick the right payee type and expense ledger.",
    minutes: 3,
    access: { kind: "finance", view: "make" },
    procedure: "daily",
    keywords: [
      "expense",
      "make payment",
      "bill",
      "supplier",
      "vendor",
      "voucher",
      "spend",
      "pay",
      "electricity",
    ],
    openTo: { href: "/tenant/finance?tab=make", label: "Open Make Payment" },
    flowchart: {
      title: "Make payment",
      mermaid: `flowchart TD
  openNode[Open Make Payment] --> type[Choose payee type]
  type --> salary[Salary]
  type --> expense[Other expense]
  type --> vendor[Vendor]
  salary --> fill[Amount, mode, narration]
  expense --> ledger[Pick expense ledger]
  vendor --> ledger
  ledger --> fill
  fill --> save[Review and save]
  save --> history[Check payment history]`,
    },
    steps: [
      {
        title: "Open Make payment",
        body: "Finance → Make payment, or the red tile on the Dashboard.",
      },
      {
        title: "Choose payee type",
        body: "Salary for staff payroll, Other Expense for bills (electricity, stationery), or Vendor for supplier payments.",
      },
      {
        title: "Ledger, amount and mode",
        body: "For expenses/vendors pick the correct Expense ledger. Enter amount, Cash/Bank/UPI mode, narration and attach the bill if available.",
      },
      {
        title: "Review and save",
        body: "Confirm Payment, then Pay Now. It appears in Made Payment Details for edit, share or download.",
        tip: "Wrong ledger (expense under Income)? Fix it before month-end — it distorts P&L.",
      },
    ],
    related: ["salary-setup", "queued-payments", "fund-transfer", "pl-report", "daily-ops"],
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
    title: "Fee categories and class fee structure",
    summary:
      "Create fee categories (Tuition, Admission, Exam…) then set each class schedule so dues calculate automatically.",
    minutes: 5,
    access: { kind: "settings", tab: "classes" },
    procedure: "setup",
    keywords: [
      "fee structure",
      "fee category",
      "class",
      "installment",
      "term",
      "monthly",
      "tuition",
      "division",
      "setup",
    ],
    openTo: { href: "/tenant/settings?tab=classes", label: "Open Class Tier" },
    flowchart: {
      title: "Fee setup path",
      mermaid: `flowchart LR
  cats[Create_Fee_Categories] --> classNode[Add_Classes]
  classNode --> mode[Pick_Billing_Mode]
  mode --> amounts[Enter_Installments_and_One_Time]
  amounts --> receive[Visible_in_Receive_Payment]`,
    },
    steps: [
      {
        title: "Create fee categories",
        body: "Settings → Fee Category (or Receive Payment → Add fee category). Typical names: Tuition, Admission, Exam, Transport, Lab, Library, Activity, Other. Reuse an existing category when possible.",
        image: IMG.setup,
      },
      {
        title: "Add a class",
        body: "Settings → Class Tier → Classes → add. Enter Class (for example Grade 8) and Division (for example B).",
      },
      {
        title: "Pick a billing mode",
        body: "Monthly bills by calendar month; Term bills by terms. Receive payment then shows months or terms to match.",
      },
      {
        title: "Enter the amounts",
        body: "Add each installment with Amount and Due date, choose Fee collection starts from, and add One-time fees (admission, books) with Add fee.",
        tip: "Every student in this class inherits this schedule, so dues on their profile fill in automatically.",
      },
    ],
    related: ["ledgers-setup", "concessions", "admit-student", "receive-payment"],
  },
  {
    id: "ledgers-setup",
    category: "finance",
    title: "Account groups and ledgers",
    summary:
      "Create ledgers under the correct Account Group (Income, Expense, Asset, Liability) before recording live transactions.",
    minutes: 4,
    access: { kind: "finance", view: "ledger" },
    procedure: "setup",
    keywords: [
      "ledger",
      "account group",
      "chart of accounts",
      "income",
      "expense",
      "asset",
      "liability",
      "setup",
      "classify",
    ],
    openTo: { href: "/tenant/finance?tab=ledger", label: "Open Ledger" },
    flowchart: {
      title: "Ledger creation",
      mermaid: `flowchart TD
  openNode[Open Ledger setup] --> name[Enter ledger name]
  name --> group[Select Account Group]
  group --> check{Group type correct?}
  check -->|Yes| save[Save and verify]
  check -->|No| fix[Change group first]
  fix --> group
  save --> use[Ready for Receive / Make Payment]`,
    },
    steps: [
      {
        title: "Open ledger / account setup",
        body: "Finance → Ledger (or the account catalog used when receiving/making payment). Fee categories and payment categories often seed common income/expense ledgers.",
      },
      {
        title: "Choose the Account Group",
        body: "Income for fee and other income; Expense for salary, electricity, vendor costs; Asset for Cash/Bank; Liability for payables. Never put an expense under Income or vice versa.",
      },
      {
        title: "Create the ledger",
        body: "Enter the name, select the group, fill other fields, then Save.",
      },
      {
        title: "Verify in transactions",
        body: "Confirm the new ledger appears in Receive Payment (income) or Make Payment (expense) before you go live.",
      },
    ],
    warning:
      "Wrong classification routes money to the wrong side of P&L and Balance Sheet. Fix the group before month-end close.",
    related: ["document-numbers", "classes-fees", "journals", "make-payment"],
  },
  {
    id: "document-numbers",
    category: "finance",
    title: "Document numbers and prefixes",
    summary:
      "Set receipt and payment prefixes (for example RC-00001, PAY-00001) so each campus keeps a clear sequence.",
    minutes: 2,
    access: { kind: "settings", tab: "system" },
    procedure: "setup",
    keywords: [
      "document number",
      "prefix",
      "sequence",
      "receipt number",
      "voucher number",
      "RC",
      "PAY",
      "numbering",
    ],
    openTo: { href: "/tenant/settings?tab=system", label: "Open System settings" },
    flowchart: {
      title: "Numbering setup",
      mermaid: `flowchart LR
  openNode[Open_Numbering_Config] --> type[Pick_Document_Type]
  type --> prefix[Set_Prefix_and_Sequence]
  prefix --> save[Save]
  save --> test[Test_Next_Number_on_Save]`,
    },
    steps: [
      {
        title: "Open numbering settings",
        body: "Settings → System (or Finance document settings). Pick the document type: Receipt, Payment, Journal.",
      },
      {
        title: "Set prefix and starting sequence",
        body: "Examples: RC- for receipts, PAY- for payments. Prefer branch-separated numbering when you run multiple campuses.",
      },
      {
        title: "Save and test",
        body: "Save, then record a test receipt/payment and confirm the next number increments as expected.",
      },
    ],
    related: ["ledgers-setup", "branches", "receive-payment"],
  },
  {
    id: "queued-payments",
    category: "finance",
    title: "Queued and cleared payments",
    summary:
      "Record a payment as Queued until cash or bank actually leaves, then mark Cleared — never clear early.",
    minutes: 2,
    access: { kind: "finance", view: "make" },
    procedure: "daily",
    keywords: ["queued", "cleared", "pending payment", "clear payment", "status", "cash control"],
    openTo: { href: "/tenant/finance?tab=make", label: "Open Make Payment" },
    flowchart: {
      title: "Queued to cleared lifecycle",
      mermaid: `flowchart TD
  record[Record_Payment] --> queued[Status_Queued]
  queued --> pay[Actually_Pay_from_Cash_or_Bank]
  pay --> clear[Mark_Cleared]
  clear --> books[Cash_and_Bank_Updated]
  queued -->|Do_not_clear_early| wait[Wait_Until_Real_Payment]`,
    },
    steps: [
      {
        title: "Record the payment",
        body: "Save from Make Payment. Some payments stay Queued until funds actually leave Cash or Bank.",
      },
      {
        title: "Pay from Cash or Bank",
        body: "Hand over cash, initiate UPI/NEFT, or issue the cheque. Only then is the payment real.",
      },
      {
        title: "Mark Cleared",
        body: "Clear the payment after the real outflow. Clearing early makes Day Book and bank balances lie.",
      },
    ],
    warning: "Do not mark Cleared before the money actually leaves. It breaks end-of-day cash control.",
    related: ["make-payment", "daybook", "reconciliation", "accounts-errors"],
  },
  {
    id: "fee-break",
    category: "finance",
    title: "Fee break (exempt a fee line)",
    summary:
      "Exempt a student’s fee line for a period so it is not collected in Receive Payment.",
    minutes: 2,
    access: { kind: "finance", view: "fees" },
    keywords: ["fee break", "exempt", "waive period", "skip fee", "holiday fee"],
    openTo: { href: "/tenant/finance?tab=fees", label: "Open Fees Report" },
    flowchart: {
      title: "Fee break path",
      mermaid: `flowchart LR
  identify[Identify_Student_and_Period] --> breakNode[Apply_Fee_Break]
  breakNode --> save[Save]
  save --> confirm[Confirm_Not_Collected_in_Receive]`,
    },
    steps: [
      {
        title: "Identify student and period",
        body: "Find the student and the fee period/line that should not be collected (for example a waived month).",
      },
      {
        title: "Apply Fee Break",
        body: "Use Fee Break on that fee line and Save.",
      },
      {
        title: "Confirm in Receive Payment",
        body: "Open Receive Payment for that student — the broken line should not appear as collectable.",
      },
    ],
    related: ["concessions", "fees-report", "receive-payment"],
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
    related: ["classes-fees", "fee-break", "fees-report"],
  },
  {
    id: "journals",
    category: "finance",
    title: "Manual journal and opening balances",
    summary:
      "Post adjustments where Total Debit equals Total Credit, and enter opening balances when going live mid-year.",
    minutes: 4,
    access: { kind: "finance", view: "journals" },
    procedure: "setup",
    keywords: [
      "journal",
      "voucher",
      "edit",
      "delete",
      "opening balance",
      "debit",
      "credit",
      "correction",
      "manual journal",
    ],
    openTo: { href: "/tenant/finance?tab=journals", label: "Open Journals" },
    flowchart: {
      title: "Manual journal rule",
      mermaid: `flowchart TD
  openNode[Open_Manual_Journal] --> lines[Add_Two_or_More_Lines]
  lines --> balance{Total_Debit_Equals_Credit}
  balance -->|Yes| save[Save]
  balance -->|No| fix[Adjust_Amounts]
  fix --> balance
  save --> ledger[Visible_in_Ledger_and_TB]`,
    },
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
        body: "Tap New journal. Add at least two lines with accounts and Debit/Credit. Total Debit must equal Total Credit before Save.",
      },
      {
        title: "Opening balances (go-live)",
        body: "When starting Feezo mid-year, use Opening balances for existing Cash, Bank and Balance Sheet accounts. Balance the opening journal, then Save before daily transactions.",
      },
    ],
    warning:
      "Deleting a voucher changes balances in every report for that year. Edit instead of delete where possible. Same account cannot appear on both sides of one voucher.",
    related: ["year-close", "trial-balance", "ledger", "ledgers-setup"],
  },
  {
    id: "daily-ops",
    category: "finance",
    title: "Daily operating procedure",
    summary:
      "Start-of-day checks, fee collection, expenses, then Day Book cash close — the accounts desk rhythm.",
    minutes: 3,
    access: { kind: "finance", view: "daybook" },
    procedure: "daily",
    keywords: [
      "daily",
      "operating procedure",
      "start of day",
      "end of day",
      "cash count",
      "routine",
      "accounts desk",
    ],
    openTo: { href: "/tenant/finance?tab=daybook", label: "Open Day Book" },
    flowchart: {
      title: "Daily accounts rhythm",
      mermaid: `flowchart TD
  start[Start_Confirm_Campus_and_Year] --> collect[Collect_Fees_Receive_Payment]
  collect --> expense[Record_Expenses_Make_Payment]
  expense --> eod[End_of_Day_Day_Book]
  eod --> cash[Compare_System_vs_Physical_Cash]
  cash --> bank[Review_Bank_and_UPI_Lines]`,
    },
    steps: [
      {
        title: "Start of day",
        body: "Confirm Campus / Branch and Academic Year. Clear any pending queued payments that were paid overnight.",
      },
      {
        title: "During fee collection",
        body: "Student → fee category → amount → mode → save → receipt. Keep modes accurate (Cash vs Bank/UPI).",
      },
      {
        title: "When an expense occurs",
        body: "Make Payment → correct ledger → amount → mode → narration → save. Clear only after real payment.",
      },
      {
        title: "End of day",
        body: "Open Day Book for today. Compare system cash with physical cash. Review bank/UPI lines. Investigate differences before leaving.",
      },
    ],
    related: ["receive-payment", "make-payment", "daybook", "monthly-close"],
  },
  {
    id: "monthly-close",
    category: "finance",
    title: "Monthly closing procedure",
    summary:
      "Fees → Salary → Day Book → Bank Rec → Ledgers → Trial Balance → P&L → Balance Sheet before you call the month closed.",
    minutes: 5,
    access: { kind: "finance", view: "trial" },
    procedure: "monthly",
    keywords: [
      "monthly close",
      "month end",
      "closing",
      "trial balance",
      "profit and loss",
      "balance sheet",
      "accounts close",
    ],
    openTo: { href: "/tenant/finance?tab=trial", label: "Open Trial Balance" },
    flowchart: {
      title: "Month-end close sequence",
      mermaid: `flowchart TD
  fees[Fees_Report_Outstanding] --> salary[Salary_Report]
  salary --> daybook[Month_Day_Book]
  daybook --> bank[Bank_Reconciliation]
  bank --> ledgers[Key_Income_Expense_Ledgers]
  ledgers --> tb[Trial_Balance_Dr_Equals_Cr]
  tb --> pl[Profit_and_Loss]
  pl --> bs[Balance_Sheet]`,
    },
    steps: [
      {
        title: "Fees and salary",
        body: "Run Fees Report for outstanding. Review Salary Report for the month and clear any held payments.",
      },
      {
        title: "Day Book and bank",
        body: "Review the month’s Day Book. Complete Bank Reconciliation until Difference = 0.",
      },
      {
        title: "Spot-check ledgers",
        body: "Open key Income and Expense ledgers. Drill unusual lines back to the source receipt or payment.",
      },
      {
        title: "Trial Balance, P&L, Balance Sheet",
        body: "Confirm Trial Balance Debit = Credit. Review Profit & Loss (Income − Expenses). Confirm Balance Sheet Assets = Liabilities + Equity.",
      },
    ],
    related: ["fees-report", "daybook", "reconciliation", "trial-balance", "pl-report", "balance-sheet"],
  },
  {
    id: "accounts-errors",
    category: "finance",
    title: "Common accounts errors and controls",
    summary:
      "Wrong campus, year, ledger, mode or duplicate entries — how to spot them and fix at the source.",
    minutes: 3,
    access: { kind: "finance", view: "overview" },
    keywords: [
      "error",
      "control",
      "wrong campus",
      "wrong year",
      "wrong ledger",
      "duplicate",
      "troubleshoot",
      "accounts",
    ],
    flowchart: {
      title: "Error decision tree",
      mermaid: `flowchart TD
  symptom[Something_Looks_Wrong] --> where{Where}
  where -->|Wrong_campus_or_year| switch[Switch_Header_and_Re_enter]
  where -->|Wrong_ledger| edit[Edit_at_Source_Receipt_or_Payment]
  where -->|Queued_too_early| clear[Clear_Only_After_Real_Pay]
  where -->|TB_not_balanced| journal[Check_Manual_Journal_and_Opening]
  where -->|Analytics_odd| source[Trace_to_Receive_or_Make_Payment]`,
    },
    steps: [
      {
        title: "Wrong campus or year",
        body: "Receipts belong to the campus and year open at save time. Delete/correct, switch the header, then re-enter.",
      },
      {
        title: "Wrong ledger or mode",
        body: "Edit the receipt or payment at the source. Do not try to “fix” Analytics — correct the transaction.",
      },
      {
        title: "Queued vs cleared",
        body: "Clear only after cash/bank actually moves. Early clear breaks Day Book cash counts.",
      },
      {
        title: "Trial Balance off",
        body: "Find the unbalanced account → open Ledger → fix the source voucher or opening journal.",
      },
    ],
    related: ["switch-campus-year", "queued-payments", "journals", "trial-balance", "analytics"],
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
    related: ["academic-year", "journals", "balance-sheet", "monthly-close"],
  },

  /* --------------------------------- Reports --------------------------------- */
  {
    id: "fees-report",
    category: "reports",
    title: "Fee follow-up and outstanding fees",
    summary:
      "Review Paid / Partially Paid / Outstanding by class or student, then collect or follow up.",
    minutes: 2,
    access: { kind: "finance", view: "fees" },
    procedure: "monthly",
    keywords: [
      "fees report",
      "due",
      "overdue",
      "outstanding",
      "collection",
      "pending",
      "defaulters",
      "follow-up",
    ],
    openTo: { href: "/tenant/finance?tab=fees", label: "Open Fees Report" },
    flowchart: {
      title: "Outstanding follow-up",
      mermaid: `flowchart TD
  openNode[Open_Fees_Report] --> period[Select_Period]
  period --> status{Fee_Status}
  status -->|Paid| done[No_Action]
  status -->|Partial| collect[Collect_Balance_Receive_Payment]
  status -->|Outstanding| follow[Class_or_Student_Follow_Up]
  follow --> collect`,
    },
    steps: [
      {
        title: "Open Fees Report",
        body: "Finance → Fees Report. Select the period if needed.",
      },
      {
        title: "Review statuses",
        body: "Check Paid, Partially Paid and Outstanding lines. Note outstanding totals by class.",
      },
      {
        title: "Act on gaps",
        body: "Drill class- or student-wise views. Collect remaining dues in Receive Payment, or send Bulk WhatsApp reminders from Students.",
      },
    ],
    related: ["receive-payment", "bulk-actions", "concessions", "monthly-close"],
  },
  {
    id: "daybook",
    category: "reports",
    title: "Day Book: end-of-day cash control",
    summary:
      "Review today's inflows and outflows, compare system cash with physical cash, then investigate differences.",
    minutes: 2,
    access: { kind: "finance", view: "daybook" },
    procedure: "daily",
    keywords: ["day book", "daily", "cash count", "today", "closing", "end of day", "physical cash"],
    openTo: { href: "/tenant/finance?tab=daybook", label: "Open Day Book" },
    flowchart: {
      title: "End-of-day Day Book",
      mermaid: `flowchart TD
  openNode[Open_Day_Book_Today] --> review[Review_Inflows_and_Outflows]
  review --> system[Check_System_Cash_Balance]
  system --> physical[Count_Physical_Cash]
  physical --> match{Balances_Match}
  match -->|Yes| done[Day_Closed]
  match -->|No| investigate[Investigate_Missing_or_Wrong_Mode]`,
    },
    steps: [
      {
        title: "Open Day Book for today",
        body: "Finance → Day Book. Confirm the date is today (or the day you are closing).",
      },
      {
        title: "Review inflows and outflows",
        body: "Scan receipts and payments. Watch for wrong payment modes (Cash recorded as Bank).",
      },
      {
        title: "Compare system vs physical cash",
        body: "Match Feezo’s cash balance to the drawer. Investigate any difference before you leave.",
      },
    ],
    related: ["receive-payment", "make-payment", "reconciliation", "daily-ops"],
  },
  {
    id: "salary-report",
    category: "reports",
    title: "Salary report",
    summary: "Payroll paid and still owed per month.",
    minutes: 1,
    access: { kind: "finance", view: "salary" },
    procedure: "monthly",
    keywords: ["salary report", "payroll", "staff payable"],
    openTo: { href: "/tenant/finance?tab=salary", label: "Open Salary Report" },
    steps: [
      {
        title: "Open it",
        body: "Finance → Salary Report shows paid and held salaries by staff and month.",
      },
      {
        title: "Pay what is pending",
        body: "Held salaries can be paid from Make payment → Salary. Check Staff Salary History after save.",
      },
    ],
    related: ["salary-setup", "make-payment", "monthly-close"],
  },
  {
    id: "reconciliation",
    category: "reports",
    title: "Bank reconciliation",
    summary: "Match Feezo bank/UPI lines to the statement until Difference equals zero.",
    minutes: 3,
    access: { kind: "finance", view: "reconciliation" },
    procedure: "monthly",
    keywords: ["reconciliation", "bank statement", "match", "cleared", "bank balance", "difference"],
    openTo: { href: "/tenant/finance?tab=reconciliation", label: "Open Bank Reconciliation" },
    flowchart: {
      title: "Bank reconciliation",
      mermaid: `flowchart TD
  openNode[Open_Bank_Reconciliation] --> stmt[Enter_Statement_Total]
  stmt --> match[Match_Feezo_Bank_UPI_Lines]
  match --> diff{Difference_Equals_Zero}
  diff -->|Yes| done[Reconciled]
  diff -->|No| investigate[Find_Missing_Charges_or_Transfers]
  investigate --> match`,
    },
    steps: [
      {
        title: "Open Bank Reconciliation",
        body: "Finance → Bank Reconciliation lists every bank and UPI receipt and payment.",
      },
      {
        title: "Enter the statement total",
        body: "Type the closing balance from your bank statement.",
      },
      {
        title: "Match until Difference = 0",
        body: "Select matching lines. Untick items the bank has not shown yet. Investigate bank charges or unrecorded transfers until the difference is zero.",
      },
    ],
    related: ["fund-transfer", "daybook", "monthly-close"],
  },
  {
    id: "analytics",
    category: "reports",
    title: "Analytics (investigate at source)",
    summary:
      "Use charts to spot odd amounts — never edit Analytics; correct the Receive or Make Payment that caused it.",
    minutes: 2,
    access: { kind: "finance", view: "analytics" },
    keywords: ["analytics", "charts", "insights", "trend", "graph", "investigate"],
    openTo: { href: "/tenant/finance?tab=analytics", label: "Open Analytics" },
    flowchart: {
      title: "Analytics investigation",
      mermaid: `flowchart TD
  spot[Spot_Odd_Amount] --> noEdit[Do_Not_Edit_Analytics]
  noEdit --> trace[Trace_Receive_or_Make_Payment]
  trace --> fix[Correct_at_Source]
  fix --> recheck[Re_check_Analytics]`,
    },
    steps: [
      {
        title: "Open Analytics",
        body: "Finance → Analytics shows where money comes from and where it goes.",
      },
      {
        title: "Investigate, don’t edit",
        body: "If a category looks wrong, open the source receipt or payment and fix it there. Analytics refreshes from transactions.",
      },
      {
        title: "Use it monthly",
        body: "Compare months to spot falling collections or rising expenses early.",
      },
    ],
    related: ["receive-payment", "make-payment", "pl-report", "accounts-errors"],
  },
  {
    id: "ledger",
    category: "reports",
    title: "Ledger review",
    summary: "Opening, Debit, Credit and Closing for one account — drill unusual lines to the source.",
    minutes: 2,
    access: { kind: "finance", view: "ledger" },
    procedure: "monthly",
    keywords: ["ledger", "account statement", "running balance", "general ledger", "opening", "closing"],
    openTo: { href: "/tenant/finance?tab=ledger", label: "Open Ledger" },
    steps: [
      {
        title: "Pick an account",
        body: "Finance → Ledger, then choose Cash, a bank, Tuition Fee or an expense ledger.",
      },
      {
        title: "Review balances",
        body: "Check Opening, Debit, Credit and Closing. Unusual spikes deserve a drill-down.",
      },
      {
        title: "Open the source",
        body: "Tap any line to open the receipt, payment or journal behind it and correct if needed.",
      },
    ],
    related: ["journals", "trial-balance", "ledgers-setup", "monthly-close"],
  },
  {
    id: "trial-balance",
    category: "reports",
    title: "Trial balance",
    summary: "Confirm Debit total equals Credit total for the period — first gate of month-end.",
    minutes: 2,
    access: { kind: "finance", view: "trial" },
    procedure: "monthly",
    keywords: ["trial balance", "debit", "credit", "balanced", "check", "month end"],
    openTo: { href: "/tenant/finance?tab=trial", label: "Open Trial Balance" },
    steps: [
      {
        title: "Open Trial Balance",
        body: "Finance → Trial Balance. Select the period you are closing.",
      },
      {
        title: "Confirm Debit = Credit",
        body: "Totals must match. If not, open the unbalanced account in Ledger and fix the source voucher or opening journal.",
      },
    ],
    related: ["journals", "ledger", "balance-sheet", "monthly-close", "accounts-errors"],
  },
  {
    id: "pl-report",
    category: "reports",
    title: "Profit & Loss",
    summary: "Fee and other income versus salary and expenses — Net = Income − Expenses.",
    minutes: 2,
    access: { kind: "finance", view: "pl" },
    procedure: "monthly",
    keywords: ["profit", "loss", "p&l", "pl", "income statement", "surplus", "deficit"],
    openTo: { href: "/tenant/finance?tab=pl", label: "Open Profit & Loss" },
    steps: [
      {
        title: "Open Profit & Loss",
        body: "Finance → Profit & Loss for the period. Review fee income, other income, salary and other expenses.",
      },
      {
        title: "Read the net",
        body: "Net = Income − Expenses (surplus or deficit). Export PDF/CSV for management or auditor.",
      },
    ],
    related: ["balance-sheet", "year-close", "monthly-close", "make-payment"],
  },
  {
    id: "balance-sheet",
    category: "reports",
    title: "Balance sheet",
    summary: "Assets, Liabilities and Equity on a date — Assets must equal Liabilities + Equity.",
    minutes: 2,
    access: { kind: "finance", view: "balance" },
    procedure: "monthly",
    keywords: ["balance sheet", "assets", "liabilities", "equity", "retained earnings"],
    openTo: { href: "/tenant/finance?tab=balance", label: "Open Balance Sheet" },
    steps: [
      {
        title: "Open Balance Sheet",
        body: "Finance → Balance Sheet for the period. Review Assets (cash, bank, receivables) and Liabilities.",
      },
      {
        title: "Confirm the equation",
        body: "Assets = Liabilities + Equity. If Suspense shows an amount, reopen/close books or fix the source entry.",
      },
    ],
    related: ["year-close", "trial-balance", "monthly-close"],
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
    summary:
      "Confirm the working year before every save, then add or manage years in System settings.",
    minutes: 2,
    access: { kind: "settings", tab: "system" },
    procedure: "setup",
    keywords: ["academic year", "financial year", "add year", "new year", "AY", "confirm year"],
    openTo: { href: "/tenant/settings?tab=system", label: "Open System settings" },
    flowchart: {
      title: "Year selection gate",
      mermaid: `flowchart TD
  check[Check_Selected_Year_in_Header] --> match{Matches_Work_Period}
  match -->|Yes| proceed[Proceed_with_Transactions]
  match -->|No| select[Select_Correct_Year]
  select --> proceed`,
    },
    steps: [
      {
        title: "Confirm the year in the header",
        body: "Before Receive/Make Payment, check the Academic Year in the top bar matches the period you are working on (for example 2025–26).",
      },
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
    related: ["year-close", "switch-campus-year", "document-numbers"],
  },
  {
    id: "branches",
    category: "settings",
    title: "Campus / Branch",
    summary:
      "Confirm the correct campus before every save — books and receipts are campus-scoped.",
    minutes: 2,
    access: { kind: "settings", tab: "branches" },
    procedure: "setup",
    keywords: ["branch", "campus", "multi campus", "location", "confirm campus"],
    openTo: { href: "/tenant/settings?tab=branches", label: "Open Branches" },
    flowchart: {
      title: "Campus check before save",
      mermaid: `flowchart TD
  openNode[Open_Finance] --> header[Check_Header_Campus]
  header --> select[Select_Correct_Branch]
  select --> recheck[Re_check_Before_Every_Save]
  recheck --> save[Save_Transaction]`,
    },
    steps: [
      {
        title: "Check the header Campus / Branch",
        body: "Every receipt and payment posts to the campus open in the top bar. Re-check before each save.",
      },
      {
        title: "Add a campus",
        body: "Settings → Branches, or the campus menu in the top bar → Add branch.",
        tip: "Multiple campuses need the Premium or Enterprise plan.",
      },
      {
        title: "Switch between them",
        body: "Pick the campus from the top bar. Each campus has its own students, ledgers and receipts.",
      },
    ],
    related: ["switch-campus-year", "team-users", "document-numbers", "ledgers-setup"],
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
      "google",
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
        title: "Sign in with Google (optional)",
        body: "Staff can open **feezo.app/login** and use **Continue with Google** when that Google email matches an existing Feezo user. Create the login here first — Google does not create new school accounts by itself.",
        tip: "Parents still sign in on the parent portal with phone + password, not Google.",
      },
      {
        title: "Reset a password",
        body: "On the user row, tap Send reset link — they get an email and choose a new password. Locked-out users can also use Forgot password on the staff sign-in page.",
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
    related: ["branches", "google-sign-in", "parent-portal"],
  },
  {
    id: "google-sign-in",
    category: "settings",
    title: "Sign in with Google",
    summary: "Staff and admins can use Google on the school login page when their email already exists in Feezo.",
    minutes: 2,
    keywords: [
      "google",
      "sign in",
      "login",
      "oauth",
      "continue with google",
      "gmail",
      "staff login",
    ],
    openTo: { href: "/login", label: "Open staff login" },
    steps: [
      {
        title: "Use the staff login page",
        body: "Go to **feezo.app/login** (school staff and super admin). Parent accounts use **/family/login** instead.",
      },
      {
        title: "Continue with Google",
        body: "Tap **Continue with Google**, choose the Google account, and return to Feezo in the same tab.",
      },
      {
        title: "Email must already exist",
        body: "Feezo matches the verified Google email to an existing school user or super admin. If there is no matching login, ask your school admin to create one under **Settings → Users** first.",
        warning: "Google sign-in does not create a new school trial or parent account.",
      },
    ],
    related: ["team-users", "parent-portal"],
  },
  {
    id: "parent-portal",
    category: "start",
    title: "Parent portal sign-in",
    summary: "Parents open fees and updates with the phone number the school has on file.",
    minutes: 2,
    keywords: [
      "parent",
      "family",
      "guardian",
      "parent login",
      "parent portal",
      "phone login",
      "family app",
    ],
    openTo: { href: "/family/login", label: "Open parent login" },
    steps: [
      {
        title: "Open the parent portal",
        body: "Go to **feezo.app/family/login** (or Parent sign in from the staff login page).",
      },
      {
        title: "Sign in with phone",
        body: "Enter the mobile number saved on the student’s record and the parent password. If the phone is linked to more than one school, pick the school when asked.",
      },
      {
        title: "School side",
        body: "Admins keep guardian phones up to date on the student profile and can invite parents from the Parents app tools where available.",
        tip: "Parents do not use Continue with Google — that is only for staff on /login.",
      },
    ],
    related: ["student-profile", "google-sign-in", "mobile-app"],
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
    openTo: { href: "/tenant/settings?tab=subscription", label: "Open Subscription" },
    steps: [
      {
        title: "Open Subscription",
        body: "Settings → Subscription shows your plan, Renewal date, Auto-renewal and Renewal price.",
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
      "Open the receipt or payment from Payment History / Made Payment Details, note the details, delete it, then switch to the correct campus or year and record it again. Always re-check the header before the next save.",
    guideId: "accounts-errors",
  },
  {
    id: "balances-mismatch",
    question: "Balances don't match / trial balance is off",
    answer:
      "Open Trial Balance and find accounts where Debit ≠ Credit. Drill into Ledger, then fix the source receipt, payment, opening balance or manual journal. If Suspense appears on the Balance Sheet after an older year-end close, Reopen books then Close books again.",
    guideId: "trial-balance",
  },
  {
    id: "queued-vs-cleared",
    question: "What is the difference between Queued and Cleared?",
    answer:
      "Queued means the payment is recorded but cash/bank has not left yet. Mark Cleared only after you actually pay. Clearing early makes Day Book and bank balances incorrect.",
    guideId: "queued-payments",
  },
  {
    id: "wrong-ledger",
    question: "I posted to the wrong ledger or Account Group",
    answer:
      "Edit the receipt or payment at the source and choose the correct ledger. Never put an expense under Income (or vice versa) — it distorts Profit & Loss. For chart setup, see Account groups and ledgers.",
    guideId: "ledgers-setup",
  },
  {
    id: "student-due-wrong",
    question: "A student's due amount looks wrong",
    answer:
      "Dues come from the class fee schedule minus concessions, fee breaks and receipts. Check Settings → Class Tier, then any concession or Fee Break on the student, then their Payments tab.",
    guideId: "classes-fees",
  },
  {
    id: "bank-diff-not-zero",
    question: "Bank reconciliation difference won't reach zero",
    answer:
      "Look for bank charges, UPI not recorded, cheques not yet cleared, or fund transfers missing in Feezo. Match or untick lines until Difference = 0. Do not invent Analytics edits — fix transactions.",
    guideId: "reconciliation",
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
  {
    id: "google-login-how",
    question: "How do I sign in with Google?",
    answer:
      "Open feezo.app/login and tap Continue with Google. Your Google email must already exist as a Feezo school user or super admin. Parents use /family/login with phone instead.",
    guideId: "google-sign-in",
  },
  {
    id: "biometric-offline",
    question: "Our biometric machine shows Offline",
    answer:
      "Confirm the serial number is registered under Attendance → Devices, the device points at api.feezo.app on port 80 over HTTP for /iclock, and PIN maps exist. Check ADMS logs on the Devices screen after a test punch.",
    guideId: "biometric-devices",
  },
  {
    id: "parent-vs-staff-login",
    question: "Which login should parents use?",
    answer:
      "Parents use feezo.app/family/login with the phone number on the student record. Staff and school admins use feezo.app/login (email/password or Google).",
    guideId: "parent-portal",
  },
];

export type QuickTask = { label: string; guideId: string };

export const HELP_QUICK_TASKS: QuickTask[] = [
  { label: "Collect a fee", guideId: "receive-payment" },
  { label: "Admit a student", guideId: "admit-student" },
  { label: "Mark attendance", guideId: "student-attendance" },
  { label: "Connect biometric", guideId: "biometric-devices" },
  { label: "Set fee structure", guideId: "classes-fees" },
  { label: "Add a team login", guideId: "team-users" },
];
