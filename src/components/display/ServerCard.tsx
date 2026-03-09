import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface ServerCardProps {
  server: DisplayServer;
}

export function ServerCard({ server }: ServerCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isOnline = server.status === ServerStatus.ONLINE;
  const load = server.load;

  const cpuPercent = load?.cpu ?? 0;
  const ramPercent = load ? calcPercent(load.ram, load.ram_total) : 0;
  const diskPercent = load ? calcPercent(load.disk, load.disk_total) : 0;

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        !isOnline && "opacity-60",
      )}
      onClick={() => navigate(`/server/${server.uuid}`)}
    >
      <CardContent className="space-y-3">
        {/* 顶部：旗帜 + 名称 + 状态 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="shrink-0 cursor-default">
                  <FlagIcon region={server.region} size="md" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {server.region ?? t("display.server.unknownRegion")}
              </TooltipContent>
            </Tooltip>
            <span className="font-semibold truncate">{server.name}</span>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0",
              isOnline ? "bg-green-100" : "bg-gray-100","dark:bg-gray-700 dark:text-gray-300"
            )}
          >
            <span
              className={cn(
                "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                isOnline ? "bg-emerald-400" : "bg-muted-foreground",
              )}
            />
            {isOnline
              ? t("display.server.online")
              : t("display.server.offline")}
          </Badge>
        </div>

        {/* OS 信息 */}
        {server.os && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <OsIcon os={server.os} className="h-3.5 w-3.5" />
            <span className="truncate">{server.os}</span>
          </div>
        )}

        {/* 资源用量 */}
        {isOnline && load ? (
          <div className="space-y-2.5">
            <UsageRow
              label="CPU"
              percent={cpuPercent}
              detail={`${cpuPercent.toFixed(1)}%`}
            />
            <UsageRow
              label={t("display.server.ram")}
              percent={ramPercent}
              detail={`${formatBytes(load.ram)} / ${formatBytes(load.ram_total)}`}
            />
            <UsageRow
              label={t("display.server.disk")}
              percent={diskPercent}
              detail={`${formatBytes(load.disk)} / ${formatBytes(load.disk_total)}`}
            />
          </div>
        ) : (
          <div className="h-21 flex items-center justify-center text-xs text-muted-foreground">
            {isOnline
              ? t("display.server.connecting")
              : t("display.server.offlineHint")}
          </div>
        )}

        {/* 网络速度 */}
        {isOnline && load && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
            <div className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-emerald-500" />
              <span>{formatSpeed(load.net_out)}</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3 text-blue-500" />
              <span>{formatSpeed(load.net_in)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 使用量行 ──────────────────────────────────────────────────────────────────

function UsageRow({
  label,
  percent,
  detail,
}: {
  label: string;
  percent: number;
  detail: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{detail}</span>
      </div>
      <Progress
        value={percent}
        className="h-1.5"
        indicatorClassName={getUsageColor(percent)}
      />
    </div>
  );
}
