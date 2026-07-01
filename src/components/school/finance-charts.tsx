import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { OrganicCard } from "@/components/ui/organic-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CornerSide } from "@/lib/utils";

const CHART_COLORS = ["#000000", "#C7F33C", "#E1F2AE", "#9CA3AF", "#525252"];

type Segment = { label: string; value: number };

function withColors(segments: Segment[]) {
  return segments.map((segment, index) => ({
    ...segment,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

export function FinanceDonutCard({
  title,
  segments,
  cornerSide = "tr",
}: {
  title: string;
  segments: Segment[];
  cornerSide?: CornerSide;
}) {
  const colored = withColors(segments);
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
      className="flex h-full min-h-0 flex-col p-4 sm:min-h-[300px] sm:p-6"
    >
      <div className="text-[15px] font-semibold leading-tight text-black sm:text-title">{title}</div>
      <div className="mt-3 flex flex-1 flex-col gap-3 sm:mt-4 sm:gap-4">
        <div className="relative mx-auto w-full max-w-[200px] shrink-0 sm:max-w-[240px]">
          <ChartContainer config={chartConfig} className="aspect-square w-full min-h-[140px] max-h-[200px] sm:max-h-[240px]">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      `₹ ${Number(value).toLocaleString("en-IN")}`,
                      String(name),
                    ]}
                  />
                }
              />
              <Pie
                data={colored}
                dataKey="value"
                nameKey="label"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
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
              <div className="font-mono text-[13px] font-semibold text-black sm:text-lg">
                ₹ {total.toLocaleString("en-IN")}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-black/45">Total</div>
            </div>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:gap-2">
          {colored.map((segment) => {
            const pct = total > 0 ? Math.round((segment.value / total) * 100) : 0;
            return (
              <div key={segment.label} className="min-w-0 rounded-xl bg-[#F4F4F5] px-2 py-1.5 sm:rounded-2xl sm:px-2.5 sm:py-2">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-black/70">{segment.label}</span>
                  <span className="font-mono text-[9px] text-black/45 sm:text-[10px]">{pct}%</span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[10px] font-semibold text-black sm:text-[11px]">
                  ₹ {segment.value.toLocaleString("en-IN")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OrganicCard>
  );
}

export function FinanceBarCard({
  title,
  segments,
  cornerSide = "bl",
  fill = "#111111",
}: {
  title: string;
  segments: Segment[];
  cornerSide?: CornerSide;
  fill?: string;
}) {
  const chartConfig = {
    value: { label: title, color: fill },
  } satisfies ChartConfig;

  return (
    <OrganicCard
      tone="white"
      cornerSide={cornerSide}
      padded
      className="flex h-full min-h-0 flex-col p-4 sm:min-h-[300px] sm:p-6"
    >
      <div className="text-[15px] font-semibold leading-tight text-black sm:text-title">{title}</div>
      <ChartContainer config={chartConfig} className="mt-3 aspect-auto h-[180px] w-full sm:mt-4 sm:h-[220px]">
        <BarChart data={segments} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="#E5E5E5" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={72}
            tick={{ fontSize: 9, fill: "#525252" }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [`₹ ${Number(value).toLocaleString("en-IN")}`, title]}
              />
            }
          />
          <Bar dataKey="value" fill={fill} radius={[0, 6, 6, 0]} maxBarSize={16} />
        </BarChart>
      </ChartContainer>
    </OrganicCard>
  );
}
