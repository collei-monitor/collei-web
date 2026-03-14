/**
 * 公开页面 — 网络探测延迟图表
 * 支持时间范围切换、指标切换、多目标多色线条
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useServerNetworkProbes } from "@/services/network";
import type { NetworkProbeRecord } from "@/types/network";

// ── 颜色调色板 ────────────────────────────────────────────────────────────────

const PALETTE = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#a855f7", // purple
];

// ── 时间范围定义 ──────────────────────────────────────────────────────────────

type TimeRange = "realtime" | "1h" | "6h" | "12h" | "24h" | "custom";

const RANGE_SECONDS: Record<Exclude<TimeRange, "custom">, number> = {
  realtime: 300,
  "1h": 3600,
  "6h": 21600,
  "12h": 43200,
  "24h": 86400,
};

// ── 指标选项 ──────────────────────────────────────────────────────────────────

type MetricKey = "median_latency" | "max_latency" | "min_latency";

// ── Tooltip 类型 ──────────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  color: string;
  dataKey: string;
  name: string;
  value: number | string;
  payload: Record<string, number | null>;
}

// ── 时间格式化 ────────────────────────────────────────────────────────────────

function formatTime(timestamp: number, range: TimeRange): string {
  const date = new Date(timestamp * 1000);
  if (range === "realtime" || range === "1h") {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return date.toLocaleTimeString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── 自定义 Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  range,
//   t,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  range: TimeRange;
  t: (key: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {formatTime(Number(label), range)}
      </p>
      <div className="flex flex-col gap-1.5">
        {payload.map((entry) => {
          const loss = entry.payload?.[`${entry.dataKey}__loss`];
          return (
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
              <div className="flex items-center gap-2">
                <span className="font-medium font-mono">
                  {entry.value != null
                    ? `${Number(entry.value).toFixed(2)} ms`
                    : "—"}
                </span>
                {loss != null && (
                  <span
                    className={`text-xs font-mono ${loss > 0 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {/* {t("detail.network.card.packetLoss")}  */}
                    {loss.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 数据转换 — 对齐时间轴，无数据处保留 null ──────────────────────────────────

function buildChartData(probes: NetworkProbeRecord[], metric: MetricKey) {
  const timeMap = new Map<number, Record<string, number | null>>();
  const targetNameSet = new Set<string>();

  for (const probe of probes) {
    const key = probe.target.name;
    targetNameSet.add(key);
    for (const record of probe.records) {
      let entry = timeMap.get(record.time);
      if (!entry) {
        entry = { time: record.time };
        timeMap.set(record.time, entry);
      }
      entry[key] = record[metric];
      // 附加丢包率供 tooltip 读取
      entry[`${key}__loss`] = record.packet_loss;
    }
  }

  // 确保每行都有全部 target key（未填充的保持 null → recharts 视作 gap）
  const names = Array.from(targetNameSet);
  const rows = Array.from(timeMap.values());
  for (const row of rows) {
    for (const name of names) {
      if (!(name in row)) {
        row[name] = null;
      }
    }
  }

  return rows.sort((a, b) => (a.time as number) - (b.time as number));
}

// ── 时间选择辅助 ──────────────────────────────────────────────────────────────

function toTimeString(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function combineDateAndTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

interface NetworkProbeChartProps {
  uuid: string;
}

export function NetworkProbeChart({ uuid }: NetworkProbeChartProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<TimeRange>("realtime");
  const [metric, setMetric] = useState<MetricKey>("median_latency");
  const [areaMode, setAreaMode] = useState(false);

  // 自定义日期时间范围
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [customStartTime, setCustomStartTime] = useState("00:00");
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
    undefined,
  );
  const [customEndTime, setCustomEndTime] = useState("23:59");

  const handleRangeChange = (v: string) => {
    const newRange = v as TimeRange;
    setRange(newRange);
    if (newRange === "custom" && !customStartDate) {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400_000);
      setCustomStartDate(yesterday);
      setCustomStartTime(toTimeString(yesterday));
      setCustomEndDate(now);
      setCustomEndTime(toTimeString(now));
    }
  };

  // 根据时间范围计算参数
  const params = useMemo(() => {
    if (range === "custom" && customStartDate && customEndDate) {
      const start = combineDateAndTime(customStartDate, customStartTime);
      const end = combineDateAndTime(customEndDate, customEndTime);
      return {
        start_time: Math.floor(start.getTime() / 1000),
        end_time: Math.floor(end.getTime() / 1000),
      };
    }
    if (range !== "custom") {
      return { range: `${RANGE_SECONDS[range]}` };
    }
    return {};
  }, [range, customStartDate, customStartTime, customEndDate, customEndTime]);

  const { data: probes, isLoading } = useServerNetworkProbes(uuid, params, {
    refetchInterval: range === "realtime" ? 60_000 : false,
  });

  const chartData = useMemo(
    () => (probes ? buildChartData(probes, metric) : []),
    [probes, metric],
  );

  const targetNames = useMemo(
    () => (probes ?? []).map((p) => p.target.name),
    [probes],
  );

  return (
    <div className="space-y-4">
      {/* 控制栏 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* 时间范围 */}
          <Tabs value={range} onValueChange={handleRangeChange}>
            <TabsList>
              <TabsTrigger value="realtime">
                {t("detail.network.range.realtime")}
              </TabsTrigger>
              <TabsTrigger value="1h">
                {t("detail.network.range.1h")}
              </TabsTrigger>
              <TabsTrigger value="6h">
                {t("detail.network.range.6h")}
              </TabsTrigger>
              <TabsTrigger value="12h">
                {t("detail.network.range.12h")}
              </TabsTrigger>
              <TabsTrigger value="24h">
                {t("detail.network.range.24h")}
              </TabsTrigger>
              <TabsTrigger value="custom">
                {t("detail.network.range.custom")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 指标选择器 */}
          <Select
            value={metric}
            onValueChange={(v) => setMetric(v as MetricKey)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="median_latency">
                {t("detail.network.metrics.medianLatency")}
              </SelectItem>
              <SelectItem value="max_latency">
                {t("detail.network.metrics.maxLatency")}
              </SelectItem>
              <SelectItem value="min_latency">
                {t("detail.network.metrics.minLatency")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 自定义日期选择器 */}
        {range === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            {/* 开始日期 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-normal"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customStartDate
                    ? format(customStartDate, "yyyy-MM-dd")
                    : t("detail.network.customRange.startDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              className="w-28 h-8 text-sm"
              value={customStartTime}
              onChange={(e) => setCustomStartTime(e.target.value)}
            />

            <span className="text-muted-foreground text-sm">—</span>

            {/* 结束日期 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-normal"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customEndDate
                    ? format(customEndDate, "yyyy-MM-dd")
                    : t("detail.network.customRange.endDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              className="w-28 h-8 text-sm"
              value={customEndTime}
              onChange={(e) => setCustomEndTime(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 图表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {t("detail.network.chartTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              {t("detail.network.empty")}
            </div>
          ) : (
            <>
              {areaMode ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                  >
                    <defs>
                      {targetNames.map((name, i) => (
                        <linearGradient
                          key={name}
                          id={`probe-gradient-${i}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={PALETTE[i % PALETTE.length]}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={PALETTE[i % PALETTE.length]}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(v) => formatTime(v, range)}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={40}
                    />
                    <YAxis
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={50}
                      tickFormatter={(v: number) => `${v} ms`}
                    />
                    <Tooltip
                      content={<ChartTooltip range={range} t={t} />}
                      cursor={{
                        stroke: "hsl(var(--muted-foreground))",
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                        opacity: 0.5,
                      }}
                    />
                    {targetNames.map((name, i) => (
                      <Area
                        key={name}
                        type="natural"
                        dataKey={name}
                        name={name}
                        stroke={PALETTE[i % PALETTE.length]}
                        strokeWidth={1.5}
                        fill={`url(#probe-gradient-${i})`}
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
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(v) => formatTime(v, range)}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={40}
                    />
                    <YAxis
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={50}
                      tickFormatter={(v: number) => `${v} ms`}
                    />
                    <Tooltip
                      content={<ChartTooltip range={range} t={t} />}
                      cursor={{
                        stroke: "hsl(var(--muted-foreground))",
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                        opacity: 0.5,
                      }}
                    />
                    {targetNames.map((name, i) => (
                      <Line
                        key={name}
                        type="linear"
                        dataKey={name}
                        name={name}
                        stroke={PALETTE[i % PALETTE.length]}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                        connectNulls={false}
                      />
                    ))}
                    <Legend
                      verticalAlign="bottom"
                      height={28}
                      wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {/* 面积图切换 */}
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  id="area-mode"
                  checked={areaMode}
                  onCheckedChange={setAreaMode}
                />
                <Label
                  htmlFor="area-mode"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  {t("detail.network.areaMode")}
                </Label>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
