import { memo, useCallback, useMemo, useState, startTransition } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Cpu,
  HardDrive,
  MemoryStick,
  Clock,
  Radio,
  Activity,
  Server,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { OsIcon } from "@/components/OsIcon";
import { FlagIcon } from "@/components/FlagIcon";
import { cn } from "@/lib/utils";
import {
  formatBytes,
  formatSpeed,
  calcPercent,
  getUsageColor,
  getUsageTextColor,
} from "@/lib/display-utils";
import { ServerStatus } from "@/types/server";
import type { DisplayServer } from "@/types/server";
import { Badge } from "@/components/ui/badge";
import { useServerNetworkProbes } from "@/services/network";
import type { NetworkProbeRecord } from "@/types/network";

// ── 颜色调色板（与 NetworkProbeChart 一致） ──────────────────────────────────

const PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
];

interface ServerTableProps {
  servers: DisplayServer[];
}

export function ServerTable({ servers }: ServerTableProps) {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((uuid: string) => {
    startTransition(() => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(uuid)) next.delete(uuid);
        else next.add(uuid);
        return next;
      });
    });
  }, []);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("display.table.os")}</TableHead>
            <TableHead className="text-center w-20">
              {t("common.status")}
            </TableHead>
            <TableHead className="text-center">CPU</TableHead>
            <TableHead className="text-center">
              {t("display.server.ram")}
            </TableHead>
            <TableHead className="text-center">
              {t("display.server.disk")}
            </TableHead>
            <TableHead className="text-center">
              {t("display.table.networkUpload")}
            </TableHead>
            <TableHead className="text-center">
              {t("display.table.networkDownload")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server) => (
            <MemoServerRow
              key={server.uuid}
              server={server}
              expanded={expandedIds.has(server.uuid)}
              onToggle={toggleExpand}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const MemoServerRow = memo(ServerRow);

function ServerRow({
  server,
  expanded,
  onToggle,
}: {
  server: DisplayServer;
  expanded: boolean;
  onToggle: (uuid: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isOnline = server.status === ServerStatus.ONLINE;
  const load = server.load;

  const cpuPercent = load?.cpu ?? 0;
  const ramPercent = load ? calcPercent(load.ram, load.ram_total) : 0;
  const diskPercent = load ? calcPercent(load.disk, load.disk_total) : 0;

  const handleToggle = useCallback(
    () => onToggle(server.uuid),
    [onToggle, server.uuid],
  );

  return (
    <>
      <TableRow
        className={cn(
          "cursor-pointer hover:bg-muted/50",
          !isOnline && "opacity-60",
          expanded && "bg-muted/30",
        )}
        onClick={handleToggle}
      >
        {/* 展开按钮 */}
        <TableCell className="w-8 px-2">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-90",
            )}
          />
        </TableCell>

        {/* 旗帜+名称 */}
        <TableCell className="font-medium align-middle">
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <FlagIcon region={server.region} size="md" className="mr-1" />
              </TooltipTrigger>
              <TooltipContent>
                {server.region ?? t("display.server.unknownRegion")}
              </TooltipContent>
            </Tooltip>
            <a
              className="hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/server/${server.uuid}`);
              }}
            >
              {server.name}
            </a>
          </div>
        </TableCell>

        {/* OS */}
        <TableCell>
          {server.os && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <OsIcon os={server.os} className="h-3.5 w-3.5 shrink-0" />
            </div>
          )}
        </TableCell>

        {/* 状态 */}
        <TableCell className="text-center">
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0",
              isOnline ? "bg-green-100" : "bg-gray-100",
            )}
          >
            {isOnline
              ? t("display.server.online")
              : t("display.server.offline")}
          </Badge>
        </TableCell>

        {/* CPU */}
        <TableCell className="text-center">
          {isOnline && load ? (
            <UsageCell
              percent={cpuPercent}
              label={`${cpuPercent.toFixed(1)}%`}
            />
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* RAM */}
        <TableCell className="text-center">
          {isOnline && load ? (
            <UsageCell
              percent={ramPercent}
              label={`${ramPercent.toFixed(1)}%`}
              tooltip={`${formatBytes(load.ram)} / ${formatBytes(load.ram_total)}`}
            />
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Disk */}
        <TableCell className="text-center">
          {isOnline && load ? (
            <UsageCell
              percent={diskPercent}
              label={`${diskPercent.toFixed(1)}%`}
              tooltip={`${formatBytes(load.disk)} / ${formatBytes(load.disk_total)}`}
            />
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* 网络上传 */}
        <TableCell className="text-center">
          {isOnline && load ? (
            <div className="flex items-center justify-center gap-3 text-xs">
              <span className="flex items-center gap-0.5 text-emerald-500">
                <ArrowUp className="h-3 w-3" />
                {formatSpeed(load.net_out)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* 网络下载 */}
        <TableCell className="text-right">
          {isOnline && load ? (
            <div className="flex items-center justify-center gap-3 text-xs">
              <span className="flex items-center gap-0.5 text-blue-500">
                <ArrowDown className="h-3 w-3" />
                {formatSpeed(load.net_in)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>
      </TableRow>

      {/* 展开行 */}
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={9} className="p-0">
            <ExpandedServerDetail server={server} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── 展开详情区域 ──────────────────────────────────────────────────────────────

function ExpandedServerDetail({ server }: { server: DisplayServer }) {
  const { t } = useTranslation();
  const isOnline = server.status === ServerStatus.ONLINE;
  const load = server.load;

  return (
    <div className="px-6 py-4 bg-muted/20 border-t space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左：服务器信息 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t("display.table.serverInfo")}
          </h4>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 text-sm">
            {server.cpu_name && (
              <InfoItem
                icon={<Cpu className="h-3.5 w-3.5" />}
                label="CPU"
                value={`${server.cpu_name}${server.cpu_cores ? ` (${server.cpu_cores}C)` : ""}`}
              />
            )}
            {server.arch && (
              <InfoItem
                icon={<Activity className="h-3.5 w-3.5" />}
                label={t("detail.info.arch")}
                value={server.arch}
              />
            )}
            {server.virtualization && (
              <InfoItem
                icon={<Server className="h-3.5 w-3.5" />}
                label={t("detail.info.virtualization")}
                value={server.virtualization}
              />
            )}
            {isOnline && load && (
              <>
                <InfoItem
                  icon={<MemoryStick className="h-3.5 w-3.5 text-purple-500" />}
                  label={t("display.server.ram")}
                  value={`${formatBytes(load.ram)} / ${formatBytes(load.ram_total)}`}
                />
                <InfoItem
                  icon={<MemoryStick className="h-3.5 w-3.5 text-purple-400" />}
                  label="Swap"
                  value={`${formatBytes(load.swap)} / ${formatBytes(load.swap_total)}`}
                />
                <InfoItem
                  icon={<HardDrive className="h-3.5 w-3.5 text-amber-500" />}
                  label={t("display.server.disk")}
                  value={`${formatBytes(load.disk)} / ${formatBytes(load.disk_total)}`}
                />
              </>
            )}
            {isOnline && load && (
              <InfoItem
                icon={<Clock className="h-3.5 w-3.5" />}
                label={t("display.table.uptime")}
                value={formatUptime(server.boot_time, t)}
              />
            )}
            {server.total_flow_out != null && (
              <InfoItem
                icon={<ArrowUp className="h-3.5 w-3.5 text-emerald-400/70" />}
                label={t("display.table.totalUpload")}
                value={formatBytes(server.total_flow_out)}
              />
            )}
            {server.total_flow_in != null && (
              <InfoItem
                icon={<ArrowDown className="h-3.5 w-3.5 text-blue-400/70" />}
                label={t("display.table.totalDownload")}
                value={formatBytes(server.total_flow_in)}
              />
            )}
            <InfoItem
              icon={<Radio className="h-3.5 w-3.5" />}
              label={t("display.table.lastOnline")}
              value={formatLastOnline(server.last_online)}
            />
          </div>
        </div>

        {/* 右：网络延迟图表 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t("display.table.networkLatency")}
          </h4>
          <CompactNetworkChart uuid={server.uuid} />
        </div>
      </div>
    </div>
  );
}

// ── 紧凑网络延迟图表（24h） ───────────────────────────────────────────────────

function CompactNetworkChart({ uuid }: { uuid: string }) {
  const { t } = useTranslation();
  const params = useMemo(() => ({ range: "24" }), []);
  const { data: probes, isLoading } = useServerNetworkProbes(uuid, params, {
    refetchInterval: false,
  });

  const chartData = useMemo(
    () => (probes ? buildChartData(probes, "median_latency") : []),
    [probes],
  );

  const targetNames = useMemo(
    () => (probes ?? []).map((p) => p.target.name),
    [probes],
  );

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
        {t("display.table.noProbeData")}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={chartData}
        margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="time"
          tickFormatter={(v) => {
            const d = new Date(v * 1000);
            return d.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
          }}
          fontSize={10}
          tickLine={false}
          axisLine={false}
          minTickGap={40}
        />
        <YAxis
          fontSize={10}
          tickLine={false}
          axisLine={false}
          width={45}
          tickFormatter={(v: number) => `${v}ms`}
        />
        <RechartsTooltip
          content={<CompactChartTooltip />}
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
          height={24}
          wrapperStyle={{ fontSize: 10, paddingTop: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── 紧凑 Tooltip ──────────────────────────────────────────────────────────────

interface CompactTooltipPayloadItem {
  color: string;
  dataKey: string;
  name: string;
  value: number | string;
  payload: Record<string, number | null>;
}

function CompactChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: CompactTooltipPayloadItem[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const date = new Date(Number(label) * 1000);
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {date.toLocaleString(undefined, {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => {
          const loss = entry.payload?.[`${entry.dataKey}__loss`];
          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium font-mono">
                  {entry.value != null
                    ? `${Number(entry.value).toFixed(2)} ms`
                    : "—"}
                </span>
                {loss != null && loss > 0 && (
                  <span className="text-destructive font-mono">
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

// ── 图表数据构建 ──────────────────────────────────────────────────────────────

function buildChartData(
  probes: NetworkProbeRecord[],
  metric: "median_latency" | "max_latency" | "min_latency",
) {
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
      entry[`${key}__loss`] = record.packet_loss;
    }
  }

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

// ── 辅助函数 ──────────────────────────────────────────────────────────────────

function formatLastOnline(lastOnline: number | null): string {
  if (!lastOnline) return "-";
  return new Date(lastOnline * 1000).toLocaleString();
}

function formatUptime(
  bootTime: number | null,
  t: (key: string) => string,
): string {
  if (!bootTime) return "-";
  const seconds = Math.floor(Date.now() / 1000) - bootTime;
  if (seconds < 60) return `${seconds}${t("time.sec")}`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0)
    return `${days}${t("time.day")} ${hours}${t("time.hour")} ${minutes}${t("time.min")}`;
  if (hours > 0) return `${hours}${t("time.hour")} ${minutes}${t("time.min")}`;
  return `${minutes}${t("time.min")}`;
}

// ── 信息项 ────────────────────────────────────────────────────────────────────

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

// ── 使用量单元格 ──────────────────────────────────────────────────────────────

function UsageCell({
  percent,
  label,
  tooltip,
}: {
  percent: number;
  label: string;
  tooltip?: string;
}) {
  const content = (
    <div className="flex flex-col items-center gap-1 min-w-15">
      <span
        className={cn(
          "text-xs font-mono tabular-nums",
          getUsageTextColor(percent),
        )}
      >
        {label}
      </span>
      <Progress
        value={percent}
        className="h-1 w-full max-w-20"
        indicatorClassName={getUsageColor(percent)}
      />
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
