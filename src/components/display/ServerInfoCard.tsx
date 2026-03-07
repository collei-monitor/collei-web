/**
 * 服务器详情信息卡片
 * 展示服务器基本信息和当前实时状态
 */

import { useTranslation } from "react-i18next";
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Clock,
  ArrowUp,
  ArrowDown,
  Network,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OsIcon } from "@/components/display/OsIcon";
import { FlagIcon } from "@/components/display/FlagIcon";
import { cn } from "@/lib/utils";
import {
  formatBytes,
  formatSpeed,
  calcPercent,
  getUsageColor,
} from "@/lib/display-utils";
import { ServerStatus } from "@/types/server";
import type { DisplayServer } from "@/types/server";

interface ServerInfoCardProps {
  server: DisplayServer;
}

// ── 辅助：格式化开机时间 ─────────────────────────────────────────────────────

function formatUptime(bootTime: number | null): string {
  if (!bootTime) return "-";
  const seconds = Math.floor(Date.now() / 1000) - bootTime;
  if (seconds < 60) return `${seconds}s`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ── 组件 ──────────────────────────────────────────────────────────────────────

export function ServerInfoCard({ server }: ServerInfoCardProps) {
  const { t } = useTranslation();
  const isOnline = server.status === ServerStatus.ONLINE;
  const load = server.load;

  const cpuPercent = load?.cpu ?? 0;
  const ramPercent = load ? calcPercent(load.ram, load.ram_total) : 0;
  const swapPercent = load ? calcPercent(load.swap, load.swap_total) : 0;
  const diskPercent = load ? calcPercent(load.disk, load.disk_total) : 0;

  return (
    <Card>
      <CardContent className="space-y-5">
        {/* 头部：名称 + 状态 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <FlagIcon region={server.region} size="lg" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{server.name}</h2>
              {server.os && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <OsIcon os={server.os} className="h-4 w-4" />
                  <span className="truncate">{server.os}</span>
                </div>
              )}
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0",
              isOnline ? "bg-green-100" : "bg-gray-100",
            )}
          >
            <span
              className={cn(
                "mr-1.5 inline-block h-2 w-2 rounded-full",
                isOnline ? "bg-emerald-400" : "bg-muted-foreground",
              )}
            />
            {isOnline
              ? t("display.server.online")
              : t("display.server.offline")}
          </Badge>
        </div>

        {/* 基本信息网格 */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-sm">
          {server.cpu_name && (
            <InfoItem
              icon={<Cpu className="h-4 w-4" />}
              label="CPU"
              value={`${server.cpu_name}${server.cpu_cores ? ` (${server.cpu_cores}C)` : ""}`}
              className="col-span-2"
            />
          )}
          {server.arch && (
            <InfoItem
              icon={<Activity className="h-4 w-4" />}
              label={t("detail.info.arch")}
              value={server.arch}
            />
          )}
          <InfoItem
            icon={<Clock className="h-4 w-4" />}
            label={t("detail.info.uptime")}
            value={isOnline ? formatUptime(server.boot_time) : "-"}
          />
        </div>

        {/* 资源使用情况 */}
        {isOnline && load ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <UsageBlock
              icon={<Cpu className="h-4 w-4" />}
              label="CPU"
              percent={cpuPercent}
              detail={`${cpuPercent.toFixed(1)}%`}
            />
            <UsageBlock
              icon={<MemoryStick className="h-4 w-4" />}
              label={t("display.server.ram")}
              percent={ramPercent}
              detail={`${formatBytes(load.ram)} / ${formatBytes(load.ram_total)}`}
            />
            <UsageBlock
              icon={<MemoryStick className="h-4 w-4" />}
              label="Swap"
              percent={swapPercent}
              detail={`${formatBytes(load.swap)} / ${formatBytes(load.swap_total)}`}
            />
            <UsageBlock
              icon={<HardDrive className="h-4 w-4" />}
              label={t("display.server.disk")}
              percent={diskPercent}
              detail={`${formatBytes(load.disk)} / ${formatBytes(load.disk_total)}`}
            />
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {isOnline
              ? t("display.server.connecting")
              : t("display.server.offlineHint")}
          </div>
        )}

        {/* 网络 + 连接 */}
        {isOnline && load && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-sm border-t pt-4">
            <InfoItem
              icon={<ArrowUp className="h-4 w-4 text-emerald-500" />}
              label={t("detail.info.upload")}
              value={formatSpeed(load.net_out)}
            />
            <InfoItem
              icon={<ArrowDown className="h-4 w-4 text-blue-500" />}
              label={t("detail.info.download")}
              value={formatSpeed(load.net_in)}
            />
            <InfoItem
              icon={<Network className="h-4 w-4" />}
              label={t("detail.info.connections")}
              value={`TCP ${load.tcp} / UDP ${load.udp}`}
            />
            <InfoItem
              icon={<Activity className="h-4 w-4" />}
              label={t("detail.info.process")}
              value={String(load.process)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 子组件 ────────────────────────────────────────────────────────────────────

function InfoItem({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function UsageBlock({
  icon,
  label,
  percent,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  percent: number;
  detail: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-mono tabular-nums text-xs">{detail}</span>
      </div>
      <Progress
        value={percent}
        className="h-2"
        indicatorClassName={getUsageColor(percent)}
      />
    </div>
  );
}
