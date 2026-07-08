import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type Student = {
  id: string;
  name: string;
  cls: string;
  guardian: string;
  due: number;
  gender?: "M" | "F";
  phone?: string;
  dob?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  active?: boolean;
};

export type StaffDocumentAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
};

export type StaffDocument = {
  id: string;
  label: string;
  number: string;
  attachments: StaffDocumentAttachment[];
};

export const DEFAULT_STAFF_DOCUMENTS: StaffDocument[] = [
  { id: "doc-aadhaar", label: "Aadhaar", number: "", attachments: [] },
  { id: "doc-pan", label: "PAN Card", number: "", attachments: [] },
];

export type Staff = {
  id: string;
  name: string;
  role: string;
  dept: string;
  active: boolean;
  joinedAt: string;
  phone?: string;
  photoUrl?: string;
  basicSalary: number;
  additionalAllowances: number;
  documents: StaffDocument[];
};

function normalizeAttachment(raw: unknown): StaffDocumentAttachment | null {
  if (!raw || typeof raw !== "object") return null;
  const attachment = raw as Partial<StaffDocumentAttachment>;
  if (
    typeof attachment.id !== "string" ||
    typeof attachment.name !== "string" ||
    typeof attachment.dataUrl !== "string" ||
    typeof attachment.size !== "number"
  ) {
    return null;
  }
  return {
    id: attachment.id,
    name: attachment.name,
    mimeType:
      typeof attachment.mimeType === "string" ? attachment.mimeType : "application/octet-stream",
    size: attachment.size,
    dataUrl: attachment.dataUrl,
    uploadedAt:
      typeof attachment.uploadedAt === "string" ? attachment.uploadedAt : new Date().toISOString(),
  };
}

function normalizeStaffDocuments(raw: StaffDocument[] | undefined): StaffDocument[] {
  const byId = new Map(Array.isArray(raw) ? raw.map((d) => [d.id, d]) : []);
  return DEFAULT_STAFF_DOCUMENTS.map((def) => {
    const existing = byId.get(def.id);
    return {
      ...def,
      number: typeof existing?.number === "string" ? existing.number : "",
      attachments: Array.isArray(existing?.attachments)
        ? existing.attachments
            .map(normalizeAttachment)
            .filter((a): a is StaffDocumentAttachment => a !== null)
        : [],
    };
  });
}

export function normalizeStudent(
  raw: Partial<Student> & Pick<Student, "id" | "name" | "cls" | "guardian" | "due">,
): Student {
  return {
    id: raw.id,
    name: raw.name,
    cls: raw.cls,
    guardian: raw.guardian,
    due: typeof raw.due === "number" && Number.isFinite(raw.due) ? raw.due : 0,
    gender: raw.gender === "M" || raw.gender === "F" ? raw.gender : undefined,
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
    dob: typeof raw.dob === "string" ? raw.dob : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    address: typeof raw.address === "string" ? raw.address : undefined,
    photoUrl: typeof raw.photoUrl === "string" && raw.photoUrl ? raw.photoUrl : undefined,
    active: typeof raw.active === "boolean" ? raw.active : true,
  };
}

export function normalizeStaff(raw: Partial<Staff> & Pick<Staff, "id" | "name" | "role" | "dept" | "active">): Staff {
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role,
    dept: raw.dept,
    active: raw.active,
    joinedAt: typeof raw.joinedAt === "string" && raw.joinedAt ? raw.joinedAt : "2025-01-01",
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
    photoUrl: typeof raw.photoUrl === "string" && raw.photoUrl ? raw.photoUrl : undefined,
    basicSalary:
      typeof raw.basicSalary === "number" && Number.isFinite(raw.basicSalary) ? raw.basicSalary : 8000,
    additionalAllowances:
      typeof raw.additionalAllowances === "number" && Number.isFinite(raw.additionalAllowances)
        ? raw.additionalAllowances
        : 0,
    documents: normalizeStaffDocuments(raw.documents),
  };
}

export type Payment = {
  id: string;
  name: string;
  cat: string;
  mode: string;
  amount: number;
  time: string;
};

export type Department = {
  id: string;
  name: string;
  code: string;
};

export type Role = {
  id: string;
  title: string;
  departmentId: string;
};

export type ClassConfig = {
  id: string;
  className: string;
  tuitionFeeAmount: number;
  billingCycle: "Monthly" | "Annually";
};

export type TransportVehicle = {
  id: string;
  name: string;
  registrationNo: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
  routeIds: string[];
  active: boolean;
};

export type TransportRoute = {
  id: string;
  mapFrom: string;
  mapTo: string;
  morningFee: number;
  eveningFee: number;
  bothFee: number;
};

export type PaymentCategory = {
  id: string;
  label: string;
};

export type ThemeSettings = {
  mode: "System" | "Light" | "High Contrast";
  accent: "Neon Lime" | "Pale Lime" | "Ink";
  density: "Comfortable" | "Compact";
};

export type TenantNotification = {
  id: string;
  title: string;
  body: string;
  category: "fees" | "admissions" | "staff" | "system";
  read: boolean;
  createdAt: string;
  timeLabel: string;
  href?: string;
};

const STORAGE_KEY = "school-accounts/tenant-store/v10";
const LEGACY_STORAGE_KEYS = [
  "school-accounts/tenant-store/v9",
  "school-accounts/tenant-store/v8",
  "school-accounts/tenant-store/v7",
  "school-accounts/tenant-store/v6",
  "school-accounts/tenant-store/v5",
  "school-accounts/tenant-store/v4",
  "school-accounts/tenant-store/v3",
] as const;

function normalizeTransportRoute(raw: unknown): TransportRoute | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.mapFrom !== "string" || typeof r.mapTo !== "string") {
    return null;
  }
  const legacyFee = typeof r.fee === "number" ? r.fee : undefined;
  const morningFee =
    typeof r.morningFee === "number"
      ? r.morningFee
      : legacyFee
        ? Math.round(legacyFee * 0.55)
        : 0;
  const eveningFee =
    typeof r.eveningFee === "number"
      ? r.eveningFee
      : legacyFee
        ? Math.round(legacyFee * 0.55)
        : 0;
  const bothFee =
    typeof r.bothFee === "number" ? r.bothFee : (legacyFee ?? morningFee + eveningFee);
  return { id: r.id, mapFrom: r.mapFrom, mapTo: r.mapTo, morningFee, eveningFee, bothFee };
}

function normalizeTransportVehicle(raw: unknown): TransportVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.id !== "string" || typeof v.name !== "string" || typeof v.registrationNo !== "string") {
    return null;
  }
  const routeIds = Array.isArray(v.routeIds)
    ? v.routeIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : typeof v.routeId === "string" && v.routeId
      ? [v.routeId]
      : [];
  return {
    id: v.id,
    name: v.name,
    registrationNo: v.registrationNo,
    capacity: typeof v.capacity === "number" ? v.capacity : 0,
    driverName: typeof v.driverName === "string" ? v.driverName : undefined,
    driverPhone: typeof v.driverPhone === "string" ? v.driverPhone : undefined,
    routeIds,
    active: typeof v.active === "boolean" ? v.active : true,
  };
}

export const DEFAULT_DASHBOARD_TODOS = ["", "", "", "", ""] as const;

function normalizeDashboardTodos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_DASHBOARD_TODOS];
  const items = raw.map((item) => (typeof item === "string" ? item : ""));
  while (items.length < 5) items.push("");
  return items.slice(0, 5);
}

const NOTIFICATION_CATEGORIES = ["fees", "admissions", "staff", "system"] as const;

export const SEED_NOTIFICATIONS: TenantNotification[] = [
  {
    id: "NTF-001",
    title: "Fee reminders pending",
    body: "3 students have overdue balances. Review the watchlist and send reminders.",
    category: "fees",
    read: false,
    createdAt: "2026-07-08T04:30:00.000Z",
    timeLabel: "1h ago",
    href: "/tenant/students",
  },
  {
    id: "NTF-002",
    title: "New admission logged",
    body: "Muhammed was admitted to LKG. Confirm guardian contact details.",
    category: "admissions",
    read: false,
    createdAt: "2026-07-07T11:15:00.000Z",
    timeLabel: "Yesterday",
    href: "/tenant/students",
  },
  {
    id: "NTF-003",
    title: "Staff roster updated",
    body: "A new transport coordinator was added to the staff directory.",
    category: "staff",
    read: false,
    createdAt: "2026-07-06T09:00:00.000Z",
    timeLabel: "2d ago",
    href: "/tenant/staff",
  },
  {
    id: "NTF-004",
    title: "Monthly finance snapshot",
    body: "July operating expenses were recorded. Open finance to review ledgers.",
    category: "system",
    read: true,
    createdAt: "2026-07-01T08:00:00.000Z",
    timeLabel: "1w ago",
    href: "/tenant/finance",
  },
];

function normalizeTenantNotification(raw: unknown): TenantNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const n = raw as Record<string, unknown>;
  if (
    typeof n.id !== "string" ||
    typeof n.title !== "string" ||
    typeof n.body !== "string" ||
    typeof n.createdAt !== "string" ||
    typeof n.timeLabel !== "string"
  ) {
    return null;
  }
  const category = NOTIFICATION_CATEGORIES.includes(n.category as (typeof NOTIFICATION_CATEGORIES)[number])
    ? (n.category as TenantNotification["category"])
    : "system";
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    category,
    read: typeof n.read === "boolean" ? n.read : false,
    createdAt: n.createdAt,
    timeLabel: n.timeLabel,
    href: typeof n.href === "string" ? n.href : undefined,
  };
}

function normalizeNotifications(raw: unknown): TenantNotification[] {
  if (!Array.isArray(raw)) return [...SEED_NOTIFICATIONS];
  const items = raw
    .map(normalizeTenantNotification)
    .filter((n): n is TenantNotification => n !== null);
  return items.length > 0 ? items : [...SEED_NOTIFICATIONS];
}

export const SEED_STUDENTS: Student[] = [
  {
    id: "STU-2847",
    name: "Muhammed",
    cls: "LKG",
    guardian: "Hira Abbas",
    due: 5500,
    gender: "M",
    phone: "9744001122",
    dob: "15 Jan 2021",
    email: "muhammed@silverhills.in",
    address: "Flat 8, Marina Crest, MG Road, Kochi 682016",
  },
  {
    id: "STU-2848",
    name: "Fathima",
    cls: "LKG",
    guardian: "Ibrahim",
    due: 0,
    gender: "F",
    phone: "9747122456",
    dob: "22 Apr 2021",
    email: "fathima@silverhills.in",
    address: "12 Palm Grove, Edappally, Kochi 682024",
  },
  {
    id: "STU-2841",
    name: "Aarav Sharma",
    cls: "Grade 8 - B",
    guardian: "Vinod Sharma",
    due: 4500,
    gender: "M",
    phone: "9810045221",
    dob: "14 Mar 2012",
    email: "aarav.sharma@silverhills.in",
    address: "B-204, Lotus Greens, Sector 21, Noida 201301",
  },
  {
    id: "STU-2842",
    name: "Hira Abbas",
    cls: "LKG - M",
    guardian: "Iqbal Abbas",
    due: 5500,
    gender: "F",
    phone: "9744001048",
    dob: "08 Sep 2020",
    email: "hira.abbas@silverhills.in",
    address: "Flat 12, Marina Crest, MG Road, Kochi 682016",
  },
  {
    id: "STU-2843",
    name: "Meera Iyer",
    cls: "Grade 10 - A",
    guardian: "Devanand Iyer",
    due: 0,
    gender: "F",
    phone: "9886541230",
    dob: "22 Jul 2009",
    email: "meera.iyer@silverhills.in",
    address: "47 Brigade Pinnacle, Whitefield, Bengaluru 560066",
  },
  {
    id: "STU-2844",
    name: "Kabir Khanna",
    cls: "Grade 6 - C",
    guardian: "Anjali Khanna",
    due: 2200,
    gender: "M",
    phone: "9920031144",
    dob: "30 Jan 2014",
    email: "kabir.khanna@silverhills.in",
    address: "A-9, Hiranandani Gardens, Powai, Mumbai 400076",
  },
  {
    id: "STU-2845",
    name: "Tara Mehta",
    cls: "Grade 4 - B",
    guardian: "Rohan Mehta",
    due: 800,
    gender: "F",
    phone: "9745882214",
    dob: "11 Oct 2016",
    email: "tara.mehta@silverhills.in",
    address: "12 Cumballa Heights, Peddar Road, Mumbai 400026",
  },
  {
    id: "STU-2846",
    name: "Yash Pillai",
    cls: "Grade 12 - A",
    guardian: "Latha Pillai",
    due: 12300,
    gender: "M",
    phone: "9447112209",
    dob: "05 Feb 2008",
    email: "yash.pillai@silverhills.in",
    address: "House 21, Sasthamangalam, Thiruvananthapuram 695010",
  },
];

export const SEED_STAFF: Staff[] = [
  {
    id: "STF-018",
    name: "Abdulla",
    role: "Teacher",
    dept: "LP",
    active: true,
    joinedAt: "2022-08-15",
    phone: "9847012345",
    basicSalary: 42000,
    additionalAllowances: 4000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "4567 8901 2345", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "ABDUL5678K", attachments: [] },
    ],
  },
  {
    id: "STF-019",
    name: "Ayisha",
    role: "Teacher",
    dept: "LKG",
    active: true,
    joinedAt: "2021-06-01",
    phone: "9876543210",
    basicSalary: 38000,
    additionalAllowances: 3500,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "2345 6789 0123", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "AYISH1234P", attachments: [] },
    ],
  },
  {
    id: "STF-020",
    name: "Shamina",
    role: "Accountant",
    dept: "Administrative",
    active: true,
    joinedAt: "2020-04-10",
    phone: "9895011223",
    basicSalary: 52000,
    additionalAllowances: 6000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "5678 9012 3456", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "SHAMI9012L", attachments: [] },
    ],
  },
  {
    id: "STF-021",
    name: "Fathima",
    role: "Teacher",
    dept: "UKG",
    active: true,
    joinedAt: "2023-01-12",
    phone: "9765432109",
    basicSalary: 36000,
    additionalAllowances: 3000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "3456 7890 1234", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "FATHM3456H", attachments: [] },
    ],
  },
  {
    id: "STF-022",
    name: "Rahul",
    role: "Teacher",
    dept: "Grade 1",
    active: true,
    joinedAt: "2022-11-05",
    phone: "9812345678",
    basicSalary: 40000,
    additionalAllowances: 3500,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "6789 0123 4567", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "RAHUL6789M", attachments: [] },
    ],
  },
  {
    id: "STF-023",
    name: "Sneha",
    role: "Teacher",
    dept: "Grade 5",
    active: true,
    joinedAt: "2021-08-20",
    phone: "9823456789",
    basicSalary: 41000,
    additionalAllowances: 4000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "7890 1234 5678", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "SNEHA7890N", attachments: [] },
    ],
  },
  {
    id: "STF-024",
    name: "Vikram",
    role: "Teacher",
    dept: "Grade 8",
    active: true,
    joinedAt: "2019-07-15",
    phone: "9834567890",
    basicSalary: 44000,
    additionalAllowances: 4500,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "8901 2345 6789", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "VIKRM8901Q", attachments: [] },
    ],
  },
  {
    id: "STF-025",
    name: "Lakshmi",
    role: "Teacher",
    dept: "Grade 10",
    active: true,
    joinedAt: "2018-06-01",
    phone: "9845678901",
    basicSalary: 46000,
    additionalAllowances: 5000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "9012 3456 7890", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "LAKSH9012R", attachments: [] },
    ],
  },
  {
    id: "STF-026",
    name: "Joseph",
    role: "Teacher",
    dept: "Grade 12",
    active: true,
    joinedAt: "2017-05-18",
    phone: "9856789012",
    basicSalary: 48000,
    additionalAllowances: 5500,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "0123 4567 8901", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "JOSEP0123S", attachments: [] },
    ],
  },
  {
    id: "STF-027",
    name: "Priya",
    role: "Office Administrator",
    dept: "Administrative",
    active: true,
    joinedAt: "2020-09-01",
    phone: "9867890123",
    basicSalary: 50000,
    additionalAllowances: 5000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "1234 5678 9012", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "PRIYA1234T", attachments: [] },
    ],
  },
];

export const SEED_PAYMENTS: Payment[] = [
  {
    id: "RC-9821",
    name: "Aarav Sharma",
    cat: "Tuition Fee",
    mode: "UPI",
    amount: 4500,
    time: "Today · 10:22",
  },
  {
    id: "RC-9820",
    name: "Meera Iyer",
    cat: "Vehicle Fee",
    mode: "Bank",
    amount: 1800,
    time: "Today · 09:51",
  },
  {
    id: "RC-9819",
    name: "Kabir Khanna",
    cat: "Tuition Fee",
    mode: "Cash",
    amount: 2200,
    time: "Yesterday",
  },
  {
    id: "RC-9818",
    name: "Hira Abbas",
    cat: "Donation",
    mode: "UPI",
    amount: 1000,
    time: "Yesterday",
  },
  {
    id: "RC-9817",
    name: "Tara Mehta",
    cat: "Tuition Fee",
    mode: "Bank",
    amount: 3200,
    time: "2d ago",
  },
];

export const SEED_DEPARTMENTS: Department[] = [
  { id: "DEP-001", name: "Senior Wing", code: "SNR-WNG" },
  { id: "DEP-002", name: "Junior Wing", code: "JNR-WNG" },
  { id: "DEP-003", name: "Administration", code: "ADM" },
  { id: "DEP-004", name: "Co-curricular", code: "COC" },
  { id: "DEP-005", name: "Support", code: "SUP" },
];

export const SEED_ROLES: Role[] = [
  { id: "ROL-001", title: "Mathematics · HOD", departmentId: "DEP-001" },
  { id: "ROL-002", title: "Physics Faculty", departmentId: "DEP-001" },
  { id: "ROL-003", title: "Principal Office", departmentId: "DEP-003" },
  { id: "ROL-004", title: "Sports Coordinator", departmentId: "DEP-004" },
];

export const SEED_CLASSES: ClassConfig[] = [
  { id: "CLS-001", className: "LKG - M", tuitionFeeAmount: 3273, billingCycle: "Monthly" },
  { id: "CLS-002", className: "Grade 4 - B", tuitionFeeAmount: 4000, billingCycle: "Monthly" },
  { id: "CLS-003", className: "Grade 6 - C", tuitionFeeAmount: 4500, billingCycle: "Monthly" },
  { id: "CLS-004", className: "Grade 8 - B", tuitionFeeAmount: 5200, billingCycle: "Monthly" },
  { id: "CLS-005", className: "Grade 10 - A", tuitionFeeAmount: 6800, billingCycle: "Monthly" },
  { id: "CLS-006", className: "Grade 12 - A", tuitionFeeAmount: 8400, billingCycle: "Monthly" },
];

export const SEED_TRANSPORT: TransportRoute[] = [
  {
    id: "TR-001",
    mapFrom: "Lotus Greens Sector 21",
    mapTo: "Main Campus Drop-off",
    morningFee: 1000,
    eveningFee: 1000,
    bothFee: 1800,
  },
  {
    id: "TR-002",
    mapFrom: "Marina Crest, MG Road",
    mapTo: "Main Campus Drop-off",
    morningFee: 850,
    eveningFee: 850,
    bothFee: 1500,
  },
  {
    id: "TR-003",
    mapFrom: "Hiranandani Gardens, Powai",
    mapTo: "Main Campus Drop-off",
    morningFee: 1350,
    eveningFee: 1350,
    bothFee: 2400,
  },
  {
    id: "TR-004",
    mapFrom: "Cumballa Heights, Peddar Road",
    mapTo: "Main Campus Drop-off",
    morningFee: 1100,
    eveningFee: 1100,
    bothFee: 2000,
  },
  {
    id: "TR-005",
    mapFrom: "Sasthamangalam, Thiruvananthapuram",
    mapTo: "Main Campus Drop-off",
    morningFee: 1200,
    eveningFee: 1200,
    bothFee: 2200,
  },
];

export const SEED_VEHICLES: TransportVehicle[] = [
  {
    id: "VH-001",
    name: "Bus 01",
    registrationNo: "KL-07-AB-4521",
    capacity: 42,
    driverName: "Rajan Kumar",
    driverPhone: "9847012345",
    routeIds: ["TR-001", "TR-002"],
    active: true,
  },
  {
    id: "VH-002",
    name: "Bus 02",
    registrationNo: "KL-07-CD-8832",
    capacity: 36,
    driverName: "Suresh Nair",
    driverPhone: "9847098765",
    routeIds: ["TR-002"],
    active: true,
  },
  {
    id: "VH-003",
    name: "Van 01",
    registrationNo: "MH-02-EF-1190",
    capacity: 14,
    driverName: "Imran Sheikh",
    routeIds: ["TR-003"],
    active: true,
  },
];

export const SEED_PAYMENT_CATEGORIES: PaymentCategory[] = [
  { id: "PC-001", label: "Tuition Fee" },
  { id: "PC-002", label: "Vehicle Fee" },
  { id: "PC-003", label: "Donation" },
  { id: "PC-004", label: "Other" },
];

export const ACADEMIC_YEAR_OPTIONS = ["AY 2024-25", "AY 2025-26", "AY 2026-27"] as const;
export const SEED_ACADEMIC_YEAR = "AY 2025-26";
export const THEME_MODE_OPTIONS: ThemeSettings["mode"][] = ["System", "Light", "High Contrast"];
export const THEME_ACCENT_OPTIONS: ThemeSettings["accent"][] = ["Neon Lime", "Pale Lime", "Ink"];
export const THEME_DENSITY_OPTIONS: ThemeSettings["density"][] = ["Comfortable", "Compact"];
export const SEED_THEME_SETTINGS: ThemeSettings = {
  mode: "System",
  accent: "Neon Lime",
  density: "Comfortable",
};

type Snapshot = {
  students: Student[];
  staff: Staff[];
  payments: Payment[];
  departments: Department[];
  roles: Role[];
  classes: ClassConfig[];
  transportRoutes: TransportRoute[];
  transportVehicles: TransportVehicle[];
  paymentCategories: PaymentCategory[];
  academicYear: string;
  themeSettings: ThemeSettings;
  dashboardTodos: string[];
  dashboardNote: string;
  notifications: TenantNotification[];
};

type TenantStoreValue = {
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  staff: Staff[];
  setStaff: Dispatch<SetStateAction<Staff[]>>;
  payments: Payment[];
  setPayments: Dispatch<SetStateAction<Payment[]>>;
  departments: Department[];
  setDepartments: Dispatch<SetStateAction<Department[]>>;
  roles: Role[];
  setRoles: Dispatch<SetStateAction<Role[]>>;
  classes: ClassConfig[];
  setClasses: Dispatch<SetStateAction<ClassConfig[]>>;
  transportRoutes: TransportRoute[];
  setTransportRoutes: Dispatch<SetStateAction<TransportRoute[]>>;
  transportVehicles: TransportVehicle[];
  setTransportVehicles: Dispatch<SetStateAction<TransportVehicle[]>>;
  paymentCategories: PaymentCategory[];
  setPaymentCategories: Dispatch<SetStateAction<PaymentCategory[]>>;
  academicYear: string;
  setAcademicYear: Dispatch<SetStateAction<string>>;
  themeSettings: ThemeSettings;
  setThemeSettings: Dispatch<SetStateAction<ThemeSettings>>;
  dashboardTodos: string[];
  setDashboardTodos: Dispatch<SetStateAction<string[]>>;
  dashboardNote: string;
  setDashboardNote: Dispatch<SetStateAction<string>>;
  notifications: TenantNotification[];
  setNotifications: Dispatch<SetStateAction<TenantNotification[]>>;
  resetTenant: () => void;
};

function isThemeSettings(value: unknown): value is ThemeSettings {
  const candidate = value as Partial<ThemeSettings> | null;
  return (
    !!candidate &&
    THEME_MODE_OPTIONS.includes(candidate.mode as ThemeSettings["mode"]) &&
    THEME_ACCENT_OPTIONS.includes(candidate.accent as ThemeSettings["accent"]) &&
    THEME_DENSITY_OPTIONS.includes(candidate.density as ThemeSettings["density"])
  );
}

function parseSnapshot(raw: string): Snapshot | null {
  const parsed = JSON.parse(raw) as Partial<Snapshot> | null;
  if (
    !parsed ||
    !Array.isArray(parsed.students) ||
    !Array.isArray(parsed.staff) ||
    !Array.isArray(parsed.payments) ||
    !Array.isArray(parsed.departments) ||
    !Array.isArray(parsed.roles) ||
    !Array.isArray(parsed.classes) ||
    !Array.isArray(parsed.transportRoutes) ||
    !Array.isArray(parsed.paymentCategories) ||
    typeof parsed.academicYear !== "string"
  ) {
    return null;
  }
  return {
    students: parsed.students.map((s) => normalizeStudent(s as Student)),
    staff: parsed.staff.map((s) => normalizeStaff(s as Staff)),
    payments: parsed.payments,
    departments: parsed.departments,
    roles: parsed.roles,
    classes: parsed.classes,
    transportRoutes: (parsed.transportRoutes ?? [])
      .map(normalizeTransportRoute)
      .filter((r): r is TransportRoute => r !== null),
    transportVehicles: Array.isArray(parsed.transportVehicles)
      ? parsed.transportVehicles
          .map(normalizeTransportVehicle)
          .filter((v): v is TransportVehicle => v !== null)
      : [...SEED_VEHICLES],
    paymentCategories: parsed.paymentCategories,
    academicYear: parsed.academicYear,
    themeSettings: isThemeSettings(parsed.themeSettings)
      ? parsed.themeSettings
      : SEED_THEME_SETTINGS,
    dashboardTodos: normalizeDashboardTodos(parsed.dashboardTodos),
    dashboardNote: typeof parsed.dashboardNote === "string" ? parsed.dashboardNote : "",
    notifications: normalizeNotifications(parsed.notifications),
  };
}

function readSnapshot(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
    if (!raw) return null;
    return parseSnapshot(raw);
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: Snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota / private mode errors
  }
}

const TenantStoreContext = createContext<TenantStoreValue | null>(null);

export function TenantStoreProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(SEED_STUDENTS);
  const [staff, setStaff] = useState<Staff[]>(SEED_STAFF);
  const [payments, setPayments] = useState<Payment[]>(SEED_PAYMENTS);
  const [departments, setDepartments] = useState<Department[]>(SEED_DEPARTMENTS);
  const [roles, setRoles] = useState<Role[]>(SEED_ROLES);
  const [classes, setClasses] = useState<ClassConfig[]>(SEED_CLASSES);
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(SEED_TRANSPORT);
  const [transportVehicles, setTransportVehicles] = useState<TransportVehicle[]>(SEED_VEHICLES);
  const [paymentCategories, setPaymentCategories] =
    useState<PaymentCategory[]>(SEED_PAYMENT_CATEGORIES);
  const [academicYear, setAcademicYear] = useState<string>(SEED_ACADEMIC_YEAR);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(SEED_THEME_SETTINGS);
  const [dashboardTodos, setDashboardTodos] = useState<string[]>([...DEFAULT_DASHBOARD_TODOS]);
  const [dashboardNote, setDashboardNote] = useState("");
  const [notifications, setNotifications] = useState<TenantNotification[]>([...SEED_NOTIFICATIONS]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const snap = readSnapshot();
    if (snap) {
      setStudents(snap.students);
      setStaff(snap.staff);
      setPayments(snap.payments);
      setDepartments(snap.departments);
      setRoles(snap.roles);
      setClasses(snap.classes);
      setTransportRoutes(snap.transportRoutes);
      setTransportVehicles(snap.transportVehicles);
      setPaymentCategories(snap.paymentCategories);
      setAcademicYear(snap.academicYear);
      setThemeSettings(snap.themeSettings);
      setDashboardTodos(snap.dashboardTodos);
      setDashboardNote(snap.dashboardNote);
      setNotifications(snap.notifications);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeSnapshot({
      students,
      staff,
      payments,
      departments,
      roles,
      classes,
      transportRoutes,
      transportVehicles,
      paymentCategories,
      academicYear,
      themeSettings,
      dashboardTodos,
      dashboardNote,
      notifications,
    });
  }, [
    hydrated,
    students,
    staff,
    payments,
    departments,
    roles,
    classes,
    transportRoutes,
    transportVehicles,
    paymentCategories,
    academicYear,
    themeSettings,
    dashboardTodos,
    dashboardNote,
    notifications,
  ]);

  const resetTenant = () => {
    setStudents(SEED_STUDENTS);
    setStaff(SEED_STAFF);
    setPayments(SEED_PAYMENTS);
    setDepartments(SEED_DEPARTMENTS);
    setRoles(SEED_ROLES);
    setClasses(SEED_CLASSES);
    setTransportRoutes(SEED_TRANSPORT);
    setTransportVehicles(SEED_VEHICLES);
    setPaymentCategories(SEED_PAYMENT_CATEGORIES);
    setAcademicYear(SEED_ACADEMIC_YEAR);
    setThemeSettings(SEED_THEME_SETTINGS);
    setDashboardTodos([...DEFAULT_DASHBOARD_TODOS]);
    setDashboardNote("");
    setNotifications([...SEED_NOTIFICATIONS]);
    writeSnapshot({
      students: SEED_STUDENTS,
      staff: SEED_STAFF,
      payments: SEED_PAYMENTS,
      departments: SEED_DEPARTMENTS,
      roles: SEED_ROLES,
      classes: SEED_CLASSES,
      transportRoutes: SEED_TRANSPORT,
      transportVehicles: SEED_VEHICLES,
      paymentCategories: SEED_PAYMENT_CATEGORIES,
      academicYear: SEED_ACADEMIC_YEAR,
      themeSettings: SEED_THEME_SETTINGS,
      dashboardTodos: [...DEFAULT_DASHBOARD_TODOS],
      dashboardNote: "",
      notifications: [...SEED_NOTIFICATIONS],
    });
  };

  const value = useMemo<TenantStoreValue>(
    () => ({
      students,
      setStudents,
      staff,
      setStaff,
      payments,
      setPayments,
      departments,
      setDepartments,
      roles,
      setRoles,
      classes,
      setClasses,
      transportRoutes,
      setTransportRoutes,
      transportVehicles,
      setTransportVehicles,
      paymentCategories,
      setPaymentCategories,
      academicYear,
      setAcademicYear,
      themeSettings,
      setThemeSettings,
      dashboardTodos,
      setDashboardTodos,
      dashboardNote,
      setDashboardNote,
      notifications,
      setNotifications,
      resetTenant,
    }),
    [
      students,
      staff,
      payments,
      departments,
      roles,
      classes,
      transportRoutes,
      transportVehicles,
      paymentCategories,
      academicYear,
      themeSettings,
      dashboardTodos,
      dashboardNote,
      notifications,
    ],
  );

  return <TenantStoreContext.Provider value={value}>{children}</TenantStoreContext.Provider>;
}

export function useTenantStore(): TenantStoreValue {
  const ctx = useContext(TenantStoreContext);
  if (!ctx) {
    throw new Error("useTenantStore must be used inside <TenantStoreProvider>");
  }
  return ctx;
}
