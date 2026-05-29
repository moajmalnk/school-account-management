import { Shield, Building2, GraduationCap, User } from "lucide-react";

export type Role = "super_admin" | "school_admin" | "staff" | "student";

const ROLES: { key: Role; label: string; sub: string; icon: typeof Shield }[] = [
  { key: "super_admin", label: "Super Admin", sub: "Control Plane", icon: Shield },
  { key: "school_admin", label: "School Admin", sub: "Silver Hills Global", icon: Building2 },
  { key: "staff", label: "Staff / Teacher", sub: "Faculty workspace", icon: GraduationCap },
  { key: "student", label: "Student / Parent", sub: "Fee portal", icon: User },
];

export function RoleSwitcher({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-slate-800/60 bg-slate-900/95 p-1 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.6)] backdrop-blur">
        <div className="px-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          [Simulate Role]
        </div>
        {ROLES.map((r) => {
          const Icon = r.icon;
          const active = role === r.key;
          return (
            <button
              key={r.key}
              onClick={() => onChange(r.key)}
              className={`group flex items-center gap-2 rounded-full px-3 py-2 text-left transition-all ${
                active ? "text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
              style={active ? { background: "linear-gradient(135deg,#10B981,#6366F1)" } : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
              <div className="leading-tight">
                <div className="text-[11px] font-semibold">{r.label}</div>
                <div className={`text-[9px] ${active ? "text-white/80" : "text-slate-500"}`}>{r.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}