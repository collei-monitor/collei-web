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
  Activity,
  Server,
  Radio,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OsIcon } from "@/components/OsIcon";
import { FlagIcon } from "@/components/FlagIcon";
import { cn } from "@/lib/utils";
import { formatBytes, formatSpeed, calcPercent } from "@/lib/display-utils";
import { ServerStatus } from "@/types/server";
import type { DisplayServer } from "@/types/server";

interface ServerInfoCardProps {
  server: DisplayServer;
}

// ── 辅助：格式化最后上报时间 ───────────────────────────────────────────────────

function formatLastOnline(lastOnline: number | null): string {
  if (!lastOnline) return "-";
  const date = new Date(lastOnline * 1000);
  return date.toLocaleString();
}

// ── 辅助：格式化开机时间 ─────────────────────────────────────────────────────

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

// ── 组件 ──────────────────────────────────────────────────────────────────────

export function ServerInfoCard({ server }: ServerInfoCardProps) {
  const { t } = useTranslation();
  const isOnline = server.status === ServerStatus.ONLINE;
  const load = server.load;

  return (
    <Card className="overflow-hidden">
      {/* 1. 头部区域：名称 + 状态 */}
      <div className="px-5 bg-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <FlagIcon region={server.region} size="lg" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{server.name}</h2>
            {server.os && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <OsIcon os={server.os} className="h-4 w-4" />
                <span className="truncate">{server.os}</span>
              </div>
            )}
          </div>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            "shrink-0 px-2.5 py-1 text-sm",
            isOnline
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
          )}
        >
          <span
            className={cn(
              "mr-2 inline-block h-2 w-2 rounded-full animate-pulse",
              isOnline ? "bg-emerald-500" : "bg-gray-400",
            )}
          />
          {isOnline ? t("display.server.online") : t("display.server.offline")}
        </Badge>
      </div>

      <CardContent className="p-5 space-y-4 border-t pb-0">
        {/* 2. 静态系统规格 */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 text-sm">
          {server.cpu_name && (
            <InfoItem
              icon={<Cpu className="h-4 w-4" />}
              label="CPU"
              value={`${server.cpu_name}${server.cpu_cores ? ` (${server.cpu_cores}C)` : ""}`}
              className="sm:col-span-1"
            />
          )}
          {server.arch && (
            <InfoItem
              icon={<Activity className="h-4 w-4" />}
              label={t("detail.info.arch")}
              value={server.arch}
            />
          )}
          {server.virtualization && (
            <InfoItem
              icon={<Server className="h-4 w-4" />}
              label={t("detail.info.virtualization")}
              value={server.virtualization}
            />
          )}
          {server.status == 0 && (
            <InfoItem
              icon={<Radio className="h-4 w-4" />}
              label={t("detail.info.lastOnline")}
              value={formatLastOnline(server.last_online)}
            />
          )}
        </div>

        {isOnline && load ? (
          <>
            {/* 3. 核心资源使用率 */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 text-sm p-4 rounded-xl bg-muted/40 border border-muted">
              <InfoItem
                icon={<MemoryStick className="h-4 w-4 text-purple-500" />}
                label={t("display.server.ram")}
                value={`${formatBytes(load.ram)} / ${formatBytes(load.ram_total)}`}
                subValue={`${calcPercent(load.ram, load.ram_total).toFixed(1)}%`}
              />
              <InfoItem
                icon={<MemoryStick className="h-4 w-4 text-purple-400" />}
                label="Swap"
                value={`${formatBytes(load.swap)} / ${formatBytes(load.swap_total)}`}
                subValue={`${calcPercent(load.swap, load.swap_total).toFixed(1)}%`}
              />
              <InfoItem
                icon={<HardDrive className="h-4 w-4 text-amber-500" />}
                label={t("display.server.disk")}
                value={`${formatBytes(load.disk)} / ${formatBytes(load.disk_total)}`}
                subValue={`${calcPercent(load.disk, load.disk_total).toFixed(1)}%`}
              />
            </div>

            {/* 4. 网络流量与连接状态*/}
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-4 text-sm">
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
              {server.total_flow_out != null && (
                <InfoItem
                  icon={<ArrowUp className="h-4 w-4 text-emerald-400/70" />}
                  label={t("detail.info.totalUpload")}
                  value={formatBytes(server.total_flow_out)}
                />
              )}
              {server.total_flow_in != null && (
                <InfoItem
                  icon={<ArrowDown className="h-4 w-4 text-blue-400/70" />}
                  label={t("detail.info.totalDownload")}
                  value={formatBytes(server.total_flow_in)}
                />
              )}
              <InfoItem
                icon={<Clock className="h-4 w-4" />}
                label={t("detail.info.uptime")}
                value={formatUptime(server.boot_time, t)}
              />
              <InfoItem
                icon={<Radio className="h-4 w-4" />}
                label={t("detail.info.lastOnline")}
                value={formatLastOnline(server.last_online)}
              />
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            {isOnline
              ? t("display.server.connecting")
              : t("display.server.offlineHint")}
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
  subValue,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <span className="mt-0.5 shrink-0 bg-background p-1.5 rounded-md border shadow-sm">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground mb-0.5">
          {label}{" "}
          {subValue && (
            <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded whitespace-nowrap mt-0.5">
              {subValue}
            </span>
          )}
        </div>
        <div className="font-medium text-sm flex flex-wrap items-center gap-2 wrap-break-word leading-snug">
          <span>{value}</span>
        </div>
      </div>
    </div>
  );
}
