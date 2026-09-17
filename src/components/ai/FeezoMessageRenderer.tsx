import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { FeezoNavigation, FeezoUiBlock } from "@/lib/api/ai";
import { cn, glassInsetClass } from "@/lib/utils";

const CHART_COLORS = ["#0F766E", "#0D9488", "#F43F5E", "#8B5CF6", "#F59E0B", "#3B82F6"];

type Props = {
  blocks?: FeezoUiBlock[];
  navigations?: FeezoNavigation[];
  onNavigate: (nav: FeezoNavigation) => void;
};

function formatCell(value: string | number | null | undefined) {
  if (value == null) return "—";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return String(value);
}

export function FeezoMessageRenderer({ blocks, navigations, onNavigate }: Props) {
  const items = blocks ?? [];

  return (
    <div className="mt-2 space-y-2">
      {items.map((block, idx) => {
        if (block.type === "text" && block.text) {
          return (
            <p key={idx} className="whitespace-pre-wrap text-sm text-slate-700 dark:text-zinc-200">
              {block.text}
            </p>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={idx}
              className={cn(glassInsetClass, "overflow-hidden rounded-xl border border-white/60 dark:border-white/10")}
            >
              {block.title ? (
                <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-zinc-200">
                  {block.title}
                </div>
              ) : null}
              <div className="max-h-56 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full min-w-[240px] text-left text-[11px]">
                  <thead className="sticky top-0 bg-white/90 dark:bg-zinc-900/90">
                    <tr>
                      {block.columns.map((col) => (
                        <th key={col} className="px-2.5 py-1.5 font-semibold text-slate-500 dark:text-zinc-400">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-t border-slate-100 dark:border-white/5">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-2.5 py-1.5 text-slate-800 dark:text-zinc-200">
                            {formatCell(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        if (block.type === "cards") {
          const single = block.items.length === 1;
          return (
            <div key={idx} className={cn(single ? "grid grid-cols-1" : "grid grid-cols-2 gap-2")}>
              {block.items.map((card, cIdx) => (
                <div
                  key={cIdx}
                  className={cn(
                    glassInsetClass,
                    "rounded-xl border border-[#0F766E]/20 bg-gradient-to-br from-[#0F766E]/8 to-transparent p-3 dark:border-teal-400/20 dark:from-teal-400/10",
                  )}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#0F766E] dark:text-teal-300">
                    {single ? "Student profile" : card.title}
                  </div>
                  {single ? (
                    <div className="mt-1 text-base font-semibold text-slate-900 dark:text-zinc-50">
                      {card.title}
                    </div>
                  ) : null}
                  {!single && card.value ? (
                    <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-zinc-50">
                      {card.value}
                    </div>
                  ) : null}
                  {card.subtitle ? (
                    <div className="mt-0.5 text-xs text-slate-600 dark:text-zinc-400">{card.subtitle}</div>
                  ) : null}
                  {single && card.value ? (
                    <div className="mt-1.5 text-sm font-medium text-slate-800 dark:text-zinc-200">
                      {card.value}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          );
        }

        if (block.type === "chart") {
          const data = block.labels.map((label, i) => ({
            name: label,
            value: Number(block.values[i] ?? 0),
          }));
          return (
            <div
              key={idx}
              className={cn(glassInsetClass, "rounded-xl border border-white/60 p-2 dark:border-white/10")}
            >
              {block.title ? (
                <div className="mb-1 px-1 text-xs font-semibold text-slate-700 dark:text-zinc-200">
                  {block.title}
                </div>
              ) : null}
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {block.chartType === "pie" ? (
                    <PieChart>
                      <Pie data={data} dataKey="value" nameKey="name" outerRadius={60} innerRadius={28}>
                        {data.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <BarChart data={data}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} width={36} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          );
        }

        if (block.type === "buttons") {
          return (
            <div key={idx} className="flex flex-wrap gap-1.5">
              {block.items.map((btn, bIdx) => (
                <button
                  key={bIdx}
                  type="button"
                  onClick={() => {
                    if (btn.action === "navigate" && btn.to) {
                      onNavigate({ to: btn.to, search: btn.search, label: btn.label });
                    }
                  }}
                  className="rounded-xl bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d6a63] dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          );
        }

        return null;
      })}

      {(navigations ?? []).length > 0 && !items.some((b) => b.type === "buttons") ? (
        <div className="flex flex-wrap gap-1.5">
          {navigations!.map((nav, i) => (
            <button
              key={`${nav.to}-${i}`}
              type="button"
              onClick={() => onNavigate(nav)}
              className="rounded-xl bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white shadow-sm"
            >
              {nav.label || "View"}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
