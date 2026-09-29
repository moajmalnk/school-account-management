import type { InfoTipContent } from "@/components/ui/info-tip";

/* -------------------------------------------------------------------------- */
/*                               School Details                               */
/* -------------------------------------------------------------------------- */

export const SCHOOL_DETAILS_TIP: InfoTipContent = {
  title: "How School Details work",
  points: [
    "Each campus has its own details. Switch campus in the header to edit another one.",
    "The name, logo, letterhead, seal and signature print on fee receipts, payment vouchers, salary slips, fee statements and report PDFs.",
    "Changes apply to documents you download from now on. Receipts already downloaded or shared keep the old look.",
    "Nothing is saved until you press Save Changes. Leaving with unsaved edits asks you first.",
  ],
  note: "Base currency and bank accounts below save on their own. They don't need Save Changes.",
};

export const SCHOOL_MEDIA_TIPS: Record<
  "logo" | "letterhead" | "seal" | "signature",
  InfoTipContent
> = {
  logo: {
    title: "Logo",
    points: [
      "Shown in the sidebar and on PDF headers.",
      "If you upload a letterhead, the letterhead is used on PDFs instead of the logo header.",
      "Also used inside the automatic default seal.",
    ],
  },
  letterhead: {
    title: "Letterhead",
    points: [
      "Replaces the printed header (logo, name, address, phone) on receipts, vouchers, salary slips and statements.",
      "Use a wide banner image so it fills the top of an A4 page.",
      "Remove it to go back to the automatic header built from your school details.",
    ],
  },
  seal: {
    title: "Seal",
    points: [
      "Stamped in the footer of receipts, salary slips and reports.",
      "Without an upload, Feezo draws a default seal from your school name, address and logo.",
      "Removing your upload resets it to that default.",
    ],
  },
  signature: {
    title: "Signature",
    points: [
      "Printed above the signatory line on receipts and slips.",
      "Upload an image or use Draw. Without one, a signature is drawn from the Principal name.",
      "The Principal name prints under it. If blank, it says “Authorized Signatory”.",
    ],
  },
};

export const SCHOOL_TEXT_FIELDS_TIP: InfoTipContent = {
  title: "Which details appear on documents",
  points: [
    "School Name: every PDF header, the sidebar and download file names ({school}).",
    "Address, Phone and Email: the printed PDF header (when no letterhead is uploaded).",
    "Principal: the signatory name under the signature.",
    "Tagline, Website, Registration No., Affiliation No. and Established are kept on record for your school profile.",
  ],
};

export const BASE_CURRENCY_TIP: InfoTipContent = {
  title: "Base currency",
  points: [
    "One currency for the whole organisation (all campuses).",
    "Used on fees, receipts, reports and WhatsApp messages.",
    "Changing it only changes the symbol. Stored amounts are never converted.",
    "Only the school admin can change it. It saves immediately.",
  ],
  note: "Set this once before you start collecting fees.",
};

export const BANK_DETAILS_TIP: InfoTipContent = {
  title: "Bank details",
  points: [
    "Each bank becomes a ledger in this campus's books, under Bank Accounts.",
    "Banks appear in Receive / Make Payment, Fund Transfer, Day Book and Bank Reconciliation.",
    "Enter the IFSC and press Fetch to fill in the bank name and branch.",
    "Remove only hides the bank from new entries. Past transactions stay in the books.",
  ],
};

/* -------------------------------------------------------------------------- */
/*                                  Branches                                  */
/* -------------------------------------------------------------------------- */

export const BRANCHES_TIP: InfoTipContent = {
  title: "How campuses work",
  points: [
    "Each campus keeps its own students, staff, receipts, classes, fees, bus routes, school details and document numbers.",
    "Team users, theme, base currency and the financial year list are shared by all campuses.",
    "Drag rows to set the order in the campus switcher.",
    "The main campus can't be deleted. Other campuses can only be deleted once their students, staff and receipts are removed.",
  ],
  note: "Extra campuses need a Premium or Enterprise plan.",
};

export const BRANCH_COPY_TIP: InfoTipContent = {
  title: "Copy setup from",
  points: [
    "Copies school branding, classes, fee periods, fee categories, departments, positions and leave types from the chosen campus.",
    "Students, staff and receipts are not copied. The new campus starts empty.",
    "Bus routes and vehicles are not copied. Add them on the new campus.",
    "After copying, the two campuses are independent. Editing one doesn't change the other.",
  ],
};

export const BRANCH_CODE_TIP: InfoTipContent = {
  title: "Campus code",
  points: [
    "A short unique code, e.g. MLP or KZD (letters, numbers, - or _).",
    "Must be unique across your organisation.",
    "Tip: use it in document number prefixes (e.g. MLP-R-) so receipt numbers never clash between campuses.",
  ],
};

export const BRANCH_ORDER_TIP: InfoTipContent = {
  title: "Order",
  points: [
    "Position of this campus in the header campus switcher.",
    "You can also drag rows on the Branches list.",
  ],
};

/* -------------------------------------------------------------------------- */
/*                              Class Tier · Classes                          */
/* -------------------------------------------------------------------------- */

export const CLASSES_TIP: InfoTipContent = {
  title: "How class fees work",
  points: [
    "Each class + division has its own tuition schedule. Receive Payment fills the amount from it.",
    "Student dues are calculated live from this schedule. When you change a fee, every student in that class (new and existing) sees the new balance for the current year.",
    "Receipts already recorded are never changed. Only the remaining balance is recalculated.",
    "Students with a tuition concession keep their own concession schedule.",
  ],
  note: "Settings here belong to this campus and the active financial year. A new year starts with a copy of these classes.",
};

export const CLASS_IDENTITY_TIP: InfoTipContent = {
  title: "Class identity",
  points: [
    "Each class + division pair is one row (e.g. Grade 8 - B). A pair can only be added once.",
    "Renaming updates the class on every student currently in it.",
    "Past receipts keep the class name they were printed with.",
    "Class teacher is optional and shown for reference.",
  ],
};

export const CLASS_BILLING_MODE_TIP: InfoTipContent = {
  title: "Monthly or Term billing",
  points: [
    "Monthly: fees are due each calendar month. Fee Collection shows months only.",
    "Term: fees are due per term. Fee Collection shows terms only.",
    "Changing the mode later changes how dues are listed for all students in this class. Payments already received stay as they are.",
  ],
};

export const CLASS_AMOUNTS_TIP: InfoTipContent = {
  title: "Amounts",
  points: [
    "Same each period: one amount for every installment.",
    "Different per period: set each installment's amount in the schedule.",
    "Due dates tell staff and parents when each installment should be paid.",
  ],
};

export const CLASS_START_MONTH_TIP: InfoTipContent = {
  title: "Fee collection starts from",
  points: [
    "Installment 1 is linked to this month.",
    "Example: pick June and installment 1 = June, installment 2 = July, and so on.",
    "Changing it shifts which month each installment belongs to for all students in this class.",
  ],
};

export const CLASS_ONE_TIME_TIP: InfoTipContent = {
  title: "One-time fees",
  points: [
    "Fees charged once a year, like Admission, Registration or Exam fee.",
    "Leave an amount blank to skip that fee.",
    "They are added to the class total and each student's dues.",
  ],
};

/* -------------------------------------------------------------------------- */
/*                         Class Tier · Departments / Positions               */
/* -------------------------------------------------------------------------- */

export const DEPARTMENTS_TIP: InfoTipContent = {
  title: "Departments",
  points: [
    "Groups for your staff, e.g. Teaching, Office, Transport.",
    "Chosen when you recruit or edit staff. The badge shows how many active staff are in each.",
    "Renaming updates the department on every staff member in it.",
    "A department can't be deleted while staff or positions use it. Reassign them first.",
  ],
};

export const POSITIONS_TIP: InfoTipContent = {
  title: "Positions / roles",
  points: [
    "Job titles like Principal, Accountant or Chemistry HOD, each under a department.",
    "Selectable in Recruit Staff and as the Position / Role label on team users.",
    "A position is only a label. Module access for users is set separately in Users.",
    "Renaming updates staff with that title. A position in use can't be deleted.",
  ],
};

/* -------------------------------------------------------------------------- */
/*                                   Leave                                    */
/* -------------------------------------------------------------------------- */

export const LEAVE_TIP: InfoTipContent = {
  title: "Leave types",
  points: [
    "Your campus's list of leave, e.g. Casual, Sick, Personal.",
    "Paid leave is counted as a working day in salary. Unpaid leave is loss of pay.",
    "When paying salary, enter the paid and unpaid leave days for the month. Payable days = days present + paid leave.",
    "Mark a type Inactive to retire it instead of deleting it.",
  ],
  note: "Each campus has its own leave types.",
};

export const LEAVE_PAID_TIP: InfoTipContent = {
  title: "Paid or unpaid",
  points: [
    "Paid: days on this leave are still paid in salary.",
    "Unpaid: days are deducted as loss of pay.",
  ],
};

export const LEAVE_ALLOWANCE_TIP: InfoTipContent = {
  title: "Annual allowance",
  points: [
    "The number of days staff get per year for this leave, for your reference.",
    "Leave blank if there is no fixed limit.",
  ],
};

export const LEAVE_ACTIVE_TIP: InfoTipContent = {
  title: "Active",
  points: [
    "Turn off to retire a leave type without losing its history.",
    "Prefer this over deleting a type you've already used.",
  ],
};

/* -------------------------------------------------------------------------- */
/*                                  Bus Point                                 */
/* -------------------------------------------------------------------------- */

export const ROUTES_TIP: InfoTipContent = {
  title: "How bus fees work",
  points: [
    "Each route is a pickup → drop pair with morning, evening and both-shift fees.",
    "On a student, Bus Point 1 is pickup and Bus Point 2 is drop. Both filled = both shifts; one = morning or evening only.",
    "Vehicle fees are calculated live. Editing a route fee updates the balance of every student on it (new and existing) for the current year.",
    "Receipts already recorded don't change.",
  ],
  note: "Renaming or deleting a route doesn't update students. Their bus point then shows under “missing from routes” so you can fix it.",
};

export const ROUTE_POINTS_TIP: InfoTipContent = {
  title: "Pickup and drop points",
  points: [
    "These names appear in the Bus Point 1 / Bus Point 2 lists on the student form.",
    "Students are matched to a route by these names, so keep them consistent.",
    "Pin the location on the map to open directions later.",
  ],
};

export const ROUTE_FEES_TIP: InfoTipContent = {
  title: "Shift fees",
  points: [
    "Morning: pickup only. Evening: drop only. Both: pickup and drop.",
    "The schedule below uses the both-shift amounts. Morning and evening use the same periods and due dates with their own single amount.",
    "A vehicle concession on a student overrides these fees.",
  ],
};

export const ROUTE_VEHICLES_TIP: InfoTipContent = {
  title: "Assigned vehicles",
  points: [
    "Link the buses that run this route. Only active vehicles are listed.",
    "For reference only. Vehicles don't change fees.",
    "Deleting a route unlinks its vehicles; the vehicles themselves stay.",
  ],
};

export const VEHICLES_TIP: InfoTipContent = {
  title: "Vehicle management",
  points: [
    "Your fleet: owned or rental buses with driver, seats and documents.",
    "Add RC, insurance, pollution and licence expiry dates to get alerts in Notifications before they expire.",
    "Vehicles are for records and alerts. They don't affect student fees.",
    "Uncheck “Active in fleet” to keep a vehicle's history without offering it on routes.",
  ],
};

export const VEHICLE_DOCS_TIP: InfoTipContent = {
  title: "Documents & expiry alerts",
  points: [
    "Enter the Valid until date for each document.",
    "Notify days before sets when the alert appears (default 30 days).",
    "Alerts show under Notifications → Transport. Attach the file to keep a copy.",
  ],
};

/* -------------------------------------------------------------------------- */
/*                                   Users                                    */
/* -------------------------------------------------------------------------- */

export const USERS_TIP: InfoTipContent = {
  title: "How team access works",
  points: [
    "Each user signs in with their own email and password under School Admin.",
    "You choose which campuses they can open and which modules they can use.",
    "Your own administrator login is not listed and always has full access.",
    "Use Login as to check exactly what a user sees, without their password.",
  ],
  note: "Extra team logins need a Premium plan.",
};

export const USER_CAMPUSES_TIP: InfoTipContent = {
  title: "Campuses",
  points: [
    "The user can only switch to the campuses ticked here.",
    "They see only that campus's students, staff and books.",
    "Tick every campus for someone who works across the organisation.",
  ],
};

export const USER_MODULES_TIP: InfoTipContent = {
  title: "Module access",
  points: [
    "All functions: every module in the workspace.",
    "Finance only: all finance screens and Fee categories.",
    "Settings hub opens School, Branches, Class Tier, Leave, Bus Point and System. Fee categories and Team users can be given on their own.",
    "Tip: after saving, use Login as to confirm what the user can see.",
  ],
};

export const USER_ROLE_TIP: InfoTipContent = {
  title: "Position / Role",
  points: [
    "A label from Class Tier → Departments positions.",
    "It doesn't grant any access. Access comes only from Module access.",
  ],
};

export const USER_STAFF_TIP: InfoTipContent = {
  title: "Link staff",
  points: [
    "Connects this login to a staff record so you know who it belongs to.",
    "Each staff member can have only one login.",
    "Deleting the login doesn't delete the staff record.",
  ],
};

export const USER_PASSWORD_TIP: InfoTipContent = {
  title: "Password",
  points: [
    "At least 4 characters. Share it with the user privately.",
    "When editing, typing a password here sets a new password for this user.",
  ],
};

export const USER_ACTIVE_TIP: InfoTipContent = {
  title: "Active (can sign in)",
  points: [
    "Untick to block sign-in without deleting the user.",
    "If they're signed in, their session ends at its next refresh.",
    "Tick again any time to restore access.",
  ],
};

/* -------------------------------------------------------------------------- */
/*                                  Support                                   */
/* -------------------------------------------------------------------------- */

export const SUPPORT_CHAT_TIP: InfoTipContent = {
  title: "Chat with the Feezo team",
  points: [
    "Start a chat to reach real people at Feezo. Each chat is kept here with its full history.",
    "Replies from the team appear in the same chat.",
    "The book icon opens step-by-step help guides.",
    "For instant how-to answers, ask Feezo AI (bottom-right button).",
  ],
};

/* -------------------------------------------------------------------------- */
/*                                   System                                   */
/* -------------------------------------------------------------------------- */

export const SYSTEM_TIP: InfoTipContent = {
  title: "System settings",
  points: [
    "Financial years and the theme apply to the whole organisation.",
    "Document numbers are set per campus.",
    "Theme and download names save automatically as you change them.",
  ],
};

export const FINANCIAL_YEAR_TIP: InfoTipContent = {
  title: "Financial years",
  points: [
    "Add year: copies classes, fee periods, fee categories, departments, positions and bus routes from the current year, then opens the new year. Students start a fresh enrolment list.",
    "Open: makes that year the active books for fees, receipts and reports.",
    "Close: moves a finished year to “Closed years” in the year switcher. Reopen brings it back.",
    "Edit: changes the start/closing months. Receipts, fees and enrolments move to the new label.",
  ],
  note: "Delete permanently removes that year's receipts, enrolments and fee periods, on every campus. It can't be undone.",
};

export const DOCUMENT_NUMBERS_TIP: InfoTipContent = {
  title: "Document numbers",
  points: [
    "Sets the next number for receipts, payment vouchers, salary slips and journals on this campus.",
    "Only new documents use it. Existing numbers never change.",
    "If a number is already taken, Feezo skips to the next free one.",
    "Use a campus prefix (e.g. MLP-R-) so numbers stay unique across campuses.",
  ],
};

export const THEME_TIP: InfoTipContent = {
  title: "Theme",
  points: [
    "Changes how Feezo looks for everyone in your organisation.",
    "Primary and Secondary colours are also used on receipts and PDF reports.",
    "Georgia and Palatino fonts switch PDFs to a serif font.",
    "Saves automatically. Pick a preset to reset colours quickly.",
  ],
};

export const DOWNLOADS_TIP: InfoTipContent = {
  title: "Download file names",
  points: [
    "Sets the file name for each type of download, e.g. receipts and reports.",
    "Use tokens like {name}, {date} or {school}; they're filled in automatically.",
    "Clear a field to go back to the default name. Applies to the whole organisation.",
  ],
};
