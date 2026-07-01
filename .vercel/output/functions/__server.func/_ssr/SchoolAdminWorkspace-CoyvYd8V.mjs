import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { d as useNavigate, f as useSearch } from "../_libs/tanstack__react-router.mjs";
import { R as Root, P as Portal, C as Content, a as Close, T as Title, D as Description, O as Overlay } from "../_libs/radix-ui__react-dialog.mjs";
import { c as cn } from "./utils-DO8q3wGq.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem, e as Sheet, f as SheetContent, g as SheetHeader, h as SheetTitle, i as SheetDescription, j as SheetFooter, D as DatePicker } from "./date-picker-CKUZiWzI.mjs";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, e as DropdownMenuItem, d as DropdownMenuSeparator } from "./dropdown-menu-Drx6j-O7.mjs";
import { S as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { I as Input } from "./input-FCkkYGai.mjs";
import { L as Label } from "./label-37DVo-jK.mjs";
import { O as OrganicCard } from "./organic-card-j42pCYkc.mjs";
import { u as useTenantStore, A as ACADEMIC_YEAR_OPTIONS, a as THEME_MODE_OPTIONS, b as THEME_ACCENT_OPTIONS, c as THEME_DENSITY_OPTIONS } from "./tenant-store-BRNxtkke.mjs";
import { u as useAuth } from "./router-7bBAKfDt.mjs";
import { j as jspdf_node_minExports } from "../_libs/jspdf.mjs";
import { a as autoTable } from "../_libs/jspdf-autotable.mjs";
import { P as Plus, k as Printer, D as Download, l as Upload, c as Search, m as Phone, M as MessageCircle, n as MessageSquare, X, o as EllipsisVertical, p as Pencil, T as Trash2, q as TriangleAlert, r as TrendingUp, s as TrendingDown, t as ArrowLeft, d as Check, u as CircleCheck, F as FileSpreadsheet } from "../_libs/lucide-react.mjs";
const Dialog = Root;
const DialogPortal = Portal;
const DialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = Overlay.displayName;
const DialogContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props });
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = Title.displayName;
const DialogDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = Description.displayName;
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = reactExports.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const META_LABEL = "text-black/45 font-semibold tracking-wider text-[11px] uppercase";
const inr$1 = (n) => `₹ ${n.toLocaleString("en-IN")}`;
function deriveFees(due) {
  const factor = due === 0 ? 0 : due / 5500;
  const round = (n) => Math.round(n);
  return {
    factor,
    totalDue: due === 0 ? 12e3 : round(12e3 * factor),
    totalPaid: due === 0 ? 12e3 : round(6500 * factor),
    balance: due,
    overdue: due > 0
  };
}
function deriveLedger(due) {
  const factor = due === 0 ? 1 : due / 5500;
  const round = (n) => Math.round(n);
  if (due === 0) {
    return [
      {
        date: "1/12/25",
        desc: "Tuition Fee",
        due: "05/08/25",
        charge: 4e3,
        paid: 4e3,
        balance: 0,
        status: "Paid"
      },
      {
        date: "12/05/25",
        desc: "Annual Fee",
        due: "04/05/26",
        charge: 800,
        paid: 800,
        balance: 0,
        status: "Paid"
      },
      {
        date: "19/06/25",
        desc: "Vehicle Fee",
        due: "12/12/24",
        charge: 800,
        paid: 800,
        balance: 0,
        status: "Paid"
      }
    ];
  }
  return [
    {
      date: "1/12/25",
      desc: "Tuition Fee",
      due: "05/08/25",
      charge: round(4e3 * factor),
      paid: round(2500 * factor),
      balance: round(1500 * factor),
      status: "Partially Paid"
    },
    {
      date: "12/05/25",
      desc: "Annual Fee",
      due: "04/05/26",
      charge: round(800 * factor),
      paid: round(800 * factor),
      balance: 0,
      status: "Paid"
    },
    {
      date: "19/06/25",
      desc: "Vehicle Fee",
      due: "12/12/24",
      charge: round(800 * factor),
      paid: 0,
      balance: round(800 * factor),
      status: "Overdue"
    }
  ];
}
function deriveReceipts(due) {
  const factor = due === 0 ? 1 : due / 5500;
  const round = (n) => Math.round(n);
  return [
    { id: "REC-2026-104", date: "12/01/2026", amount: round(2500 * factor), mode: "UPI - GPay" },
    { id: "REC-2025-098", date: "08/11/2025", amount: round(800 * factor), mode: "Bank - NEFT" },
    {
      id: "REC-2025-072",
      date: "22/09/2025",
      amount: round(3200 * factor),
      mode: "Cash - Counter"
    }
  ];
}
function initials(name) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}
function StudentProfileDetail({
  student,
  onBack
}) {
  const [editing, setEditing] = reactExports.useState(false);
  const [draft, setDraft] = reactExports.useState({
    guardian: student.guardian,
    phone: student.phone ?? "",
    dob: student.dob ?? "",
    email: student.email ?? "",
    address: student.address ?? ""
  });
  const fees = reactExports.useMemo(() => deriveFees(student.due), [student.due]);
  const ledger = reactExports.useMemo(() => deriveLedger(student.due), [student.due]);
  const receipts = reactExports.useMemo(() => deriveReceipts(student.due), [student.due]);
  const phoneDigits2 = (draft.phone || "").replace(/[^0-9]/g, "");
  const waHref = phoneDigits2 ? `https://wa.me/${phoneDigits2.length === 10 ? "91" : ""}${phoneDigits2}` : void 0;
  const toggleEdit = () => {
    if (editing) {
      toast.success(`${student.name}'s profile updated`, {
        description: "Local draft saved · sync to ledger on next push"
      });
    }
    setEditing((e) => !e);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 lg:min-h-[calc(100dvh-3rem)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TopBar,
      {
        studentName: student.name,
        onBack,
        editing,
        onToggleEdit: toggleEdit
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:items-stretch", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        OrganicCard,
        {
          tone: "white",
          cornerSide: "tr",
          padded: true,
          className: "flex flex-col lg:col-span-4 lg:h-full lg:min-h-0",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(IdentityHeader, { student }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex min-h-0 flex-1 flex-col gap-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetaField,
                {
                  label: "Guardian",
                  value: draft.guardian,
                  editing,
                  onChange: (v) => setDraft({ ...draft, guardian: v }),
                  placeholder: "Guardian full name"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: META_LABEL, children: "Contact Phone" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center justify-between gap-3", children: [
                  editing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: draft.phone,
                      onChange: (e) => setDraft({ ...draft, phone: e.target.value }),
                      placeholder: "9810045221",
                      className: "h-9 flex-1 font-mono text-[13px]"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[14px] font-medium text-black", children: draft.phone || "—" }),
                  waHref && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "a",
                    {
                      href: waHref,
                      target: "_blank",
                      rel: "noreferrer noopener",
                      className: "inline-flex items-center gap-1 rounded-full bg-[#C7F33C] px-2.5 py-1 text-[11px] font-semibold text-black shadow-sm transition-colors hover:bg-black hover:text-white",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3 w-3" }),
                        " Quick Connect"
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetaField,
                {
                  label: "Date of Birth",
                  value: draft.dob,
                  editing,
                  onChange: (v) => setDraft({ ...draft, dob: v }),
                  placeholder: "14 Mar 2012",
                  date: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetaField,
                {
                  label: "Email Address",
                  value: draft.email,
                  editing,
                  onChange: (v) => setDraft({ ...draft, email: v }),
                  placeholder: "aarav.sharma@silverhills.in",
                  mono: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetaField,
                {
                  label: "Residential Mailing Address",
                  value: draft.address,
                  editing,
                  onChange: (v) => setDraft({ ...draft, address: v }),
                  placeholder: "B-204, Lotus Greens, Sector 21, Noida 201301",
                  multiline: true,
                  fill: true
                }
              )
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 grid grid-cols-1 gap-4 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricTile, { label: "Total Due", value: inr$1(fees.totalDue), cornerSide: "tr" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            MetricTile,
            {
              label: "Total Paid",
              value: inr$1(fees.totalPaid),
              cornerSide: "bl",
              valueClassName: "text-black"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(BalanceTile, { balance: fees.balance, overdue: fees.overdue })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FeesTable, { ledger }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReceiptsList, { receipts }) })
      ] })
    ] })
  ] });
}
function TopBar({
  studentName,
  onBack,
  editing,
  onToggleEdit
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[14px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onBack,
          className: "font-medium text-black/55 transition-colors hover:text-black",
          children: "Students"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-black/30", children: "/" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-black", children: studentName })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: onBack,
          className: "inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[13px] font-medium text-black/75 shadow-sm transition-colors hover:bg-[#F4F4F5]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            " Back to list"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onToggleEdit,
          className: `inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold shadow-sm transition-colors ${editing ? "bg-[#C7F33C] text-black hover:bg-[#E1F2AE]" : "bg-black text-white hover:bg-black/85"}`,
          children: editing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }),
            " Save Profile"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }),
            " Edit Profile"
          ] })
        }
      )
    ] })
  ] });
}
function IdentityHeader({ student }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-black text-lg font-semibold text-white", children: initials(student.name) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[18px] font-semibold text-black", children: student.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex flex-wrap items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-[#F4F4F5] px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-black/65", children: student.id }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-[#E1F2AE] px-2.5 py-0.5 text-[10.5px] font-medium text-black", children: student.cls }),
        student.gender && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: `rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${student.gender === "F" ? "bg-black text-[#C7F33C]" : "bg-black text-white"}`,
            children: student.gender
          }
        )
      ] })
    ] })
  ] });
}
const todayISO = () => {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
function MetaField({
  label,
  value,
  editing,
  onChange,
  placeholder,
  mono,
  multiline,
  date,
  fill
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(fill && "flex min-h-0 flex-1 flex-col"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: META_LABEL, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-1.5", fill && "flex min-h-0 flex-1 flex-col"), children: editing ? date ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      DatePicker,
      {
        value,
        onChange,
        placeholder: placeholder ?? "Pick a date",
        valueFormat: "display",
        variant: "pill",
        quickPicks: [],
        min: "1990-01-01",
        max: todayISO(),
        className: "h-9"
      }
    ) : multiline ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        value,
        onChange: (e) => onChange(e.target.value),
        placeholder,
        className: cn(
          "w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2 text-[13px] text-black shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
          fill ? "min-h-[120px] flex-1 resize-none lg:min-h-0" : "min-h-[64px]"
        )
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        value,
        onChange: (e) => onChange(e.target.value),
        placeholder,
        className: `h-9 text-[13px] ${mono ? "font-mono" : ""}`
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: cn(
          "text-[14px] font-medium",
          mono && "font-mono",
          multiline ? "whitespace-pre-line leading-snug text-black/85" : "text-black",
          fill && "min-h-0 flex-1"
        ),
        children: value || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-black/40", children: "—" })
      }
    ) })
  ] });
}
function MetricTile({
  label,
  value,
  cornerSide,
  valueClassName
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide, padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: META_LABEL, children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-black" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `mt-3 font-mono text-2xl font-semibold tracking-tight ${valueClassName ?? "text-black"}`,
        children: value
      }
    )
  ] });
}
function BalanceTile({ balance, overdue }) {
  if (!overdue) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "br", padded: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Current Balance" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-black" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-mono text-2xl font-semibold tracking-tight text-black", children: inr$1(balance) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-2 inline-flex items-center rounded-full bg-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#C7F33C]", children: "[ CLEARED ]" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "lime", cornerSide: "br", padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-black/70", children: "Current Balance" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-7 w-7 place-items-center rounded-full bg-black", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5 text-[#C7F33C]" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-mono text-2xl font-semibold tracking-tight text-black", children: inr$1(balance) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "overdue-flash mt-2 inline-flex items-center rounded-full bg-black px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#C7F33C]", children: "[ OVERDUE ]" })
  ] });
}
function FeesTable({ ledger }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Fees Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[12px] text-black/55", children: [
          "Statement ledger sheet · ",
          ledger.length,
          " line items on file"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-[#E5E5E5] bg-[#F4F4F5] px-2.5 py-1 font-mono text-[10.5px] font-medium text-black/65", children: "AY 2025-26" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse text-left", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border-b border-[#E5E5E5] pb-4 pl-1 pr-4 text-[11px] font-semibold uppercase tracking-wider text-black/45", children: "Date" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border-b border-[#E5E5E5] px-4 pb-4 text-[11px] font-semibold uppercase tracking-wider text-black/45", children: "Description" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border-b border-[#E5E5E5] px-4 pb-4 text-[11px] font-semibold uppercase tracking-wider text-black/45", children: "Due Date" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border-b border-[#E5E5E5] px-4 pb-4 text-right text-[11px] font-semibold uppercase tracking-wider text-black/45", children: "Charge Amount" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border-b border-[#E5E5E5] px-4 pb-4 text-right text-[11px] font-semibold uppercase tracking-wider text-black/45", children: "Paid Amount" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border-b border-[#E5E5E5] px-4 pb-4 text-right text-[11px] font-semibold uppercase tracking-wider text-black/45", children: "Balance" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border-b border-[#E5E5E5] pb-4 pl-4 pr-1 text-[11px] font-semibold uppercase tracking-wider text-black/45", children: "Status" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: ledger.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "tr",
        {
          className: "border-b border-[#F0F0F0] transition-colors last:border-b-0 hover:bg-[#F4F4F5]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-4 pl-1 pr-4 font-mono text-[13px] text-black/55", children: r.date }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-4 text-[13px] font-medium text-black", children: r.desc }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-4 font-mono text-[13px] text-black/55", children: r.due }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-4 text-right font-mono text-[13px] text-black/75", children: inr$1(r.charge) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-4 text-right font-mono text-[13px] font-medium text-black", children: inr$1(r.paid) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "td",
              {
                className: `px-4 py-4 text-right font-mono text-[13px] ${r.balance === 0 ? "text-black/40" : "text-black"}`,
                children: inr$1(r.balance)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-4 pl-4 pr-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: r.status }) })
          ]
        },
        i
      )) })
    ] }) })
  ] });
}
function ReceiptsList({ receipts }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "bl", padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Receipts" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[12px] text-black/55", children: [
          receipts.length,
          " historical digital receipts"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-[#C7F33C] px-2.5 py-1 text-[10.5px] font-semibold text-black", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-black" }),
        "Reconciled"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-[#F0F0F0]", children: receipts.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "li",
      {
        className: "-mx-2 flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors hover:bg-[#F4F4F5]",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[13px] font-semibold text-black", children: r.id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-[#F4F4F5] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-black/65", children: r.mode })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-mono text-[11px] text-black/55", children: r.date })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-base font-semibold text-black", children: inr$1(r.amount) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => toast.success(`Receipt ${r.id} downloaded`, {
                description: `PDF prepared · ${inr$1(r.amount)}`
              }),
              "aria-label": `Download receipt ${r.id}`,
              className: "grid h-10 w-10 place-items-center rounded-2xl border border-[#E5E5E5] bg-white text-black/55 shadow-sm transition-colors hover:bg-black hover:text-white",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" })
            }
          )
        ]
      },
      r.id
    )) })
  ] });
}
const STATUS_STYLE = {
  Paid: {
    wrap: "bg-[#F4F4F5] text-black",
    dot: "bg-black"
  },
  "Partially Paid": {
    wrap: "bg-[#E1F2AE] text-black",
    dot: "bg-black"
  },
  Overdue: {
    wrap: "bg-[#C7F33C] text-black",
    dot: "bg-black"
  }
};
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${s.wrap}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-1.5 w-1.5 rounded-full ${s.dot}` }),
        status
      ]
    }
  );
}
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
function escapeCsvCell(value) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
function downloadCsv(filename, headers, rows) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(","))
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}
function downloadTablePdf({
  filename,
  title,
  subtitle,
  headers,
  rows,
  footer
}) {
  const doc = new jspdf_node_minExports.jsPDF({ orientation: rows[0]?.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 18);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(subtitle, 14, 26);
  }
  autoTable(doc, {
    startY: subtitle ? 32 : 24,
    head: [headers],
    body: rows.map((row) => row.map(String)),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [244, 244, 245] }
  });
  if (footer) {
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(footer, 14, finalY);
  }
  doc.save(filename);
}
function downloadReceiptPdf(payment, schoolName, academicYear) {
  const doc = new jspdf_node_minExports.jsPDF();
  const margin = 18;
  let y = margin;
  doc.setFillColor(199, 243, 60);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolName, margin, 18);
  doc.setFontSize(10);
  doc.text(`Fee Receipt · ${academicYear}`, margin, 24);
  y = 40;
  doc.setFontSize(14);
  doc.text("Payment Receipt", margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const lines = [
    ["Receipt No.", payment.id],
    ["Student", payment.name],
    ["Category", payment.cat],
    ["Payment Mode", payment.mode],
    ["Amount", `₹ ${payment.amount.toLocaleString("en-IN")}`],
    ["Recorded", payment.time]
  ];
  lines.forEach(([label, value]) => {
    doc.setTextColor(120, 120, 120);
    doc.text(label, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + 42, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  });
  y += 6;
  doc.setDrawColor(229, 229, 229);
  doc.line(margin, y, 210 - margin, y);
  y += 10;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`₹ ${payment.amount.toLocaleString("en-IN")}`, margin, y);
  doc.setFont("helvetica", "normal");
  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("This is a computer-generated receipt. No signature required.", margin, y);
  doc.text(`Generated ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN")}`, margin, y + 5);
  doc.save(`receipt-${payment.id}.pdf`);
}
const OPERATING_EXPENSES = [
  { account: "Salaries & Wages", amount: 122e4 },
  { account: "Vehicle Upkeep", amount: 184e3 },
  { account: "Utilities & Power", amount: 88e3 },
  { account: "Rent & Campus", amount: 24e4 },
  { account: "Office & Supplies", amount: 42e3 }
];
const ACCOUNTS_PAYABLE = [
  { payee: "BrightBus Logistics", amount: 48200 },
  { payee: "Faculty Payroll · May", amount: 612e3 },
  { payee: "Adani Electricity", amount: 18450 },
  { payee: "Office Stationery Co.", amount: 6800 }
];
function inr(n) {
  return `₹ ${n.toLocaleString("en-IN")}`;
}
function buildLedgerRows(payments) {
  const expenseRows = OPERATING_EXPENSES.map((e, i) => ({
    date: `01/${String(i + 4).padStart(2, "0")}/26`,
    voucher: `JV-26${100 + i}`,
    particulars: `${e.account} · monthly allocation`,
    account: e.account,
    debit: e.amount,
    credit: 0
  }));
  const receiptRows = [...payments].reverse().map((p) => ({
    date: p.time.includes("·") ? p.time.split("·")[0].trim() : p.time,
    voucher: p.id,
    particulars: `${p.name} · ${p.cat}`,
    account: p.cat,
    debit: 0,
    credit: p.amount
  }));
  const merged = [...expenseRows, ...receiptRows];
  let balance = 0;
  return merged.map((row) => {
    balance += row.credit - row.debit;
    return { ...row, balance };
  });
}
function ExportBar({
  title,
  onCsv,
  onPdf
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onCsv,
          className: "inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3.5 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-[#F4F4F5]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileSpreadsheet, { className: "h-3.5 w-3.5" }),
            " Export CSV"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onPdf,
          className: "inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-black/85",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
            " Export PDF"
          ]
        }
      )
    ] })
  ] });
}
function ReportTable({
  headers,
  rows,
  footer
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 overflow-x-auto rounded-2xl border border-[#E5E5E5]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[640px] text-left text-[12.5px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-b border-[#E5E5E5] bg-[#F4F4F5]", children: headers.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "th",
        {
          className: "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55",
          children: h
        },
        h
      )) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-b border-[#F0F0F0] last:border-0", children: row.map((cell, j) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "td",
        {
          className: cn(
            "px-3 py-2.5 text-black/80",
            j >= row.length - 3 && "font-mono text-black"
          ),
          children: cell
        },
        j
      )) }, i)) })
    ] }),
    footer
  ] });
}
function SummaryStrip({ items }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3", children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "rounded-2xl p-4",
        item.accent ? "bg-[#C7F33C] text-black" : "bg-[#F4F4F5] text-black"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-black/55", children: item.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-mono text-[18px] font-semibold", children: item.value })
      ]
    },
    item.label
  )) });
}
function GeneralLedgerReport() {
  const { payments, academicYear } = useTenantStore();
  const { session } = useAuth();
  const schoolName = session?.tenantName ?? "Silver Hills Global";
  const rows = reactExports.useMemo(() => buildLedgerRows(payments), [payments]);
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const closing = rows.at(-1)?.balance ?? 0;
  const tableRows = rows.map((r) => [
    r.date,
    r.voucher,
    r.particulars,
    r.account,
    r.debit ? inr(r.debit) : "—",
    r.credit ? inr(r.credit) : "—",
    inr(r.balance)
  ]);
  const headers = ["Date", "Voucher", "Particulars", "Account", "Debit", "Credit", "Balance"];
  const exportMeta = `${schoolName} · ${academicYear} · General Ledger`;
  const handleCsv = () => {
    downloadCsv(
      `general-ledger-${academicYear.replace(/\s+/g, "-").toLowerCase()}.csv`,
      headers,
      rows.map((r) => [r.date, r.voucher, r.particulars, r.account, r.debit, r.credit, r.balance])
    );
    toast.success("Ledger exported as CSV");
  };
  const handlePdf = () => {
    downloadTablePdf({
      filename: `general-ledger-${academicYear.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      title: "General Ledger",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Total Debit ${inr(totalDebit)} · Total Credit ${inr(totalCredit)} · Closing ${inr(closing)}`
    });
    toast.success("Ledger exported as PDF");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ExportBar, { title: "General Ledger", onCsv: handleCsv, onPdf: handlePdf }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[12px] text-black/55", children: [
      "Chronological double-entry view · ",
      rows.length,
      " postings · ",
      academicYear
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SummaryStrip,
      {
        items: [
          { label: "Total Debit", value: inr(totalDebit) },
          { label: "Total Credit", value: inr(totalCredit) },
          { label: "Closing Balance", value: inr(closing), accent: true }
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ReportTable, { headers, rows: tableRows })
  ] });
}
function ProfitLossReport() {
  const { payments, academicYear } = useTenantStore();
  const { session } = useAuth();
  const schoolName = session?.tenantName ?? "Silver Hills Global";
  const incomeByCategory = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    payments.forEach((p) => map.set(p.cat, (map.get(p.cat) ?? 0) + p.amount));
    return Array.from(map.entries()).map(([label, amount]) => ({ label, amount }));
  }, [payments]);
  const totalIncome = incomeByCategory.reduce((s, i) => s + i.amount, 0);
  const totalExpense = OPERATING_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const headers = ["Line Item", "Type", "Amount (₹)"];
  const tableRows = [
    ...incomeByCategory.map((i) => [i.label, "Income", inr(i.amount)]),
    ...OPERATING_EXPENSES.map((e) => [e.account, "Expense", inr(e.amount)]),
    ["Net Surplus / (Deficit)", "Result", inr(netProfit)]
  ];
  const exportMeta = `${schoolName} · ${academicYear} · Profit & Loss`;
  const handleCsv = () => {
    downloadCsv(`profit-loss-${academicYear.replace(/\s+/g, "-").toLowerCase()}.csv`, headers, [
      ...incomeByCategory.map((i) => [i.label, "Income", i.amount]),
      ...OPERATING_EXPENSES.map((e) => [e.account, "Expense", e.amount]),
      ["Net Surplus / (Deficit)", "Result", netProfit]
    ]);
    toast.success("P&L exported as CSV");
  };
  const handlePdf = () => {
    downloadTablePdf({
      filename: `profit-loss-${academicYear.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      title: "Profit & Loss Account",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Total Income ${inr(totalIncome)} · Total Expense ${inr(totalExpense)} · Net ${inr(netProfit)}`
    });
    toast.success("P&L exported as PDF");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", padded: true, className: "lg:col-span-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ExportBar, { title: "Profit & Loss Account", onCsv: handleCsv, onPdf: handlePdf }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[12px] text-black/55", children: [
        "Income from fee receipts vs operating expenditure · ",
        academicYear
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ReportTable, { headers, rows: tableRows })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "lime", cornerSide: "bl", padded: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Statement Summary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-black/55", children: "Gross Income" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-mono text-[20px] font-semibold", children: inr(totalIncome) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-black/55", children: "Operating Expense" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-mono text-[20px] font-semibold", children: inr(totalExpense) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-black p-3 text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-white/65", children: "Net Surplus" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-mono text-[22px] font-semibold", children: inr(netProfit) })
        ] })
      ] })
    ] })
  ] });
}
function BalanceSheetReport() {
  const { payments, students, academicYear } = useTenantStore();
  const { session } = useAuth();
  const schoolName = session?.tenantName ?? "Silver Hills Global";
  const cashOnHand = reactExports.useMemo(
    () => payments.filter((p) => p.mode === "Cash").reduce((s, p) => s + p.amount, 0),
    [payments]
  );
  const bankBalance = reactExports.useMemo(
    () => payments.filter((p) => p.mode !== "Cash").reduce((s, p) => s + p.amount, 0),
    [payments]
  );
  const receivables = reactExports.useMemo(() => students.reduce((s, st) => s + st.due, 0), [students]);
  const payables = ACCOUNTS_PAYABLE.reduce((s, p) => s + p.amount, 0);
  const totalAssets = cashOnHand + bankBalance + receivables;
  const equity = totalAssets - payables;
  const assetRows = [
    ["Cash in Hand", inr(cashOnHand)],
    ["Bank & UPI", inr(bankBalance)],
    ["Accounts Receivable (Fees Due)", inr(receivables)],
    ["Total Assets", inr(totalAssets)]
  ];
  const liabilityRows = [
    ["Accounts Payable", inr(payables)],
    ["Retained Surplus / Equity", inr(equity)],
    ["Total Liabilities & Equity", inr(payables + equity)]
  ];
  const headers = ["Account Head", "Amount (₹)"];
  const tableRows = [
    ["— ASSETS —", ""],
    ...assetRows,
    ["— LIABILITIES & EQUITY —", ""],
    ...liabilityRows
  ];
  const exportMeta = `${schoolName} · ${academicYear} · Balance Sheet`;
  const handleCsv = () => {
    downloadCsv(`balance-sheet-${academicYear.replace(/\s+/g, "-").toLowerCase()}.csv`, headers, [
      ["Cash in Hand", cashOnHand],
      ["Bank & UPI", bankBalance],
      ["Accounts Receivable", receivables],
      ["Total Assets", totalAssets],
      ["Accounts Payable", payables],
      ["Retained Surplus / Equity", equity],
      ["Total Liabilities & Equity", payables + equity]
    ]);
    toast.success("Balance sheet exported as CSV");
  };
  const handlePdf = () => {
    downloadTablePdf({
      filename: `balance-sheet-${academicYear.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      title: "Balance Sheet",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Assets ${inr(totalAssets)} · Liabilities & Equity ${inr(payables + equity)}`
    });
    toast.success("Balance sheet exported as PDF");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", padded: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ExportBar, { title: "Balance Sheet", onCsv: handleCsv, onPdf: handlePdf }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[12px] text-black/55", children: [
        "Position statement as at today · ",
        academicYear
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SummaryStrip,
        {
          items: [
            { label: "Total Assets", value: inr(totalAssets) },
            { label: "Payables", value: inr(payables) },
            { label: "Net Equity", value: inr(equity), accent: true }
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ReportTable, { headers, rows: tableRows })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "bl", padded: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Outstanding Payables" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[12px] text-black/55", children: [
        ACCOUNTS_PAYABLE.length,
        " open obligations"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 divide-y divide-[#F0F0F0]", children: ACCOUNTS_PAYABLE.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2.5 text-[12.5px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-black", children: p.payee }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-black", children: inr(p.amount) })
      ] }, p.payee)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-2xl bg-[#F4F4F5] p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-black/55", children: "Fee Receivables" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-mono text-[18px] font-semibold", children: inr(receivables) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[11px] text-black/55", children: [
          "Aggregated from ",
          students.filter((s) => s.due > 0).length,
          " students with open balances"
        ] })
      ] })
    ] })
  ] });
}
const PENDING_OBLIGATIONS = [
  { payee: "BrightBus Logistics", desc: "Bus diesel + maintenance", amount: 48200, due: "Jun 02" },
  { payee: "Faculty Payroll · May", desc: "35 staff · net payable", amount: 612e3, due: "May 31" },
  { payee: "Adani Electricity", desc: "Campus utility bill", amount: 18450, due: "Jun 05" },
  { payee: "Office Stationery Co.", desc: "Exam print supplies", amount: 6800, due: "Jun 08" }
];
function KpiCard({
  label,
  value,
  delta,
  positive = true,
  tone = "white",
  cornerSide = "tr"
}) {
  const Icon = positive ? TrendingUp : TrendingDown;
  const isLime = tone === "lime";
  const isBlack = tone === "black";
  const labelClass = isLime || isBlack ? "" : "text-black/45";
  const deltaColor = isLime ? "text-black" : isBlack ? "text-[#C7F33C]" : positive ? "text-black" : "text-[#B91C1C]";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone, cornerSide, arrow: true, padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-[11px] font-medium uppercase tracking-wider ${labelClass}`, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-mono text-[28px] font-semibold tracking-tight", children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 flex items-center gap-1 text-[11.5px] ${deltaColor}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3 w-3" }),
      " ",
      delta
    ] })
  ] });
}
function SchoolDashboard() {
  const { students, staff, payments } = useTenantStore();
  const totalDue = students.reduce((acc, s) => acc + s.due, 0);
  const monthlyIncome = payments.reduce((acc, p) => acc + p.amount, 0);
  const peakIdx = reactExports.useMemo(() => {
    const arr = [42, 58, 74, 96, 88, 51, 33];
    return arr.reduce((m, v, i, a) => v > a[m] ? i : m, 0);
  }, []);
  const bars = [42, 58, 74, 96, 88, 51, 33];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-heading", children: "Operations Dashboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[14px] text-black/55", children: "Live snapshot · Silver Hills Global Group · academic year 2025–26" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[11px] text-black/45", children: "Updated 14:42 IST" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: "Total Students",
          value: students.length.toLocaleString("en-IN"),
          delta: "live ledger",
          cornerSide: "tr"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: "Total Staff",
          value: staff.length.toString(),
          delta: `${staff.filter((s) => s.active).length} active`,
          cornerSide: "bl"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: "Receipts Captured",
          value: `₹ ${monthlyIncome.toLocaleString("en-IN")}`,
          delta: `${payments.length} receipts`,
          cornerSide: "tr"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          label: "Outstanding Dues",
          value: `₹ ${totalDue.toLocaleString("en-IN")}`,
          delta: "across all classes",
          positive: false,
          tone: "lime",
          cornerSide: "bl"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", arrow: true, padded: true, className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Daily Fee Collection" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[12.5px] text-black/55", children: "Last 7 working days" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[11px] text-black/45", children: "in ₹ thousands" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-44 items-end gap-3", children: bars.map((v, i) => {
          const isPeak = i === peakIdx;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "w-full rounded-xl",
                style: {
                  height: `${v}%`,
                  background: isPeak ? "linear-gradient(180deg,#C7F33C,#E1F2AE)" : "linear-gradient(180deg,#000000,#1F1F1F)"
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-mono text-[10px] text-black/55", children: [
              v,
              "k"
            ] })
          ] }, i);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "bl", arrow: true, padded: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Outstanding Fees" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[12.5px] text-black/55", children: "By academic grade band" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-3", children: [
          { label: "Pre-Primary (LKG–UKG)", v: 18, amt: "₹ 0.42 L" },
          { label: "Primary (Gr 1–5)", v: 36, amt: "₹ 1.84 L" },
          { label: "Middle (Gr 6–8)", v: 28, amt: "₹ 2.10 L" },
          { label: "Senior (Gr 9–12)", v: 18, amt: "₹ 3.65 L" }
        ].map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[12.5px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-black/65", children: r.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-black", children: r.amt })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 h-1.5 overflow-hidden rounded-full bg-[#F4F4F5]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "h-full",
              style: { width: `${r.v * 2.5}%`, backgroundColor: "#C7F33C" }
            }
          ) })
        ] }, r.label)) })
      ] })
    ] })
  ] });
}
const STATUS_TABS = [
  { key: "all", label: "All Students" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" }
];
const phoneDigits = (raw) => (raw ?? "").replace(/[^0-9]/g, "");
const formatPhone = (raw) => {
  const d = phoneDigits(raw);
  if (!d) return "";
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return d;
};
function StudentsLedger() {
  const { students, setStudents, classes } = useTenantStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/students" });
  const activeStudentViewId = search.id ?? null;
  const openStudent = (id) => navigate({ to: "/tenant/students", search: { id } });
  const closeStudent = () => navigate({ to: "/tenant/students", search: {} });
  const [query, setQuery] = reactExports.useState("");
  const [open, setOpen] = reactExports.useState(false);
  const defaultClass = classes[0]?.className ?? "";
  const [form, setForm] = reactExports.useState({ name: "", cls: defaultClass, guardian: "", due: "" });
  const [gradeFilter, setGradeFilter] = reactExports.useState("all");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const fileInputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!defaultClass) return;
    setForm(
      (prev) => classes.some((c) => c.className === prev.cls) ? prev : { ...prev, cls: defaultClass }
    );
  }, [classes, defaultClass]);
  const activeStudent = reactExports.useMemo(
    () => activeStudentViewId ? students.find((s) => s.id === activeStudentViewId) ?? null : null,
    [activeStudentViewId, students]
  );
  const grades = reactExports.useMemo(
    () => Array.from(new Set(students.map((s) => s.cls.split(" - ")[0]))).sort(),
    [students]
  );
  const filtered = reactExports.useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => gradeFilter === "all" || s.cls.startsWith(gradeFilter)).filter(
      (s) => statusFilter === "all" ? true : statusFilter === "paid" ? s.due === 0 : s.due > 0
    ).filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.guardian.toLowerCase().includes(q)
    );
  }, [students, query, gradeFilter, statusFilter]);
  const counts = reactExports.useMemo(
    () => ({
      total: filtered.length,
      male: filtered.filter((s) => s.gender === "M").length,
      female: filtered.filter((s) => s.gender === "F").length
    }),
    [filtered]
  );
  const handleAdmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.guardian.trim()) {
      toast.error("Name and guardian are required");
      return;
    }
    const nextNum = 2847 + students.filter((s) => s.id.startsWith("STU-28")).length;
    const newStu = {
      id: `STU-${nextNum}`,
      name: form.name.trim(),
      cls: form.cls,
      guardian: form.guardian.trim(),
      due: Number(form.due) || 0
    };
    setStudents((prev) => [newStu, ...prev]);
    toast.success(`${newStu.name} admitted`, { description: `${newStu.id} · ${newStu.cls}` });
    setForm({ name: "", cls: defaultClass, guardian: "", due: "" });
    setOpen(false);
  };
  const exportCsv = () => {
    if (!filtered.length) {
      toast.error("Nothing to export · current filter is empty");
      return;
    }
    const escape = (v) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      "Student,Class,Guardian,Phone,Balance",
      ...filtered.map(
        (s) => [escape(s.name), escape(s.cls), escape(s.guardian), escape(s.phone ?? ""), s.due].join(",")
      )
    ].join("\n");
    const uri = encodeURI("data:text/csv;charset=utf-8," + rows);
    const a = document.createElement("a");
    a.href = uri;
    a.download = `students-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`${filtered.length} students exported`, {
      description: "CSV ready in your downloads folder"
    });
  };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.trim().split(/\r?\n/);
      if (!lines.length) {
        toast.error("Empty CSV file");
        return;
      }
      const start = /name|student/i.test(lines[0] ?? "") ? 1 : 0;
      const fresh = [];
      let next = 2900 + students.length + fresh.length;
      for (let i = start; i < lines.length; i++) {
        const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const [name, cls, guardian, phone, balance] = cells;
        if (!name) continue;
        fresh.push({
          id: `STU-${next++}`,
          name,
          cls: cls || defaultClass,
          guardian: guardian || "—",
          phone: phone || void 0,
          due: Number(balance) || 0
        });
      }
      if (!fresh.length) {
        toast.error("CSV had no parsable rows");
      } else {
        setStudents((prev) => [...fresh, ...prev]);
        toast.success(`${fresh.length} students imported`, {
          description: "Appended to the active tenant ledger"
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => toast.error("Could not read the selected file");
    reader.readAsText(file);
  };
  const downloadPdf = () => {
    if (!filtered.length) {
      toast.error("Nothing to print · current filter is empty");
      return;
    }
    const win = window.open("", "_blank", "width=960,height=720");
    if (!win) {
      toast.error("Popup blocked · allow pop-ups for this site");
      return;
    }
    const stampedAt = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
    const contextLabel = [
      gradeFilter === "all" ? "All Grades" : gradeFilter,
      statusFilter === "all" ? "All Statuses" : statusFilter[0].toUpperCase() + statusFilter.slice(1)
    ].join(" · ");
    const rowsHtml = filtered.map(
      (s) => `<tr>
          <td>${s.id}</td>
          <td>${s.name}</td>
          <td>${s.cls}</td>
          <td>${s.guardian}</td>
          <td>${s.phone ?? ""}</td>
          <td style="text-align:right">${s.due === 0 ? "Cleared" : "₹ " + s.due.toLocaleString("en-IN")}</td>
        </tr>`
    ).join("");
    win.document.write(`<!doctype html><html><head><title>Students Ledger · ${stampedAt}</title>
      <style>
        @page { margin: 18mm; }
        body { font-family: Inter, system-ui, sans-serif; color: #111; margin: 0; padding: 0; }
        h1 { font-size: 16px; margin: 0 0 4px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { padding: 8px 10px; border-bottom: 1px solid #E5E5E5; text-align: left; }
        th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; }
        tbody tr:nth-child(odd) { background: #FAFAFA; }
      </style></head><body>
        <h1>Silver Hills Global · Students Ledger</h1>
        <div class="meta">${contextLabel} · ${filtered.length} students · printed ${stampedAt}</div>
        <table>
          <thead><tr><th>ID</th><th>Student</th><th>Class</th><th>Guardian</th><th>Phone</th><th style="text-align:right">Balance</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 100);
    toast.success("Print preview opened", { description: "Save as PDF from your browser dialog" });
  };
  if (activeStudent) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(StudentProfileDetail, { student: activeStudent, onBack: closeStudent });
  }
  const limeBtn = "flex items-center gap-1.5 rounded-full bg-[#C7F33C] px-4 py-2 text-[12.5px] font-semibold text-black shadow-[0_8px_24px_-12px_rgba(199,243,60,0.6)] transition-colors hover:brightness-95";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-heading", children: "Students Ledger" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[14px] text-black/55", children: [
          students.length,
          " active enrollments · isolated to Silver Hills tenant"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), className: limeBtn, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }),
          " Admit Student"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: downloadPdf, className: limeBtn, title: "Open print-ready PDF preview", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-3.5 w-3.5" }),
          " Download PDF"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: exportCsv, className: limeBtn, title: "Export visible rows as CSV", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
          " Export CSV"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleImportClick,
            className: limeBtn,
            title: "Append students from a CSV file",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3.5 w-3.5" }),
              " Import CSV"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            accept: ".csv,text/csv",
            className: "hidden",
            onChange: handleImport
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", className: "flex flex-wrap items-center gap-3 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pl-1 text-[10.5px] font-semibold uppercase tracking-wider text-black/55", children: "Grade" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: gradeFilter, onValueChange: setGradeFilter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-[150px] rounded-full border-black/10 bg-white text-[12.5px] font-medium text-black focus:ring-[#C7F33C]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "All Grades" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Grades" }),
            grades.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: g, children: g }, g))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-[#E1F2AE] px-3 py-1.5 text-[12px] font-semibold text-black", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: counts.total }),
        "Total Students",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-black/65", children: [
          "(",
          counts.male,
          "M | ",
          counts.female,
          "F)"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto inline-flex items-center rounded-full border border-black/10 bg-white p-1", children: STATUS_TABS.map((t) => {
        const active = statusFilter === t.key;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setStatusFilter(t.key),
            className: `rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${active ? "bg-[#C7F33C] text-black" : "text-black/55 hover:bg-black/5"}`,
            children: t.label
          },
          t.key
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", className: "flex items-center gap-2 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "ml-2 h-3.5 w-3.5 text-black/40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "Search by name, ID, or guardian…",
          className: "flex-1 bg-transparent text-[13px] text-black outline-none placeholder:text-black/35"
        }
      ),
      query && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-[10px] text-black/45", children: [
        filtered.length,
        " match"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3", children: [
      filtered.map((s, i) => {
        const isOverdue = s.due > 0;
        const tone = isOverdue ? "lime" : "white";
        const cornerSide = i % 2 === 0 ? "tr" : "bl";
        const digits = phoneDigits(s.phone);
        const hasPhone = digits.length > 0;
        const waHref = `https://wa.me/${digits.length === 10 ? "91" : ""}${digits}`;
        const openProfile = () => openStudent(s.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          OrganicCard,
          {
            tone,
            cornerSide,
            padded: true,
            role: "button",
            tabIndex: 0,
            "aria-label": `Open profile for ${s.name}`,
            onClick: openProfile,
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openProfile();
              }
            },
            className: "flex cursor-pointer flex-col gap-3 transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pr-12", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[15px] font-semibold leading-tight", children: s.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `mt-1 font-mono text-[11px] ${isOverdue ? "text-black/65" : "text-black/55"}`,
                    children: [
                      s.id,
                      " · ",
                      s.cls
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "span",
                  {
                    className: `rounded-full px-2.5 py-1 text-[11px] font-medium ${isOverdue ? "bg-black text-[#C7F33C]" : "bg-[#F4F4F5] text-black/75"}`,
                    children: [
                      "Guardian · ",
                      s.guardian
                    ]
                  }
                ),
                hasPhone && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "span",
                  {
                    className: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10.5px] ${isOverdue ? "bg-black/15 text-black/85" : "bg-[#F4F4F5] text-black/65"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-2.5 w-2.5" }),
                      formatPhone(s.phone)
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: `text-[10.5px] font-semibold uppercase tracking-wider ${isOverdue ? "text-black/70" : "text-black/45"}`,
                      children: "Due Balance"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 font-mono text-[18px] font-semibold", children: s.due === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-700", children: "Cleared" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "₹ ",
                    s.due.toLocaleString("en-IN")
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ContactAction,
                    {
                      icon: MessageCircle,
                      label: "WhatsApp",
                      accent: "emerald",
                      disabled: !hasPhone,
                      onClick: () => {
                        window.open(waHref, "_blank", "noopener,noreferrer");
                        toast.success(`WhatsApp opened for ${s.guardian}`);
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ContactAction,
                    {
                      icon: Phone,
                      label: "Call",
                      accent: "ink",
                      disabled: !hasPhone,
                      onClick: () => {
                        window.location.href = `tel:${digits}`;
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ContactAction,
                    {
                      icon: MessageSquare,
                      label: "SMS",
                      accent: "ink",
                      disabled: !hasPhone,
                      onClick: () => {
                        window.location.href = `sms:${digits}`;
                      }
                    }
                  )
                ] })
              ] })
            ]
          },
          s.id
        );
      }),
      filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(OrganicCard, { tone: "white", cornerSide: "tr", padded: true, className: "md:col-span-2 xl:col-span-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-10 text-center text-[12.5px] text-black/45", children: "No students match the current filters." }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Admit New Student" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Provision a fresh enrollment record into the Silver Hills tenant ledger." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleAdmit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Full Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.name,
              onChange: (e) => setForm({ ...form, name: e.target.value }),
              placeholder: "e.g. Ishaan Verma",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Class" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FieldSelect,
              {
                value: form.cls,
                onValueChange: (cls) => setForm({ ...form, cls }),
                options: classes.map((c) => ({ value: c.className, label: c.className })),
                placeholder: "Select class",
                disabled: classes.length === 0
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Initial Due (₹)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                inputMode: "numeric",
                value: form.due,
                onChange: (e) => setForm({ ...form, due: e.target.value.replace(/[^0-9]/g, "") }),
                placeholder: "0",
                className: "font-mono"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Guardian Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.guardian,
              onChange: (e) => setForm({ ...form, guardian: e.target.value }),
              placeholder: "e.g. Anita Verma"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "rounded-full bg-black text-white hover:bg-black/85", children: "Admit Student" })
        ] })
      ] })
    ] }) })
  ] });
}
function ContactAction({
  icon: Icon,
  label,
  accent,
  disabled,
  onClick
}) {
  const palette = accent === "emerald" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-black text-white hover:bg-black/85";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick: (e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      },
      disabled,
      "aria-label": label,
      title: disabled ? "No phone on file" : label,
      className: `grid h-8 w-8 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-black/15 disabled:text-black/40 ${palette}`,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5" })
    }
  );
}
function StaffRoster() {
  const { staff, setStaff, departments, roles } = useTenantStore();
  const defaultDept = departments[0]?.name ?? "";
  const defaultRole = roles[0]?.title ?? "";
  const [open, setOpen] = reactExports.useState(false);
  const [pendingRemoval, setPendingRemoval] = reactExports.useState(null);
  const [detailStaff, setDetailStaff] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({
    name: "",
    role: defaultRole,
    dept: defaultDept,
    id: ""
  });
  reactExports.useEffect(() => {
    setForm((prev) => ({
      ...prev,
      role: roles.some((r) => r.title === prev.role) ? prev.role : defaultRole,
      dept: departments.some((d) => d.name === prev.dept) ? prev.dept : defaultDept
    }));
  }, [departments, defaultDept, defaultRole, roles]);
  const handleRecruit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Name and role are required");
      return;
    }
    const empId = form.id.trim() || `STF-${(22 + staff.length).toString().padStart(3, "0")}`;
    const newStaff = {
      id: empId,
      name: form.name.trim(),
      role: form.role.trim(),
      dept: form.dept,
      active: true
    };
    setStaff((prev) => [newStaff, ...prev]);
    toast.success(`${newStaff.name} recruited`, {
      description: `${newStaff.id} · ${newStaff.dept}`
    });
    setForm({ name: "", role: defaultRole, dept: defaultDept, id: "" });
    setOpen(false);
  };
  const toggleStatus = (id) => {
    setStaff((prev) => prev.map((s2) => s2.id === id ? { ...s2, active: !s2.active } : s2));
    const s = staff.find((x) => x.id === id);
    toast(`${s?.name} marked ${s?.active ? "Inactive" : "Active"}`);
  };
  const removeStaff = (id) => {
    const s = staff.find((x) => x.id === id);
    setStaff((prev) => prev.filter((x) => x.id !== id));
    toast.error(`${s?.name} removed from roster`);
  };
  const confirmRemoveStaff = () => {
    if (!pendingRemoval) return;
    removeStaff(pendingRemoval.id);
    setPendingRemoval(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-heading", children: "Staff Roster" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[14px] text-black/55", children: [
          staff.length,
          " faculty & administrative profiles"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setOpen(true),
          className: "flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/85",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }),
            " Recruit Staff"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: staff.map((s, i) => {
      const tone = s.active ? "white" : "limePale";
      const cornerSide = i % 2 === 0 ? "tr" : "bl";
      return /* @__PURE__ */ jsxRuntimeExports.jsx(OrganicCard, { tone, cornerSide, padded: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setDetailStaff(s),
            className: "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black text-[14px] font-semibold text-white",
            children: s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setDetailStaff(s),
              className: "w-full text-left",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-x-2 gap-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[14px] font-semibold text-black", children: s.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11.5px] text-black/55", children: s.role })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 font-mono text-[10px] text-black/45", children: s.id })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-black/55", children: [
                    "Department · ",
                    s.dept
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${s.active ? "bg-[#C7F33C] text-black" : "bg-black/10 text-black/55"}`,
                      children: s.active ? "Active" : "Inactive"
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => toggleStatus(s.id),
                className: "w-full rounded-full border border-[#E5E5E5] bg-white px-3 py-2 text-[11.5px] font-medium text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] sm:min-w-[6.5rem] sm:flex-1",
                children: s.active ? "Deactivate" : "Activate"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => toast(`Editor draft opened for ${s.name}`),
                className: "w-full rounded-full border border-[#E5E5E5] bg-white px-3 py-2 text-[11.5px] font-medium text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] sm:min-w-[6.5rem] sm:flex-1",
                children: "Edit Profile"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setPendingRemoval(s),
                className: "w-full rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[11.5px] font-medium text-[#B91C1C] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2] sm:min-w-[6.5rem] sm:flex-1",
                children: "Remove"
              }
            )
          ] })
        ] })
      ] }) }, s.id);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { children: "Recruit New Staff" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { children: "Provision a faculty / administrative profile for Silver Hills." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleRecruit, className: "mt-5 space-y-3 px-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Full Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.name,
              onChange: (e) => setForm({ ...form, name: e.target.value }),
              placeholder: "e.g. Sneha Pillai",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FieldSelect,
            {
              value: form.role,
              onValueChange: (role) => setForm({ ...form, role }),
              options: roles.map((r) => ({ value: r.title, label: r.title })),
              placeholder: "No roles configured",
              disabled: roles.length === 0
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10.5px] text-black/45", children: "Manage role catalogue under Settings · Roles" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Department" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FieldSelect,
              {
                value: form.dept,
                onValueChange: (dept) => setForm({ ...form, dept }),
                options: departments.map((d) => ({ value: d.name, label: d.name })),
                placeholder: "No departments configured",
                disabled: departments.length === 0
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Employee ID" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: form.id,
                onChange: (e) => setForm({ ...form, id: e.target.value }),
                placeholder: "Auto-generate",
                className: "font-mono"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetFooter, { className: "mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "rounded-full bg-black text-white hover:bg-black/85", children: "Recruit" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Dialog,
      {
        open: Boolean(pendingRemoval),
        onOpenChange: (next) => {
          if (!next) setPendingRemoval(null);
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-[22px] font-semibold text-black", children: "Remove Staff" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "mt-1 text-[13px] leading-relaxed text-black/60", children: pendingRemoval ? `Are you sure you want to remove ${pendingRemoval.name} (${pendingRemoval.id}) from the roster? This action cannot be undone.` : "Are you sure you want to remove this staff profile?" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "mt-5 flex-row justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setPendingRemoval(null), children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                onClick: confirmRemoveStaff,
                className: "rounded-full bg-[#B91C1C] text-white hover:bg-[#991B1B]",
                children: "Remove"
              }
            )
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Dialog,
      {
        open: Boolean(detailStaff),
        onOpenChange: (next) => {
          if (!next) setDetailStaff(null);
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md rounded-[1.75rem] border border-[#E5E5E5] bg-white p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-[24px] font-semibold text-black", children: "Staff Profile" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-[13px] text-black/55", children: "Detailed view for selected faculty / administrative member." })
          ] }),
          detailStaff && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-[#F4F4F5] p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-black/50", children: "Employee" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[18px] font-semibold text-black", children: detailStaff.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[12px] text-black/60", children: detailStaff.role })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-[#E5E5E5] p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-black/45", children: "Employee ID" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-mono text-[12px] text-black", children: detailStaff.id })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-[#E5E5E5] p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-black/45", children: "Status" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[12px] font-semibold text-black", children: detailStaff.active ? "Active" : "Inactive" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-[#E5E5E5] p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-black/45", children: "Department" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[12px] text-black", children: detailStaff.dept })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { className: "mt-5 flex-row justify-end gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setDetailStaff(null), children: "Close" }) })
        ] })
      }
    )
  ] });
}
function FinanceModule() {
  const [tab, setTab] = reactExports.useState(
    "receive"
  );
  const tabs = [
    { k: "receive", l: "Receive Payment" },
    { k: "make", l: "Make Payment" },
    { k: "analytics", l: "Ledger Analytics" },
    { k: "ledger", l: "Ledger" },
    { k: "pl", l: "Profit & Loss Account" },
    { k: "balance", l: "Balance Sheet" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-heading", children: "Finance Command Center" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[14px] text-black/55", children: "Receive, disburse, and analyse cashflow in real time" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-full overflow-x-auto pb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex min-w-max rounded-full border border-[#E5E5E5] bg-white p-1", children: tabs.map((t) => {
      const active = tab === t.k;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setTab(t.k),
          className: `whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-medium transition-all sm:px-5 sm:text-[12.5px] ${active ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"}`,
          children: t.l
        },
        t.k
      );
    }) }) }),
    tab === "receive" && /* @__PURE__ */ jsxRuntimeExports.jsx(ReceivePayment, {}),
    tab === "make" && /* @__PURE__ */ jsxRuntimeExports.jsx(MakePayment, {}),
    tab === "analytics" && /* @__PURE__ */ jsxRuntimeExports.jsx(LedgerAnalytics, {}),
    tab === "ledger" && /* @__PURE__ */ jsxRuntimeExports.jsx(GeneralLedgerReport, {}),
    tab === "pl" && /* @__PURE__ */ jsxRuntimeExports.jsx(ProfitLossReport, {}),
    tab === "balance" && /* @__PURE__ */ jsxRuntimeExports.jsx(BalanceSheetReport, {})
  ] });
}
function FieldLabel({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-[10px] font-semibold uppercase tracking-wider text-black/55", children });
}
function ReceivePayment() {
  const {
    students,
    setStudents,
    payments,
    setPayments,
    classes: classConfigs,
    transportRoutes,
    paymentCategories,
    academicYear
  } = useTenantStore();
  const { session } = useAuth();
  const schoolName = session?.tenantName ?? "Silver Hills Global";
  const classes = reactExports.useMemo(() => {
    const fromConfig = classConfigs.map((c) => c.className);
    const fromStudents = Array.from(new Set(students.map((s) => s.cls)));
    return Array.from(/* @__PURE__ */ new Set([...fromConfig, ...fromStudents]));
  }, [classConfigs, students]);
  const [cls, setCls] = reactExports.useState(classes[0] ?? "");
  const studentsInClass = reactExports.useMemo(() => students.filter((s) => s.cls === cls), [students, cls]);
  const [stu, setStu] = reactExports.useState(studentsInClass[0]?.name ?? students[0]?.name ?? "");
  const [category, setCategory] = reactExports.useState(paymentCategories[0]?.label ?? "Tuition Fee");
  const [amount, setAmount] = reactExports.useState("");
  const [mode, setMode] = reactExports.useState("Bank");
  const selected = students.find((s) => s.name === stu);
  reactExports.useEffect(() => {
    if (classes.length && !classes.includes(cls)) {
      setCls(classes[0]);
    }
  }, [classes, cls]);
  reactExports.useEffect(() => {
    const pool = studentsInClass.length ? studentsInClass : students;
    if (pool.length && !pool.some((s) => s.name === stu)) {
      setStu(pool[0].name);
    }
  }, [students, studentsInClass, stu]);
  reactExports.useEffect(() => {
    if (paymentCategories.length && !paymentCategories.some((c) => c.label === category)) {
      setCategory(paymentCategories[0].label);
    }
  }, [category, paymentCategories]);
  const matchedRouteFee = reactExports.useMemo(() => {
    if (!selected) return void 0;
    const haystack = `${selected.address ?? ""} ${selected.cls}`.toLowerCase();
    const matched = transportRoutes.find(
      (r) => r.mapFrom.toLowerCase().split(/[ ,]+/).some((token) => token.length > 3 && haystack.includes(token))
    );
    return matched?.fee ?? transportRoutes[0]?.fee;
  }, [selected, transportRoutes]);
  const tuitionFee = reactExports.useMemo(
    () => classConfigs.find((c) => c.className === selected?.cls)?.tuitionFeeAmount,
    [classConfigs, selected]
  );
  const prefill = reactExports.useMemo(() => {
    const lower = category.toLowerCase();
    if (lower.includes("tuition")) return tuitionFee;
    if (lower.includes("vehicle") || lower.includes("transport") || lower.includes("bus"))
      return matchedRouteFee;
    return void 0;
  }, [category, tuitionFee, matchedRouteFee]);
  reactExports.useEffect(() => {
    if (prefill !== void 0 && prefill > 0) {
      setAmount(String(prefill));
    } else {
      setAmount("");
    }
  }, [prefill]);
  const handleRecord = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!selected) {
      toast.error("Select a valid student");
      return;
    }
    const now = /* @__PURE__ */ new Date();
    const stamp = `Today · ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newPayment = {
      id: `RC-${9822 + payments.length}`,
      name: selected.name,
      cat: category,
      mode,
      amount: value,
      time: stamp
    };
    setPayments((prev) => [newPayment, ...prev]);
    setStudents(
      (prev) => prev.map((s) => s.id === selected.id ? { ...s, due: Math.max(0, s.due - value) } : s)
    );
    const remaining = Math.max(0, selected.due - value);
    toast.success(`Receipt ${newPayment.id} · ₹ ${value.toLocaleString("en-IN")} captured`, {
      description: remaining === 0 ? `${selected.name}'s balance is now Cleared` : `${selected.name} · balance ₹ ${remaining.toLocaleString("en-IN")}`
    });
    setAmount("");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", padded: true, className: "lg:col-span-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Inbound Fee Capture" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Class" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FieldSelect,
            {
              value: cls,
              onValueChange: (next) => {
                setCls(next);
                const first = students.find((s) => s.cls === next);
                if (first) setStu(first.name);
              },
              options: classes.map((c) => ({ value: c, label: c })),
              placeholder: "Select class",
              disabled: classes.length === 0
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Student" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FieldSelect,
            {
              value: stu,
              onValueChange: setStu,
              options: (studentsInClass.length ? studentsInClass : students).map((s) => ({
                value: s.name,
                label: s.name
              })),
              placeholder: "Select student"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Fee Categories" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          paymentCategories.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] text-black/55", children: "No categories configured · add them under Settings" }),
          paymentCategories.map((c) => {
            const active = category === c.label;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setCategory(c.label),
                className: `rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${active ? "border-transparent bg-[#C7F33C] text-black" : "border-[#E5E5E5] text-black/65 hover:bg-[#F4F4F5]"}`,
                children: c.label
              },
              c.id
            );
          })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Amount (₹)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: amount,
              onChange: (e) => setAmount(e.target.value.replace(/[^0-9]/g, "")),
              inputMode: "numeric",
              placeholder: "0",
              className: "h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 font-mono text-[13px]"
            }
          ),
          prefill !== void 0 && prefill > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10.5px] text-black/45", children: [
            "Prefilled ₹ ",
            prefill.toLocaleString("en-IN"),
            " from Settings · ",
            category
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Payment Mode" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1", children: ["Bank", "UPI", "Cash"].map((m) => {
            const active = mode === m;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setMode(m),
                className: `flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${active ? "bg-black text-white" : "text-black/65 hover:text-black"}`,
                children: m
              },
              m
            );
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex items-center justify-between rounded-2xl bg-[#F4F4F5] p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[12.5px] text-black/65", children: [
          "Receipt for ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-black", children: stu }),
          " · ",
          cls,
          " ·",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-black", children: category }),
          " · ",
          mode,
          selected && selected.due > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 inline-flex items-center gap-1 font-mono text-black", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3 w-3" }),
            " Due ₹ ",
            selected.due.toLocaleString("en-IN")
          ] }),
          selected && selected.due === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 font-mono text-black", children: "· Cleared" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleRecord,
            disabled: !Number(amount),
            className: "rounded-full bg-black px-5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85 disabled:opacity-50",
            children: [
              "Record ₹ ",
              (Number(amount) || 0).toLocaleString("en-IN")
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "bl", padded: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Payment History" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11.5px] text-black/55", children: [
        payments.length,
        " receipts · most recent"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 max-h-[420px] divide-y divide-[#F0F0F0] overflow-y-auto", children: payments.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 text-[12.5px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-black", children: p.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-black", children: [
              "+₹ ",
              p.amount.toLocaleString("en-IN")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                "aria-label": `Download receipt ${p.id}`,
                onClick: () => {
                  downloadReceiptPdf(p, schoolName, academicYear);
                  toast.success(`Receipt ${p.id} downloaded`);
                },
                className: "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#E5E5E5] text-black/55 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 flex items-center justify-between text-[10.5px] text-black/55", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            p.cat,
            " · ",
            p.mode
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: p.time })
        ] })
      ] }, p.id)) })
    ] })
  ] });
}
function MakePayment() {
  const [payee, setPayee] = reactExports.useState("Salary");
  const [mode, setMode] = reactExports.useState("Bank Transfer · NEFT");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", padded: true, className: "lg:col-span-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Outbound Disbursal" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Payee Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1", children: ["Salary", "Vendor"].map((p) => {
            const active = payee === p;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setPayee(p),
                className: `flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium ${active ? "bg-black text-white" : "text-black/65"}`,
                children: p
              },
              p
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Beneficiary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              defaultValue: "BrightBus Logistics Pvt. Ltd.",
              className: "h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 text-[13px]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Description / Line Items" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              defaultValue: "Bus diesel refill (1,240 L) + monthly preventive maintenance fleet of 12 vehicles",
              className: "min-h-[80px] w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2 text-[13px]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Amount (₹)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              defaultValue: "48200",
              className: "h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 font-mono text-[13px]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FieldLabel, { children: "Mode" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FieldSelect,
            {
              value: mode,
              onValueChange: setMode,
              options: [
                { value: "Bank Transfer · NEFT", label: "Bank Transfer · NEFT" },
                { value: "UPI Business", label: "UPI Business" },
                { value: "Cheque", label: "Cheque" }
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => toast.success("Authorisation queued for treasury approval"),
          className: "rounded-full bg-black px-5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85",
          children: "Authorise Disbursal"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "bl", padded: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Top Pending Obligations" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-3", children: PENDING_OBLIGATIONS.map((p, i) => {
        const isUrgent = i === 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `rounded-2xl p-3 ${isUrgent ? "bg-[#C7F33C] text-black" : "bg-[#F4F4F5] text-black"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[12.5px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: p.payee }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono", children: [
                  "₹ ",
                  p.amount.toLocaleString("en-IN")
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `mt-0.5 flex items-center justify-between text-[10.5px] ${isUrgent ? "text-black/70" : "text-black/55"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: p.desc }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "span",
                      {
                        className: `rounded-full px-2 py-0.5 ${isUrgent ? "bg-black text-[#C7F33C]" : "bg-black/10 text-black/65"}`,
                        children: [
                          "Due ",
                          p.due
                        ]
                      }
                    )
                  ]
                }
              )
            ]
          },
          p.payee
        );
      }) })
    ] })
  ] });
}
function Donut({
  title,
  segments,
  cornerSide = "tr"
}) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  let acc = 0;
  const gradient = segments.map((s) => {
    const from = acc / total * 360;
    acc += s.value;
    const to = acc / total * 360;
    return `${s.color} ${from}deg ${to}deg`;
  }).join(", ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide, arrow: true, padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "relative h-36 w-36 rounded-full",
          style: { background: `conic-gradient(${gradient})` },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-4 grid place-items-center rounded-full bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-mono text-lg font-semibold text-black", children: [
              "₹ ",
              total.toLocaleString("en-IN")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wider text-black/45", children: "Total" })
          ] }) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 space-y-2", children: segments.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12.5px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-sm", style: { backgroundColor: s.color } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-black/65", children: s.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-black", children: [
          "₹ ",
          s.value.toLocaleString("en-IN")
        ] })
      ] }, s.label)) })
    ] })
  ] });
}
function LedgerAnalytics() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Donut,
      {
        title: "Income Distribution",
        cornerSide: "tr",
        segments: [
          { label: "Tuition", value: 184e4, color: "#000000" },
          { label: "Transport", value: 32e4, color: "#C7F33C" },
          { label: "Donations", value: 95e3, color: "#E1F2AE" },
          { label: "Other", value: 42e3, color: "#9CA3AF" }
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Donut,
      {
        title: "Monthly Outflow Breakdown",
        cornerSide: "bl",
        segments: [
          { label: "Salaries", value: 122e4, color: "#000000" },
          { label: "Vehicle Upkeep", value: 184e3, color: "#C7F33C" },
          { label: "Utilities", value: 88e3, color: "#E1F2AE" },
          { label: "Rent", value: 24e4, color: "#9CA3AF" }
        ]
      }
    )
  ] });
}
function SchoolSettings() {
  const {
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
    staff,
    setStaff,
    students,
    setStudents
  } = useTenantStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-heading", children: "Tenant Settings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[14px] text-black/55", children: "Configure organisational structure, fee tiers, and ledger constants for this workspace" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12px] font-semibold text-black", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-[#C7F33C]" }),
        " ",
        academicYear
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DepartmentsCard,
        {
          departments,
          setDepartments,
          staff,
          setStaff,
          roles
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        RolesCard,
        {
          roles,
          setRoles,
          departments,
          staff,
          setStaff
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ClassesCard,
        {
          classes,
          setClasses,
          students,
          setStudents
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TransportCard, { transportRoutes, setTransportRoutes }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        CategoriesCard,
        {
          paymentCategories,
          setPaymentCategories,
          academicYear,
          setAcademicYear,
          themeSettings,
          setThemeSettings
        }
      )
    ] })
  ] });
}
function CardHeader({
  title,
  subtitle,
  actionLabel,
  onAction
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[18px] font-bold leading-tight tracking-tight text-black", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[12px] text-black/55", children: subtitle })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: onAction,
        className: "inline-flex shrink-0 items-center gap-1 rounded-full bg-black px-3 py-2 text-[11.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/85",
        "aria-label": actionLabel,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }),
          " Add"
        ]
      }
    )
  ] });
}
function EmptyRow({ label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-6 text-center text-[12px] text-black/55", children: label });
}
function DepartmentsCard({
  departments,
  setDepartments,
  staff,
  setStaff,
  roles
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({ name: "", code: "" });
  const startCreate = () => {
    setEditingId(null);
    setForm({ name: "", code: "" });
    setOpen(true);
  };
  const startEdit = (d) => {
    setEditingId(d.id);
    setForm({ name: d.name, code: d.code });
    setOpen(true);
  };
  const submit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || !code) {
      toast.error("Department name and code are required");
      return;
    }
    if (editingId) {
      const previous = departments.find((d) => d.id === editingId);
      setDepartments((prev) => prev.map((d) => d.id === editingId ? { ...d, name, code } : d));
      if (previous && previous.name !== name) {
        setStaff((prev) => prev.map((s) => s.dept === previous.name ? { ...s, dept: name } : s));
      }
      toast.success(`Department updated · ${name}`);
    } else {
      const nextId = `DEP-${(departments.length + 1).toString().padStart(3, "0")}`;
      setDepartments((prev) => [...prev, { id: nextId, name, code }]);
      toast.success(`Department added · ${name}`);
    }
    setOpen(false);
  };
  const remove = (d) => {
    const usedByStaff = staff.some((s) => s.dept === d.name);
    const usedByRole = roles.some((r) => r.departmentId === d.id);
    if (usedByStaff || usedByRole) {
      toast.error(`${d.name} is in use`, {
        description: usedByStaff ? "Reassign staff before deleting" : "Detach roles before deleting"
      });
      return;
    }
    setDepartments((prev) => prev.filter((x) => x.id !== d.id));
    toast.error(`${d.name} removed`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", arrow: true, padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CardHeader,
      {
        title: "Departments",
        subtitle: `${departments.length} divisions · live staff counts`,
        actionLabel: "Add Department",
        onAction: startCreate
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
      departments.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyRow, { label: "No departments yet" }),
      departments.map((d) => {
        const count = staff.filter((s) => s.dept === d.name).length;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-black text-[10.5px] font-semibold text-white", children: d.code.slice(0, 3) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[13px] font-semibold text-black", children: d.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[10.5px] uppercase tracking-wider text-black/45", children: d.code })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-[#E1F2AE] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-black", children: [
                  count,
                  " staff"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      className: "grid h-8 w-8 place-items-center rounded-full text-black/55 hover:bg-black/5 hover:text-black",
                      "aria-label": "More",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-3.5 w-3.5" })
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-44 rounded-2xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => startEdit(d), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-2 h-3.5 w-3.5" }),
                      " Rename"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      DropdownMenuItem,
                      {
                        onClick: () => remove(d),
                        className: "text-[#B91C1C] focus:text-[#B91C1C]",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-3.5 w-3.5" }),
                          " Delete"
                        ]
                      }
                    )
                  ] })
                ] })
              ] })
            ]
          },
          d.id
        );
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingId ? "Rename Department" : "Add Department" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Define a new organisational unit. Staff and roles can be assigned to it immediately." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Department Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.name,
              onChange: (e) => setForm({ ...form, name: e.target.value }),
              placeholder: "e.g. Library Sciences",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Department Code" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.code,
              onChange: (e) => setForm({ ...form, code: e.target.value.toUpperCase() }),
              placeholder: "e.g. LIB",
              className: "font-mono uppercase"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "rounded-full bg-black text-white hover:bg-black/85", children: editingId ? "Save" : "Add Department" })
        ] })
      ] })
    ] }) })
  ] });
}
function RolesCard({
  roles,
  setRoles,
  departments,
  staff,
  setStaff
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({
    title: "",
    departmentId: departments[0]?.id ?? ""
  });
  const startCreate = () => {
    setEditingId(null);
    setForm({ title: "", departmentId: departments[0]?.id ?? "" });
    setOpen(true);
  };
  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ title: r.title, departmentId: r.departmentId });
    setOpen(true);
  };
  const submit = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error("Role title is required");
      return;
    }
    if (!form.departmentId) {
      toast.error("Pick a parent department");
      return;
    }
    if (editingId) {
      const previous = roles.find((r) => r.id === editingId);
      setRoles(
        (prev) => prev.map(
          (r) => r.id === editingId ? { ...r, title, departmentId: form.departmentId } : r
        )
      );
      if (previous && previous.title !== title) {
        setStaff(
          (prev) => prev.map((s) => s.role === previous.title ? { ...s, role: title } : s)
        );
      }
      toast.success(`Role updated · ${title}`);
    } else {
      const nextId = `ROL-${(roles.length + 1).toString().padStart(3, "0")}`;
      setRoles((prev) => [...prev, { id: nextId, title, departmentId: form.departmentId }]);
      toast.success(`Role added · ${title}`);
    }
    setOpen(false);
  };
  const remove = (r) => {
    const usedByStaff = staff.some((s) => s.role === r.title);
    if (usedByStaff) {
      toast.error(`${r.title} is in use`, { description: "Reassign staff before deleting" });
      return;
    }
    setRoles((prev) => prev.filter((x) => x.id !== r.id));
    toast.error(`${r.title} removed`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "bl", arrow: true, padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CardHeader,
      {
        title: "Roles",
        subtitle: `${roles.length} role definitions · select in Recruit Staff`,
        actionLabel: "Add Role",
        onAction: startCreate
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
      roles.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyRow, { label: "No roles defined yet" }),
      roles.map((r) => {
        const dept = departments.find((d) => d.id === r.departmentId);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[13px] font-semibold text-black", children: r.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11.5px] text-black/55", children: dept?.name ?? "Unassigned" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    className: "grid h-8 w-8 shrink-0 place-items-center rounded-full text-black/55 hover:bg-black/5 hover:text-black",
                    "aria-label": "More",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-3.5 w-3.5" })
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-44 rounded-2xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => startEdit(r), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-2 h-3.5 w-3.5" }),
                    " Rename"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    DropdownMenuItem,
                    {
                      onClick: () => remove(r),
                      className: "text-[#B91C1C] focus:text-[#B91C1C]",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-3.5 w-3.5" }),
                        " Delete"
                      ]
                    }
                  )
                ] })
              ] })
            ]
          },
          r.id
        );
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingId ? "Rename Role" : "Add Role" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Roles defined here become selectable inside the Recruit Staff workflow." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Role Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.title,
              onChange: (e) => setForm({ ...form, title: e.target.value }),
              placeholder: "e.g. Chemistry · HOD",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Parent Department" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FieldSelect,
            {
              value: form.departmentId,
              onValueChange: (departmentId) => setForm({ ...form, departmentId }),
              options: departments.map((d) => ({ value: d.id, label: d.name })),
              placeholder: "Select department",
              disabled: departments.length === 0
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "rounded-full bg-black text-white hover:bg-black/85", children: editingId ? "Save" : "Add Role" })
        ] })
      ] })
    ] }) })
  ] });
}
function ClassesCard({
  classes,
  setClasses,
  students,
  setStudents
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({ className: "", tuitionFeeAmount: "", billingCycle: "Monthly" });
  const startCreate = () => {
    setEditingId(null);
    setForm({ className: "", tuitionFeeAmount: "", billingCycle: "Monthly" });
    setOpen(true);
  };
  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      className: c.className,
      tuitionFeeAmount: String(c.tuitionFeeAmount),
      billingCycle: c.billingCycle
    });
    setOpen(true);
  };
  const submit = (e) => {
    e.preventDefault();
    const className = form.className.trim();
    const tuitionFeeAmount = Number(form.tuitionFeeAmount);
    if (!className) {
      toast.error("Class name is required");
      return;
    }
    if (!tuitionFeeAmount || tuitionFeeAmount <= 0) {
      toast.error("Tuition fee must be a positive amount");
      return;
    }
    if (editingId) {
      const previous = classes.find((c) => c.id === editingId);
      setClasses(
        (prev) => prev.map(
          (c) => c.id === editingId ? { ...c, className, tuitionFeeAmount, billingCycle: form.billingCycle } : c
        )
      );
      if (previous && previous.className !== className) {
        setStudents(
          (prev) => prev.map((s) => s.cls === previous.className ? { ...s, cls: className } : s)
        );
      }
      toast.success(`${className} updated`, {
        description: `Receipts will prefill ₹ ${tuitionFeeAmount.toLocaleString("en-IN")}`
      });
    } else {
      const nextId = `CLS-${(classes.length + 1).toString().padStart(3, "0")}`;
      setClasses((prev) => [
        ...prev,
        { id: nextId, className, tuitionFeeAmount, billingCycle: form.billingCycle }
      ]);
      toast.success(`${className} added`);
    }
    setOpen(false);
  };
  const remove = (c) => {
    const enrolled = students.some((s) => s.cls === c.className);
    if (enrolled) {
      toast.error(`${c.className} has students enrolled`, {
        description: "Move them to another class first"
      });
      return;
    }
    setClasses((prev) => prev.filter((x) => x.id !== c.id));
    toast.error(`${c.className} removed`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", arrow: true, padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CardHeader,
      {
        title: "Class Tiers & Tuition",
        subtitle: "Receipt amounts prefill from this matrix",
        actionLabel: "Add Class",
        onAction: startCreate
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
      classes.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyRow, { label: "No class tiers configured" }),
      classes.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[13px] font-semibold text-black", children: c.className }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 flex items-center gap-2 text-[11.5px] text-black/55", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-black", children: [
                  "₹ ",
                  c.tuitionFeeAmount.toLocaleString("en-IN")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-[#E1F2AE] px-2 py-0.5 text-[10.5px] font-semibold text-black", children: c.billingCycle })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "grid h-8 w-8 shrink-0 place-items-center rounded-full text-black/55 hover:bg-black/5 hover:text-black",
                  "aria-label": "More",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-3.5 w-3.5" })
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-40 rounded-2xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => startEdit(c), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-2 h-3.5 w-3.5" }),
                  " Edit"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  DropdownMenuItem,
                  {
                    onClick: () => remove(c),
                    className: "text-[#B91C1C] focus:text-[#B91C1C]",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-3.5 w-3.5" }),
                      " Delete"
                    ]
                  }
                )
              ] })
            ] })
          ]
        },
        c.id
      ))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingId ? "Edit Class Tier" : "Add Class Tier" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Tuition fees set here drive the prefill amount inside Finance · Receive Payment." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Class / Grade Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.className,
              onChange: (e) => setForm({ ...form, className: e.target.value }),
              placeholder: "e.g. Grade 8 - B",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Tuition Fee (₹)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                inputMode: "numeric",
                value: form.tuitionFeeAmount,
                onChange: (e) => setForm({ ...form, tuitionFeeAmount: e.target.value.replace(/[^0-9]/g, "") }),
                placeholder: "0",
                className: "font-mono"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Billing Cycle" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FieldSelect,
              {
                value: form.billingCycle,
                onValueChange: (billingCycle) => setForm({
                  ...form,
                  billingCycle
                }),
                options: [
                  { value: "Monthly", label: "Monthly" },
                  { value: "Annually", label: "Annually" }
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "rounded-full bg-black text-white hover:bg-black/85", children: editingId ? "Save" : "Add Class" })
        ] })
      ] })
    ] }) })
  ] });
}
function TransportCard({
  transportRoutes,
  setTransportRoutes
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({ mapFrom: "", mapTo: "", fee: "" });
  const startCreate = () => {
    setEditingId(null);
    setForm({ mapFrom: "", mapTo: "", fee: "" });
    setOpen(true);
  };
  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ mapFrom: r.mapFrom, mapTo: r.mapTo, fee: String(r.fee) });
    setOpen(true);
  };
  const submit = (e) => {
    e.preventDefault();
    const mapFrom = form.mapFrom.trim();
    const mapTo = form.mapTo.trim();
    const fee = Number(form.fee);
    if (!mapFrom || !mapTo) {
      toast.error("Pickup hub and destination are required");
      return;
    }
    if (!fee || fee <= 0) {
      toast.error("Fee must be a positive amount");
      return;
    }
    if (editingId) {
      setTransportRoutes(
        (prev) => prev.map((r) => r.id === editingId ? { ...r, mapFrom, mapTo, fee } : r)
      );
      toast.success(`Route updated · ${mapFrom} → ${mapTo}`);
    } else {
      const nextId = `TR-${(transportRoutes.length + 1).toString().padStart(3, "0")}`;
      setTransportRoutes((prev) => [...prev, { id: nextId, mapFrom, mapTo, fee }]);
      toast.success(`Route added · ${mapFrom} → ${mapTo}`);
    }
    setOpen(false);
  };
  const remove = (r) => {
    setTransportRoutes((prev) => prev.filter((x) => x.id !== r.id));
    toast.error(`${r.mapFrom} → ${r.mapTo} removed`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "bl", arrow: true, padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CardHeader,
      {
        title: "Transport Routes",
        subtitle: `${transportRoutes.length} mapped pickup → drop pairs`,
        actionLabel: "Add Route",
        onAction: startCreate
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 overflow-hidden rounded-2xl border border-[#EFEFEF]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[1.4fr_1.4fr_0.7fr_auto] gap-2 bg-[#F4F4F5] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/55", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "From" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "To" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right", children: "Fee" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
      ] }),
      transportRoutes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3.5 py-6 text-center text-[12px] text-black/55", children: "No routes mapped yet" }) : transportRoutes.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "grid grid-cols-[1.4fr_1.4fr_0.7fr_auto] items-center gap-2 border-t border-[#EFEFEF] px-3.5 py-2.5 text-[12.5px] last:border-b-0",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-black", children: r.mapFrom }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-black/75", children: r.mapTo }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-right font-mono text-black", children: [
              "₹ ",
              r.fee.toLocaleString("en-IN")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "grid h-7 w-7 place-items-center rounded-full text-black/55 hover:bg-black/5 hover:text-black",
                  "aria-label": "More",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-3.5 w-3.5" })
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-40 rounded-2xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => startEdit(r), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-2 h-3.5 w-3.5" }),
                  " Edit"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  DropdownMenuItem,
                  {
                    onClick: () => remove(r),
                    className: "text-[#B91C1C] focus:text-[#B91C1C]",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-3.5 w-3.5" }),
                      " Delete"
                    ]
                  }
                )
              ] })
            ] })
          ]
        },
        r.id
      ))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingId ? "Edit Route" : "Add Transport Route" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Routes feed the Vehicle Fee prefill on Receive Payment when a student matches the pickup hub." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Map From (Pickup Hub)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.mapFrom,
              onChange: (e) => setForm({ ...form, mapFrom: e.target.value }),
              placeholder: "e.g. Lotus Greens Sector 21",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Map To (Destination Node)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.mapTo,
              onChange: (e) => setForm({ ...form, mapTo: e.target.value }),
              placeholder: "e.g. Main Campus Drop-off"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Fee (₹)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              inputMode: "numeric",
              value: form.fee,
              onChange: (e) => setForm({ ...form, fee: e.target.value.replace(/[^0-9]/g, "") }),
              placeholder: "0",
              className: "font-mono"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "rounded-full bg-black text-white hover:bg-black/85", children: editingId ? "Save" : "Add Route" })
        ] })
      ] })
    ] }) })
  ] });
}
function CategoriesCard({
  paymentCategories,
  setPaymentCategories,
  academicYear,
  setAcademicYear,
  themeSettings,
  setThemeSettings
}) {
  const [draft, setDraft] = reactExports.useState("");
  const addCategory = (e) => {
    e.preventDefault();
    const label = draft.trim();
    if (!label) return;
    if (paymentCategories.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      toast.error(`${label} already exists`);
      return;
    }
    const nextId = `PC-${(paymentCategories.length + 1).toString().padStart(3, "0")}`;
    setPaymentCategories((prev) => [...prev, { id: nextId, label }]);
    toast.success(`Category added · ${label}`, {
      description: "Now selectable on Receive Payment"
    });
    setDraft("");
  };
  const removeCategory = (c) => {
    setPaymentCategories((prev) => prev.filter((x) => x.id !== c.id));
    toast.error(`${c.label} removed`, { description: "Existing receipts retain the label" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", arrow: true, padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[18px] font-bold leading-tight tracking-tight text-black", children: "System Constants" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[12px] text-black/55", children: "Academic year, theme frame, and payment categories for Finance selectors" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Academic Year" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FieldSelect,
          {
            value: academicYear,
            onValueChange: (y) => {
              setAcademicYear(y);
              toast.success(`Academic year set to ${y}`);
            },
            options: ACADEMIC_YEAR_OPTIONS.map((y) => ({ value: y, label: y })),
            className: "mt-1.5 font-medium"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-2 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ThemeSelect,
          {
            label: "Theme",
            value: themeSettings.mode,
            options: THEME_MODE_OPTIONS,
            onChange: (mode) => {
              setThemeSettings((prev) => ({ ...prev, mode }));
              toast.success(`Theme mode set to ${mode}`);
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ThemeSelect,
          {
            label: "Accent",
            value: themeSettings.accent,
            options: THEME_ACCENT_OPTIONS,
            onChange: (accent) => {
              setThemeSettings((prev) => ({ ...prev, accent }));
              toast.success(`Accent set to ${accent}`);
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ThemeSelect,
          {
            label: "Density",
            value: themeSettings.density,
            options: THEME_DENSITY_OPTIONS,
            onChange: (density) => {
              setThemeSettings((prev) => ({ ...prev, density }));
              toast.success(`Workspace density set to ${density}`);
            }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Payment Categories" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-[10.5px] text-black/45", children: [
          paymentCategories.length,
          " active"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [
        paymentCategories.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] text-black/55", children: "No categories defined" }),
        paymentCategories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#E1F2AE] px-3 py-1 text-[12px] font-semibold text-black",
            children: [
              c.label,
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => removeCategory(c),
                  className: "grid h-4 w-4 place-items-center rounded-full text-black/55 hover:bg-black hover:text-white",
                  "aria-label": `Remove ${c.label}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                }
              )
            ]
          },
          c.id
        ))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: addCategory, className: "mt-3 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: draft,
            onChange: (e) => setDraft(e.target.value),
            placeholder: "e.g. Lab Fee",
            className: "flex-1"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", className: "rounded-full bg-black text-white hover:bg-black/85", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-3.5 w-3.5" }),
          " Add"
        ] })
      ] })
    ] })
  ] });
}
function ThemeSelect({
  label,
  value,
  options,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[10px] font-semibold uppercase tracking-wider text-black/45", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FieldSelect,
      {
        value,
        onValueChange: (next) => onChange(next),
        options: options.map((option) => ({ value: option, label: option })),
        triggerClassName: "h-9 px-2.5 text-[12px] font-medium"
      }
    )
  ] });
}
function FieldSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
  triggerClassName
}) {
  const resolvedValue = options.some((o) => o.value === value) ? value : void 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: resolvedValue, onValueChange, disabled, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SelectTrigger,
      {
        className: cn(
          "h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 text-[13px] font-normal text-black shadow-none focus:ring-2 focus:ring-[#C7F33C] focus:ring-offset-0",
          triggerClassName
        ),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SelectContent,
      {
        position: "popper",
        className: "z-[250] rounded-2xl border border-[#E5E5E5] bg-white p-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]",
        children: options.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectItem,
          {
            value: opt.value,
            className: "cursor-pointer rounded-xl py-2 pl-3 pr-8 text-[13px] text-black focus:bg-[#E1F2AE] focus:text-black data-[highlighted]:bg-[#E1F2AE] data-[highlighted]:text-black data-[state=checked]:bg-[#C7F33C] data-[state=checked]:font-semibold data-[state=checked]:text-black",
            children: opt.label
          },
          opt.value
        ))
      }
    )
  ] }) });
}
export {
  FinanceModule as F,
  StudentsLedger as S,
  StaffRoster as a,
  SchoolSettings as b,
  SchoolDashboard as c
};
