import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useServers, useUpdateServer } from "@/services/servers";
import type { Server } from "@/types/server";
import { Separator } from "@/components/ui/separator";
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
import { RefreshCw, ListRestart, Plus, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useNodeDnd } from "./hooks/useNodeDnd";
import { SortableRow } from "./components/table/SortableRow";
import { TableSkeleton } from "./components/table/TableSkeleton";
import { EditServerDialog } from "./components/dialogs/EditServerDialog";
import { DeleteServerDialog } from "./components/dialogs/DeleteServerDialog";
import { GroupsDialog } from "./components/dialogs/GroupsDialog";

export default function NodesPage() {
  const { t } = useTranslation();
  const { data: servers = [], isLoading, isError, refetch } = useServers({ refetchInterval: 5000 });
  const updateServer = useUpdateServer();

  const [editTarget, setEditTarget] = useState<Server | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Server | null>(null);
  const [groupsTarget, setGroupsTarget] = useState<Server | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState({
    ip: true,
    groups: true,
    status: true,
  });

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("admin.nodes.toast.refreshing"),
      success: t("admin.nodes.toast.refreshSuccess"),
      error: t("admin.nodes.toast.refreshFailed"),
    });
  }, [refetch, t]);

  const handleSortCommit = useCallback(
    (uuid: string, top: number) => {
      updateServer.mutate({ uuid, payload: { top } });
    },
    [updateServer],
  );

  const sortedServers = [...servers].sort((a, b) => a.top - b.top);
  const filteredServers = searchQuery
    ? sortedServers.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : sortedServers;
  const { sensors, handleDragEnd, handleResetSort, isUpdating } =
    useNodeDnd(sortedServers);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.nodes.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.nodes.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetSort}
                disabled={isUpdating || sortedServers.length === 0}
              >
                <ListRestart className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.nodes.resetSort")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.nodes.refresh")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Separator />

      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-2">
        <Input
          className="max-w-60"
          placeholder={t("admin.nodes.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                {t("admin.nodes.columns")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={visibleColumns.ip}
                onCheckedChange={(v) =>
                  setVisibleColumns((prev) => ({ ...prev, ip: v }))
                }
              >
                {t("admin.nodes.table.ip")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.groups}
                onCheckedChange={(v) =>
                  setVisibleColumns((prev) => ({ ...prev, groups: v }))
                }
              >
                {t("admin.nodes.table.groups")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.status}
                onCheckedChange={(v) =>
                  setVisibleColumns((prev) => ({ ...prev, status: v }))
                }
              >
                {t("admin.nodes.table.status")}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("admin.nodes.add")}
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.nodes.fetchError")}
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
                  {t("admin.nodes.table.sort")}
                </TableHead>
                <TableHead>{t("admin.nodes.table.name")}</TableHead>
                {visibleColumns.ip && (
                  <TableHead>{t("admin.nodes.table.ip")}</TableHead>
                )}
                {visibleColumns.groups && (
                  <TableHead>{t("admin.nodes.table.groups")}</TableHead>
                )}
                {visibleColumns.status && (
                  <TableHead>{t("admin.nodes.table.status")}</TableHead>
                )}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>

            {isLoading ? (
              <TableSkeleton />
            ) : (
              <TableBody>
                {sortedServers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={
                        4 +
                        (visibleColumns.ip ? 1 : 0) +
                        (visibleColumns.groups ? 1 : 0) +
                        (visibleColumns.status ? 1 : 0)
                      }
                      className="h-32 text-center text-muted-foreground"
                    >
                      {t("admin.nodes.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  <SortableContext
                    items={filteredServers.map((s) => s.uuid)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredServers.map((server) => (
                      <SortableRow
                        key={server.uuid}
                        server={server}
                        onSortCommit={handleSortCommit}
                        sortDisabled={updateServer.isPending}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                        onGroups={setGroupsTarget}
                        visibleColumns={visibleColumns}
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
      <EditServerDialog
        key={editTarget?.uuid}
        server={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      />
      <DeleteServerDialog
        server={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      />
      <GroupsDialog
        key={groupsTarget?.uuid}
        server={groupsTarget}
        open={!!groupsTarget}
        onOpenChange={(v) => !v && setGroupsTarget(null)}
      />
    </div>
  );
}
