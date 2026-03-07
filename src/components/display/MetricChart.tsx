/**
 * 通用监控图表组件
 * 基于 recharts，支持多 series 展示
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── 类型 ──────────────────────────────────────────────────────────────────────
export interface ChartSeries {
  dataKey: string;
  label: string;
  color: string;
}

interface MetricChartProps {
  title: string;
  data: Record<string, unknown>[];
  series: ChartSeries[];
  yFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => string;
  yDomain?: [number | "auto", number | "auto"];
}

export interface TooltipPayloadItem {
  color: string;
  dataKey: string;
  name: string;
  value: number | string;
  payload: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  tooltipFormatter?: (value: number, name: string) => string;
}

// ── 时间格式化 ────────────────────────────────────────────────────────────────

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── 自定义 Tooltip 组件 ────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
  tooltipFormatter,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md outline-none">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {formatTime(Number(label))}
        </p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry) => (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-6 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-medium font-mono">
                {tooltipFormatter
                  ? tooltipFormatter(Number(entry.value), String(entry.name))
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// ── 主组件 ──────────────────────────────────────────────────────────────────────

export function MetricChart({
  title,
  data,
  series,
  yFormatter,
  tooltipFormatter,
  yDomain,
}: MetricChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
            等待数据…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={233}>
            <AreaChart
              data={data}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                {series.map((s) => (
                  <linearGradient
                    key={s.dataKey}
                    id={`gradient-${s.dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={50}
                tickFormatter={yFormatter}
                domain={yDomain}
              />
              <Tooltip
                content={<CustomTooltip tooltipFormatter={tooltipFormatter} />}
                cursor={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                  opacity: 0.5,
                }}
              />
              {series.map((s) => (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={1.5}
                  fill={`url(#gradient-${s.dataKey})`}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
              <Legend
                verticalAlign="bottom"
                height={28}
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
