/**
 * 任务详情对话框
 * 展示任务信息 + 执行记录列表 + 可查看单条执行的终端输出
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTaskDetail, useExecutionDetail } from "@/services/tasks";
import { useServers } from "@/services/servers";
import type { TaskExecution } from "@/types/task";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FileTerminal } from "lucide-react";

interface TaskDetailDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "success":
      return "default";
    case "running":
    case "sent":
      return "secondary";
    case "failed":
    case "timeout":
      return "destructive";
    default:
      return "outline";
  }
}

function tryParsePayload(payload: string): string {
  try {
    const parsed = JSON.parse(payload);
    return parsed.command || parsed.script || JSON.stringify(parsed);
  } catch {
    return payload;
  }
}

export function TaskDetailDialog({
  taskId,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  const { t } = useTranslation();
  const { data: task, isLoading } = useTaskDetail(open ? taskId : null);
  const { data: servers = [] } = useServers();
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null);
  const { data: execDetail, isLoading: execLoading } = useExecutionDetail(
    selectedExecId
  );

  const serverNameMap = new Map(
    servers.map((s) => [s.uuid, s.name])
  );

  const handleClose = (v: boolean) => {
    if (!v) setSelectedExecId(null);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("admin.services.remote.detail.title")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !task ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : selectedExecId ? (
          /* ── 执行记录详情视图 ── */
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedExecId(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("admin.services.remote.detail.backToExecutions")}
            </Button>

            {execLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : execDetail ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      {t("admin.services.remote.detail.server")}:
                    </span>{" "}
                    {serverNameMap.get(execDetail.agent_id) ||
                      execDetail.agent_id}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("admin.services.remote.detail.status")}:
                    </span>{" "}
                    <Badge variant={statusVariant(execDetail.status)}>
                      {t(
                        `admin.services.remote.status.${execDetail.status}`
                      )}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("admin.services.remote.detail.exitCode")}:
                    </span>{" "}
                    {execDetail.exit_code ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("admin.services.remote.detail.dispatchedAt")}:
                    </span>{" "}
                    {formatTimestamp(execDetail.dispatched_at)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("admin.services.remote.detail.completedAt")}:
                    </span>{" "}
                    {formatTimestamp(execDetail.completed_at)}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    {t("admin.services.remote.detail.output")}
                  </h4>
                  {execDetail.output ? (
                    <pre className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-80 overflow-y-auto">
                      {execDetail.output}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("admin.services.remote.detail.noOutput")}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* ── 任务信息 + 执行记录列表 ── */
          <div className="space-y-4">
            {/* 任务基本信息 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {t("admin.services.remote.detail.taskInfo")}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {t("admin.services.remote.table.type")}:
                  </span>{" "}
                  {t(`admin.services.remote.taskType.${task.type}`)}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("admin.services.remote.table.timeout")}:
                  </span>{" "}
                  {task.timeout_sec}s
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">
                    {t("admin.services.remote.table.payload")}:
                  </span>
                  <pre className="mt-1 rounded bg-muted p-2 text-xs font-mono whitespace-pre-wrap break-all">
                    {tryParsePayload(task.payload)}
                  </pre>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("admin.services.remote.table.createdAt")}:
                  </span>{" "}
                  {formatTimestamp(task.created_at)}
                </div>
              </div>
            </div>

            <Separator />

            {/* 执行记录表格 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {t("admin.services.remote.detail.executions")}
              </h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("admin.services.remote.detail.server")}
                      </TableHead>
                      <TableHead>
                        {t("admin.services.remote.detail.status")}
                      </TableHead>
                      <TableHead>
                        {t("admin.services.remote.detail.exitCode")}
                      </TableHead>
                      <TableHead>
                        {t("admin.services.remote.detail.completedAt")}
                      </TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {task.executions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-muted-foreground"
                        >
                          —
                        </TableCell>
                      </TableRow>
                    ) : (
                      task.executions.map((exec: TaskExecution) => (
                        <TableRow key={exec.id}>
                          <TableCell className="text-sm">
                            {serverNameMap.get(exec.agent_id) || exec.agent_id}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(exec.status)}>
                              {t(
                                `admin.services.remote.status.${exec.status}`
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {exec.exit_code ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatTimestamp(exec.completed_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedExecId(exec.id)}
                              title={t(
                                "admin.services.remote.detail.viewOutput"
                              )}
                            >
                              <FileTerminal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
