import { Inbox } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

import { OrganicCard } from "@/components/ui/organic-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn, type CornerSide } from "@/lib/utils";

const INCOME_COLORS = ["#0F766E", "#14B8A6", "#0EA5E9", "#6366F1", "#F59E0B", "#8B5CF6", "#64748B"];
const OUTFLOW_COLORS = ["#E11D48", "#F97316", "#F43F5E", "#FB7185", "#F59E0B", "#94A3B8", "#64748B"];

type Segment = { label: string; value: number };
type ChartPalette = "income" | "outflow";

function withColors(segments: Segment[], palette: ChartPalette = "income") {
  const colors = palette === "outflow" ? OUTFLOW_COLORS : INCOME_COLORS;
  return segments.map((segment, index) => ({
    ...segment,
    color: colors[index % colors.length],
  }));
}

function formatInr(value: number) {
  return `₹ ${value.toLocaleString("en-IN")}`;
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[180px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-gradient-to-b from-[#FAFAFA] to-white px-4 py-8 text-center dark:border-white/10 dark:from-zinc-900/50 dark:to-zinc-950/20 sm:min-h-[220px]">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-black/35 shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:text-zinc-500 dark:ring-white/10">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="mt-3 text-[13px] font-semibold text-black/70 dark:text-zinc-200">No data yet</p>
      <p className="mt-1 max-w-[240px] text-[12px] leading-relaxed text-black/45 dark:text-zinc-500">
        {message}
      </p>
    </div>
  );
}

export function FinanceDonutCard({
  title,
  segments,
  cornerSide = "tr",
  palette = "income",
  emptyHint = "Nothing recorded for this period",
}: {
  title: string;
  segments: Segment[];
  cornerSide?: CornerSide;
  palette?: ChartPalette;
  emptyHint?: string;
}) {
  const colored = withColors(segments.filter((segment) => segment.value > 0), palette);
  const total = colored.reduce((sum, segment) => sum + segment.value, 0);
  const chartConfig = colored.reduce<ChartConfig>((acc, segment) => {
    acc[segment.label] = { label: segment.label, color: segment.color };
    return acc;
  }, {});

  return (
    <OrganicCard
      tone="white"
      cornerSide={cornerSide}
      padded
      className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5 lg:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight text-black dark:text-zinc-50 sm:text-[16px]">
            {title}
          </div>
          <p className="mt-0.5 text-[11px] text-black/45 dark:text-zinc-500">
            {colored.length === 0
              ? "Waiting for entries"
              : `${colored.length} categor${colored.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold",
            palette === "outflow"
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              : "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
          )}
        >
          {formatInr(total)}
        </div>
      </div>

      {colored.length === 0 ? (
        <div className="mt-4 flex flex-1">
          <ChartEmptyState message={emptyHint} />
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
          <div className="relative mx-auto w-full max-w-[200px] shrink-0 sm:max-w-[220px] lg:mx-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square w-full min-h-[160px] max-h-[220px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [formatInr(Number(value)), String(name)]}
                    />
                  }
                />
                <Pie
                  data={colored}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={colored.length > 1 ? 3 : 0}
                  strokeWidth={0}
                >
                  {colored.map((segment) => (
                    <Cell key={segment.label} fill={segment.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-mono text-[15px] font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-[17px]">
                  {formatInr(total)}
                </div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/40">
                  Total
                </div>
              </div>
            </div>
          </div>

          <ul className="flex min-w-0 flex-1 flex-col gap-2">
            {colored.map((segment) => {
              const pct = total > 0 ? Math.round((segment.value / total) * 100) : 0;
              return (
                <li
                  key={segment.label}
                  className="rounded-xl bg-[#F8FAFC] px-3 py-2 dark:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-black/75 dark:text-zinc-300">
                      {segment.label}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] font-semibold text-black/45">
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: segment.color }}
                    />
                  </div>
                  <div className="mt-1 font-mono text-[11px] font-semibold text-black dark:text-zinc-100">
                    {formatInr(segment.value)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </OrganicCard>
  );
}

export function FinanceBarCard({
  title,
  segments,
  cornerSide = "bl",
  fill,
  palette = "income",
  emptyHint = "Nothing recorded for this period",
  className,
}: {
  title: string;
  segments: Segment[];
  cornerSide?: CornerSide;
  fill?: string;
  palette?: ChartPalette;
  emptyHint?: string;
  className?: string;
}) {
  const active = segments.filter((segment) => segment.value > 0);
  const barFill = fill ?? (palette === "outflow" ? OUTFLOW_COLORS[0] : INCOME_COLORS[0]);
  const chartConfig = {
    value: { label: title, color: barFill },
  } satisfies ChartConfig;
  const chartHeight = Math.max(200, Math.min(360, active.length * 42 + 24));

  return (
    <OrganicCard
      tone="white"
      cornerSide={cornerSide}
      padded
      className={cn("flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5 lg:p-6", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight text-black dark:text-zinc-50 sm:text-[16px]">
            {title}
          </div>
          <p className="mt-0.5 text-[11px] text-black/45 dark:text-zinc-500">
            {active.length === 0
              ? "Waiting for entries"
              : `Ranked by amount · ${active.length} categor${active.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="mt-4 flex flex-1">
          <ChartEmptyState message={emptyHint} />
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto w-full"
          style={{ height: chartHeight }}
        >
          <BarChart
            data={active}
            layout="vertical"
            margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="4 4"
              stroke="#E5E5E5"
              className="dark:stroke-white/15"
            />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={88}
              tick={{ fontSize: 11, fill: "#64748B" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [formatInr(Number(value)), title]}
                />
              }
            />
            <Bar dataKey="value" fill={barFill} radius={[0, 8, 8, 0]} maxBarSize={18}>
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: number) => formatInr(value)}
                className="fill-slate-500 text-[10px]"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </OrganicCard>
  );
}
