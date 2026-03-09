import { useTranslation } from "react-i18next";
import type { Server } from "@/types/server";
import { ServerApproval, ServerVisibility } from "@/types/server";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FlagIcon } from "@/components/display/FlagIcon";
import { GripVertical, EyeOff } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortInput } from "../SortInput";
import { StatusBadge } from "../StatusBadge";
import { ServerActions } from "./ServerActions";

export function SortableRow({
  server,
  onSortCommit,
  sortDisabled,
  onEdit,
  onDelete,
  onGroups,
  visibleColumns,
}: {
  server: Server;
  onSortCommit: (uuid: string, top: number) => void;
  sortDisabled: boolean;
  onEdit: (s: Server) => void;
  onDelete: (s: Server) => void;
  onGroups: (s: Server) => void;
  visibleColumns: { ip: boolean; groups: boolean; status: boolean };
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: server.uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
    //   className={server.hidden === ServerVisibility.HIDDEN ? "opacity-50" : ""}
    >
      {/* 拖动手柄 */}
      <TableCell>
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
      <TableCell>
        <SortInput
          value={server.top}
          onCommit={(v) => onSortCommit(server.uuid, v)}
          disabled={sortDisabled}
        />
      </TableCell>

      {/* 服务器名称 */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-1">
          {server.region && (
            <span className="text-xs text-muted-foreground">
              <FlagIcon region={server.region} size="md" />
            </span>
          )}
          <span>{server.name}</span>
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

      {/* IP 地址 */}
      {visibleColumns.ip && (
        <TableCell>
          <div className="space-y-0.5">
            {server.ipv4 && (
              <div className="text-xs font-mono">{server.ipv4}</div>
            )}
            {server.ipv6 && (
              <div className="text-xs font-mono text-muted-foreground">
                {server.ipv6}
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

      {/* 操作 */}
      <TableCell>
        <ServerActions
          server={server}
          onEdit={onEdit}
          onDelete={onDelete}
          onGroups={onGroups}
        />
      </TableCell>
    </TableRow>
  );
}
