import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp } from "lucide-react";
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
import { OsIcon } from "@/components/display/OsIcon";
import { FlagIcon } from "@/components/display/FlagIcon";
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

interface ServerTableProps {
  servers: DisplayServer[];
}

export function ServerTable({ servers }: ServerTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>{t("display.table.name")}</TableHead>
            <TableHead>
              {t("display.table.os")}
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
            {/* <TableHead className="text-center w-20">
              {t("display.table.status")}
            </TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server) => (
            <ServerRow key={server.uuid} server={server} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ServerRow({ server }: { server: DisplayServer }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isOnline = server.status === ServerStatus.ONLINE;
  const load = server.load;

  const cpuPercent = load?.cpu ?? 0;
  const ramPercent = load ? calcPercent(load.ram, load.ram_total) : 0;
  const diskPercent = load ? calcPercent(load.disk, load.disk_total) : 0;

  return (
    <TableRow
      className={cn("cursor-pointer hover:bg-muted/50", !isOnline && "opacity-60")}
      onClick={() => navigate(`/server/${server.uuid}`)}
    >
      {/* 旗帜 */}
      <TableCell className="text-center pr-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <FlagIcon region={server.region} size="md" />
          </TooltipTrigger>
          <TooltipContent>
            {server.region ?? t("display.server.unknownRegion")}
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* 名称 */}
      <TableCell className="font-medium align-middle flex items-center">
        <span
          className={cn(
            "mr-1.5 inline-block h-2 w-2 rounded-full",
            isOnline ? "bg-emerald-400" : "bg-muted-foreground",
          )}
        />
        {server.name}
      </TableCell>

      {/* OS */}
      <TableCell>
        {server.os && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <OsIcon os={server.os} className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-35">{server.os}</span>
          </div>
        )}
      </TableCell>

      {/* CPU */}
      <TableCell className="text-center">
        {isOnline && load ? (
          <UsageCell percent={cpuPercent} label={`${cpuPercent.toFixed(1)}%`} />
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

      {/* 网络 */}
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
      {/* 状态 */}
      {/* <TableCell className="text-center">
        <Badge
          variant="secondary"
          className={cn("shrink-0", isOnline ? "bg-green-100" : "bg-gray-100")}
        >
          <span
            className={cn(
              "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
              isOnline ? "bg-emerald-400" : "bg-muted-foreground",
            )}
          />
          {isOnline ? t("display.server.online") : t("display.server.offline")}
        </Badge>
      </TableCell> */}
    </TableRow>
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
