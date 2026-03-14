import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNetworkTargets } from "@/services/network";
import type { NetworkTarget } from "@/types/network";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { RefreshCw, Plus } from "lucide-react";
import { NetworkTableSkeleton } from "./components/table/NetworkTableSkeleton";
import { NetworkTargetRow } from "./components/table/NetworkTargetRow";
import { CreateTargetDialog } from "./components/dialogs/CreateTargetDialog";
import { EditTargetDialog } from "./components/dialogs/EditTargetDialog";
import { DeleteTargetDialog } from "./components/dialogs/DeleteTargetDialog";
import { DispatchDialog } from "./components/dialogs/DispatchDialog";
import { StatusDrawer } from "./components/StatusDrawer";

export default function NetworkPage() {
  const { t } = useTranslation();
  const { data: targets = [], isLoading, isError, refetch } = useNetworkTargets();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NetworkTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NetworkTarget | null>(null);
  const [dispatchTarget, setDispatchTarget] = useState<NetworkTarget | null>(null);
  const [statusTarget, setStatusTarget] = useState<NetworkTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("admin.services.network.toast.refreshing"),
      success: t("admin.services.network.toast.refreshSuccess"),
      error: t("admin.services.network.toast.refreshFailed"),
    });
  }, [refetch, t]);

  const filteredTargets = searchQuery
    ? targets.filter(
        (target) =>
          target.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          target.host.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : targets;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.services.network.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.services.network.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.services.network.refresh")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Separator />

      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-2">
        <Input
          className="max-w-60"
          placeholder={t("admin.services.network.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {t("admin.services.network.add")}
        </Button>
      </div>

      {/* 错误提示 */}
      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.services.network.fetchError")}
        </div>
      )}

      {/* 数据表格 */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.services.network.table.name")}</TableHead>
              <TableHead>{t("admin.services.network.table.host")}</TableHead>
              <TableHead>{t("admin.services.network.table.protocol")}</TableHead>
              <TableHead>{t("admin.services.network.table.port")}</TableHead>
              <TableHead>{t("admin.services.network.table.interval")}</TableHead>
              <TableHead>{t("admin.services.network.table.status")}</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <NetworkTableSkeleton />
          ) : (
            <TableBody>
              {filteredTargets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {searchQuery
                      ? t("admin.services.network.noResults")
                      : t("admin.services.network.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTargets.map((target) => (
                  <NetworkTargetRow
                    key={target.id}
                    target={target}
                    onEdit={setEditTarget}
                    onDispatch={setDispatchTarget}
                    onViewStatus={setStatusTarget}
                    onDelete={setDeleteTarget}
                  />
                ))
              )}
            </TableBody>
          )}
        </Table>
      </div>

      {/* 对话框 */}
      <CreateTargetDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditTargetDialog
        key={editTarget?.id}
        target={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      />
      <DeleteTargetDialog
        target={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      />
      <DispatchDialog
        key={dispatchTarget?.id}
        target={dispatchTarget}
        open={!!dispatchTarget}
        onOpenChange={(v) => !v && setDispatchTarget(null)}
      />
      <StatusDrawer
        target={statusTarget}
        open={!!statusTarget}
        onOpenChange={(v) => !v && setStatusTarget(null)}
      />
    </div>
  );
}
