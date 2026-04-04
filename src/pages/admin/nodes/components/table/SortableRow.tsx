import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Server } from "@/types/server";
import { ServerApproval, ServerVisibility } from "@/types/server";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FlagIcon } from "@/components/FlagIcon";
import {
  GripVertical,
  EyeOff,
  Copy,
  Check,
  Pencil,
  Receipt,
  TerminalSquare,
  Download,
  ArrowDownUp,
  Lock,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { SortInput } from "../SortInput";
import { StatusBadge } from "../StatusBadge";
import { ServerActions } from "./ServerActions";
import { OsIcon } from "@/components/OsIcon";

export function SortableRow({
  server,
  onSortCommit,
  sortDisabled,
  onEdit,
  onDelete,
  onGroups,
  onBilling,
  onTrafficRule,
  onInstall,
  visibleColumns,
  ipMasked,
}: {
  server: Server;
  onSortCommit: (uuid: string, top: number) => void;
  sortDisabled: boolean;
  onEdit: (s: Server) => void;
  onDelete: (s: Server) => void;
  onGroups: (s: Server) => void;
  onBilling: (s: Server) => void;
  onTrafficRule: (s: Server) => void;
  onInstall: (s: Server) => void;
  visibleColumns: {
    ip: boolean;
    groups: boolean;
    status: boolean;
    version: boolean;
    os: boolean;
  };
  ipMasked: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: server.uuid });

  const isMobile = useIsMobile();
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const [copiedIp, setCopiedIp] = React.useState<string | null>(null);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="group"
      //   className={server.hidden === ServerVisibility.HIDDEN ? "opacity-50" : ""}
    >
      {/* 拖动手柄 */}
      <TableCell className="w-10 min-w-10 md:sticky md:left-0 md:z-10 md:bg-background md:group-hover:bg-muted/50">
        <button
          type="button"
          className="cursor-grab touch-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>

      {/* 排序值 */}
      <TableCell className="w-20 min-w-20 md:sticky md:left-10 md:z-10 md:bg-background md:group-hover:bg-muted/50">
        <SortInput
          value={server.top}
          onCommit={(v) => onSortCommit(server.uuid, v)}
          disabled={sortDisabled}
        />
      </TableCell>

      {/* 服务器名称 */}
      <TableCell className="md:sticky md:left-30 md:z-10 md:bg-background md:group-hover:bg-muted/50 font-medium">
        <div className="flex items-center gap-1">
          {server.region && (
            <span className="text-xs text-muted-foreground">
              <FlagIcon region={server.region} size="md" />
            </span>
          )}
          <button
            type="button"
            className="hover:underline cursor-pointer text-left"
            onClick={() => navigate(`/admin/nodes/${server.uuid}`)}
          >
            {server.name}
          </button>
          {!!server.is_region_locked && (
            <Tooltip>
              <TooltipTrigger>
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>{t("admin.nodes.regionLocked")}</TooltipContent>
            </Tooltip>
          )}
          {server.hidden === ServerVisibility.HIDDEN && (
            <Tooltip>
              <TooltipTrigger>
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>{t("admin.nodes.hidden")}</TooltipContent>
            </Tooltip>
          )}
          {server.is_approved === ServerApproval.PENDING && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {t("admin.nodes.status.pending")}
            </Badge>
          )}
        </div>
      </TableCell>

      {/* 系统 */}
      {visibleColumns.os && (
        <TableCell>
          <div className="flex items-center gap-1.5">
            <OsIcon os={server.os} />
          </div>
        </TableCell>
      )}

      {/* IP 地址 */}
      {visibleColumns.ip && (
        <TableCell>
          <div className="space-y-0.5">
            {server.ipv4 && (
              <div className="flex items-center gap-1 group">
                <span className="text-xs font-mono">
                  {ipMasked ? "*.*.*.*" : server.ipv4}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyIp(server.ipv4!)}
                  className={
                    isMobile
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 transition-opacity"
                  }
                  title={t("common.copy")}
                >
                  {copiedIp === server.ipv4 ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}
            {server.ipv6 && (
              <div className="flex items-center gap-1 group">
                <span className="text-xs font-mono text-muted-foreground">
                  {ipMasked ? "*:*:*:*:*:*:*:*" : server.ipv6}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyIp(server.ipv6!)}
                  className={
                    isMobile
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 transition-opacity"
                  }
                  title={t("common.copy")}
                >
                  {copiedIp === server.ipv6 ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}
            {!server.ipv4 && !server.ipv6 && (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </TableCell>
      )}

      {/* 分组 */}
      {visibleColumns.groups && (
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {server.groups.length > 0 ? (
              server.groups.map((g) => (
                <Badge key={g.id} variant="secondary" className="text-xs">
                  {g.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </TableCell>
      )}

      {/* 状态 */}
      {visibleColumns.status && (
        <TableCell>
          <StatusBadge server={server} />
        </TableCell>
      )}

      {/* 版本 */}
      {visibleColumns.version && (
        <TableCell>
          <span className="text-xs font-mono text-muted-foreground">
            {server.version ?? "—"}
          </span>
        </TableCell>
      )}

      {/* 操作 */}
      <TableCell className="md:sticky md:right-0 md:z-10 md:bg-background md:group-hover:bg-muted/50">
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onInstall(server)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.nodes.actions.install")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(server)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.edit")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const isWindows = server.os
                    ?.toLowerCase()
                    .includes("windows");
                  const route = isWindows
                    ? "/admin/conpty-terminal"
                    : "/admin/terminal";
                  navigate(
                    `${route}?uuid=${server.uuid}&name=${encodeURIComponent(server.name)}`,
                  );
                }}
                disabled={server.status !== 1}
              >
                <TerminalSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.nodes.actions.terminal")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onBilling(server)}
              >
                <Receipt className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.nodes.billing.title")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onTrafficRule(server)}
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t("admin.nodes.trafficRule.title")}
            </TooltipContent>
          </Tooltip>
          <ServerActions
            server={server}
            onDelete={onDelete}
            onGroups={onGroups}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
