import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDdnsTasks } from "@/services/dns";
import { useServers } from "@/services/servers";
import type { DdnsTaskRead } from "@/types/dns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { CreateDdnsTaskDialog } from "./components/dialogs/CreateDdnsTaskDialog";
import { EditDdnsTaskDialog } from "./components/dialogs/EditDdnsTaskDialog";
import { DeleteDdnsTaskDialog } from "./components/dialogs/DeleteDdnsTaskDialog";

export default function DdnsTasksPage() {
  const { t } = useTranslation();

  const {
    data: ddnsTasks = [],
    isLoading,
    isError,
    refetch,
  } = useDdnsTasks({ refetchInterval: 30_000 });

  const { data: servers = [] } = useServers();

  const serverMap = useMemo(
    () => new Map(servers.map((s) => [s.uuid, s])),
    [servers],
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<DdnsTaskRead | null>(null);
  const [deleteTask, setDeleteTask] = useState<DdnsTaskRead | null>(null);

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("common.refreshing"),
      success: t("common.listRefreshed"),
      error: t("common.refreshFailed"),
    });
  }, [refetch, t]);

  const formatTime = useCallback((ts: number | null) => {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleString();
  }, []);


  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.services.dns.ddns.title")}
          </h1>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("common.refreshList")}</TooltipContent>
            </Tooltip>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("admin.services.dns.ddns.add")}
            </Button>
          </div>
        </div>

        {isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {t("admin.services.dns.fetchError")}
          </div>
        )}

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.services.dns.ddns.table.record")}</TableHead>
                <TableHead>{t("admin.services.dns.ddns.table.server")}</TableHead>
                <TableHead>{t("admin.services.dns.ddns.table.ipVersion")}</TableHead>
                <TableHead>{t("admin.services.dns.ddns.table.lastIp")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("admin.services.dns.ddns.table.lastUpdated")}</TableHead>
                <TableHead>{t("admin.services.dns.ddns.table.lastError")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : ddnsTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {t("admin.services.dns.ddns.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                ddnsTasks.map((task) => {
                  const server = serverMap.get(task.server_uuid);
                  return (
                    <TableRow key={task.id}>
                      <TableCell>{task.record_name ?? `#${task.record_id}`}</TableCell>
                      <TableCell>{server?.name ?? task.server_uuid}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.ip_version.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {task.last_ip ?? t("admin.services.dns.ddns.noIp")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.is_active ? "default" : "secondary"}>
                          {task.is_active
                            ? t("admin.services.dns.ddns.activeBadge")
                            : t("admin.services.dns.ddns.inactiveBadge")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatTime(task.last_updated)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-50 truncate">
                        {task.last_error ?? t("admin.services.dns.ddns.noError")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditTask(task)}
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
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTask(task)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("common.delete")}</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateDdnsTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditDdnsTaskDialog
        task={editTask}
        open={!!editTask}
        onOpenChange={(v) => { if (!v) setEditTask(null); }}
      />
      <DeleteDdnsTaskDialog
        task={deleteTask}
        open={!!deleteTask}
        onOpenChange={(v) => { if (!v) setDeleteTask(null); }}
      />
    </TooltipProvider>
  );
}
