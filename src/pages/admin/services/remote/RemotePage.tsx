import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTasks, useDeleteTask } from "@/services/tasks";
import { Separator } from "@/components/ui/separator";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Terminal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CreateTaskDialog } from "./components/CreateTaskDialog";
import { TaskDetailDialog } from "./components/TaskDetailDialog";

const PAGE_SIZE = 50;

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function tryParsePayloadSummary(payload: string): string {
  try {
    const parsed = JSON.parse(payload);
    if (parsed.command) return parsed.command;
    if (parsed.script) {
      const first = parsed.script.split("\n")[0];
      return first.length > 60 ? first.slice(0, 60) + "…" : first;
    }
    if (parsed.version) return `v${parsed.version}`;
    return payload;
  } catch {
    return payload;
  }
}

export default function RemotePage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const params = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
  const { data: tasks = [], isLoading, isError, refetch } = useTasks(params);
  const deleteTask = useDeleteTask();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("admin.services.remote.toast.refreshing"),
      success: t("admin.services.remote.toast.refreshSuccess"),
      error: t("admin.services.remote.toast.refreshFailed"),
    });
  }, [refetch, t]);

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const toastId = toast.loading(t("admin.services.remote.toast.deleting"));
    deleteTask.mutate(deleteTargetId, {
      onSuccess: () => {
        toast.success(t("admin.services.remote.toast.deleteSuccess"), {
          id: toastId,
        });
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error(
          err.message || t("admin.services.remote.toast.deleteFailed"),
          { id: toastId }
        );
      },
    });
  };

  const hasMore = tasks.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.services.remote.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.services.remote.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.services.remote.refresh")}</TooltipContent>
          </Tooltip>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("admin.services.remote.newTask")}
          </Button>
        </div>
      </div>

      <Separator />

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.services.remote.fetchError")}
        </div>
      )}

      {/* Task table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">
                {t("admin.services.remote.table.type")}
              </TableHead>
              <TableHead>
                {t("admin.services.remote.table.payload")}
              </TableHead>
              <TableHead className="w-24">
                {t("admin.services.remote.table.timeout")}
              </TableHead>
              <TableHead className="w-44">
                {t("admin.services.remote.table.createdAt")}
              </TableHead>
              <TableHead className="w-24">
                {t("admin.services.remote.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Terminal className="h-10 w-10 opacity-30" />
                    <span>{t("admin.services.remote.empty")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`admin.services.remote.taskType.${task.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-xs truncate">
                    {tryParsePayloadSummary(task.payload)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {task.timeout_sec}s
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatTimestamp(task.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetailTaskId(task.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("admin.services.remote.viewDetail")}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTargetId(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("admin.services.remote.deleteTask")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(page > 0 || hasMore) && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page + 1}</span>
          <Button
            variant="outline"
            size="icon"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TaskDetailDialog
        taskId={detailTaskId}
        open={!!detailTaskId}
        onOpenChange={(v) => {
          if (!v) setDetailTaskId(null);
        }}
      />
      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(v) => {
          if (!v) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.services.remote.confirm.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.services.remote.confirm.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("admin.services.remote.confirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("admin.services.remote.confirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
