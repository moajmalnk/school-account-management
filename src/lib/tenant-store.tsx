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

export function normalizeStaff(raw: Partial<Staff> & Pick<Staff, "id" | "name" | "role" | "dept" | "active">): Staff {
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role,
    dept: raw.dept,
    active: raw.active,
    joinedAt: typeof raw.joinedAt === "string" && raw.joinedAt ? raw.joinedAt : "2025-01-01",
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
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

export type TransportRoute = {
  id: string;
  mapFrom: string;
  mapTo: string;
  fee: number;
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

const STORAGE_KEY = "school-accounts/tenant-store/v4";
const LEGACY_STORAGE_KEY = "school-accounts/tenant-store/v3";

export const SEED_STUDENTS: Student[] = [
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
    name: "Anika Roy",
    role: "Mathematics · HOD",
    dept: "Senior Wing",
    active: true,
    joinedAt: "2022-08-15",
    phone: "9847012345",
    basicSalary: 45000,
    additionalAllowances: 5000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "4567 8901 2345", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "AROPY5678K", attachments: [] },
    ],
  },
  {
    id: "STF-019",
    name: "Devanand Iyer",
    role: "Physics",
    dept: "Senior Wing",
    active: true,
    joinedAt: "2023-06-01",
    phone: "9876543210",
    basicSalary: 38000,
    additionalAllowances: 3000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "2345 6789 0123", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "DEVIY1234P", attachments: [] },
    ],
  },
  {
    id: "STF-020",
    name: "Priya Subramanian",
    role: "Principal Office",
    dept: "Administration",
    active: true,
    joinedAt: "2020-04-10",
    phone: "9895011223",
    basicSalary: 52000,
    additionalAllowances: 8000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "5678 9012 3456", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "PSUBM9012L", attachments: [] },
    ],
  },
  {
    id: "STF-021",
    name: "Rohan Mehta",
    role: "Sports Coordinator",
    dept: "Co-curricular",
    active: true,
    joinedAt: "2024-01-20",
    phone: "9765432109",
    basicSalary: 32000,
    additionalAllowances: 2000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "3456 7890 1234", attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "RMEHT3456H", attachments: [] },
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
    fee: 1800,
  },
  { id: "TR-002", mapFrom: "Marina Crest, MG Road", mapTo: "Main Campus Drop-off", fee: 1500 },
  { id: "TR-003", mapFrom: "Hiranandani Gardens, Powai", mapTo: "Main Campus Drop-off", fee: 2400 },
  { id: "TR-004", mapFrom: "Cumballa Heights, Peddar Road", mapTo: "Main Campus Drop-off", fee: 2000 },
  { id: "TR-005", mapFrom: "Sasthamangalam, Thiruvananthapuram", mapTo: "Main Campus Drop-off", fee: 2200 },
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
  paymentCategories: PaymentCategory[];
  academicYear: string;
  themeSettings: ThemeSettings;
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
  paymentCategories: PaymentCategory[];
  setPaymentCategories: Dispatch<SetStateAction<PaymentCategory[]>>;
  academicYear: string;
  setAcademicYear: Dispatch<SetStateAction<string>>;
  themeSettings: ThemeSettings;
  setThemeSettings: Dispatch<SetStateAction<ThemeSettings>>;
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
    students: parsed.students,
    staff: parsed.staff.map((s) => normalizeStaff(s as Staff)),
    payments: parsed.payments,
    departments: parsed.departments,
    roles: parsed.roles,
    classes: parsed.classes,
    transportRoutes: parsed.transportRoutes,
    paymentCategories: parsed.paymentCategories,
    academicYear: parsed.academicYear,
    themeSettings: isThemeSettings(parsed.themeSettings)
      ? parsed.themeSettings
      : SEED_THEME_SETTINGS,
  };
}

function readSnapshot(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
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
  const [paymentCategories, setPaymentCategories] =
    useState<PaymentCategory[]>(SEED_PAYMENT_CATEGORIES);
  const [academicYear, setAcademicYear] = useState<string>(SEED_ACADEMIC_YEAR);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(SEED_THEME_SETTINGS);
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
      setPaymentCategories(snap.paymentCategories);
      setAcademicYear(snap.academicYear);
      setThemeSettings(snap.themeSettings);
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
      paymentCategories,
      academicYear,
      themeSettings,
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
    paymentCategories,
    academicYear,
    themeSettings,
  ]);

  const resetTenant = () => {
    setStudents(SEED_STUDENTS);
    setStaff(SEED_STAFF);
    setPayments(SEED_PAYMENTS);
    setDepartments(SEED_DEPARTMENTS);
    setRoles(SEED_ROLES);
    setClasses(SEED_CLASSES);
    setTransportRoutes(SEED_TRANSPORT);
    setPaymentCategories(SEED_PAYMENT_CATEGORIES);
    setAcademicYear(SEED_ACADEMIC_YEAR);
    setThemeSettings(SEED_THEME_SETTINGS);
    writeSnapshot({
      students: SEED_STUDENTS,
      staff: SEED_STAFF,
      payments: SEED_PAYMENTS,
      departments: SEED_DEPARTMENTS,
      roles: SEED_ROLES,
      classes: SEED_CLASSES,
      transportRoutes: SEED_TRANSPORT,
      paymentCategories: SEED_PAYMENT_CATEGORIES,
      academicYear: SEED_ACADEMIC_YEAR,
      themeSettings: SEED_THEME_SETTINGS,
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
      paymentCategories,
      setPaymentCategories,
      academicYear,
      setAcademicYear,
      themeSettings,
      setThemeSettings,
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
      paymentCategories,
      academicYear,
      themeSettings,
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
