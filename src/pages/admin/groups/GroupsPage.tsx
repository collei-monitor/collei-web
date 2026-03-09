import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { usePublicGroups } from "@/services/servers";
import type { GroupWithServers } from "@/types/server";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, ListRestart, Plus } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useGroupDnd } from "./hooks/useGroupDnd";
import { GroupSortableRow } from "./components/table/GroupSortableRow";
import { GroupTableSkeleton } from "./components/table/GroupTableSkeleton";
import { EditGroupDialog } from "./components/dialogs/EditGroupDialog";
import { DeleteGroupDialog } from "./components/dialogs/DeleteGroupDialog";
import { CreateGroupDialog } from "./components/dialogs/CreateGroupDialog";

export default function GroupsPage() {
  const { t } = useTranslation();
  const { data: groups = [], isLoading, isError, refetch } = usePublicGroups();

  const [editTarget, setEditTarget] = useState<GroupWithServers | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupWithServers | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("admin.groups.toast.refreshing"),
      success: t("admin.groups.toast.refreshSuccess"),
      error: t("admin.groups.toast.refreshFailed"),
    });
  }, [refetch, t]);

  const sortedGroups = [...groups].sort((a, b) => a.top - b.top);
  const {
    sensors,
    handleDragEnd,
    handleResetSort,
    handleSortCommit,
    isUpdating,
  } = useGroupDnd(sortedGroups);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.groups.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.groups.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetSort}
                disabled={isUpdating || sortedGroups.length === 0}
              >
                <ListRestart className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.groups.resetSort")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.groups.refresh")}</TooltipContent>
          </Tooltip>{" "}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("admin.groups.add")}
          </Button>
        </div>
      </div>

      {/* 工具栏 */}
      {/* <div className="flex items-center justify-end"></div> */}

      {/* 错误提示 */}
      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.groups.fetchError")}
        </div>
      )}

      {/* 数据表格 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="w-20">
                  {t("admin.groups.table.sort")}
                </TableHead>
                <TableHead>{t("admin.groups.table.name")}</TableHead>
                <TableHead className="w-28">
                  {t("admin.groups.table.serverCount")}
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>

            {isLoading ? (
              <GroupTableSkeleton />
            ) : (
              <TableBody>
                {sortedGroups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {t("admin.groups.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  <SortableContext
                    items={sortedGroups.map((g) => g.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedGroups.map((group) => (
                      <GroupSortableRow
                        key={group.id}
                        group={group}
                        onSortCommit={handleSortCommit}
                        sortDisabled={isUpdating}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </SortableContext>
                )}
              </TableBody>
            )}
          </Table>
        </div>
      </DndContext>

      {/* 对话框 */}
      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditGroupDialog
        key={editTarget?.id}
        group={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      />
      <DeleteGroupDialog
        group={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      />
    </div>
  );
}
