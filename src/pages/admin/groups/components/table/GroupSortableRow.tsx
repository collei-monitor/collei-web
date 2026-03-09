import { useTranslation } from "react-i18next";
import type { GroupWithServers } from "@/types/server";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortInput } from "@/pages/admin/nodes/components/SortInput";

interface GroupSortableRowProps {
  group: GroupWithServers;
  onSortCommit: (id: string, top: number) => void;
  sortDisabled: boolean;
  onEdit: (g: GroupWithServers) => void;
  onDelete: (g: GroupWithServers) => void;
}

export function GroupSortableRow({
  group,
  onSortCommit,
  sortDisabled,
  onEdit,
  onDelete,
}: GroupSortableRowProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
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
          value={group.top}
          onCommit={(v) => onSortCommit(group.id, v)}
          disabled={sortDisabled}
        />
      </TableCell>

      {/* 分组名称 */}
      <TableCell className="font-medium">{group.name}</TableCell>

      {/* 服务器数量 */}
      <TableCell className="tabular-nums text-muted-foreground">
        {group.server_uuids.length}
      </TableCell>

      {/* 操作按钮 */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(group)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">{t("admin.groups.actions.edit")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.groups.actions.edit")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(group)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">{t("admin.groups.actions.delete")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.groups.actions.delete")}</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}
