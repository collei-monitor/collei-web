/**
 * 新建远程任务对话框
 * 支持选择任务类型、配置参数、选择目标服务器
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateTask } from "@/services/tasks";
import { useServers } from "@/services/servers";
import { TASK_TYPES, type TaskType } from "@/types/task";
import { ServerStatus, ServerApproval } from "@/types/server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const { t } = useTranslation();
  const createTask = useCreateTask();
  const { data: servers = [] } = useServers();

  const [taskType, setTaskType] = useState<TaskType>("shell");
  const [command, setCommand] = useState("");
  const [script, setScript] = useState("");
  const [scriptArgs, setScriptArgs] = useState("");
  const [upgradeVersion, setUpgradeVersion] = useState("");
  const [upgradeUrl, setUpgradeUrl] = useState("");
  const [timeoutSec, setTimeoutSec] = useState("300");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 只显示已批准且在线的服务器
  const approvedServers = useMemo(
    () =>
      servers.filter(
        (s) =>
          s.is_approved === ServerApproval.APPROVED &&
          s.status === ServerStatus.ONLINE
      ),
    [servers]
  );

  const filteredServers = useMemo(() => {
    if (!searchQuery.trim()) return approvedServers;
    const q = searchQuery.toLowerCase();
    return approvedServers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.uuid.toLowerCase().includes(q) ||
        (s.ipv4 && s.ipv4.toLowerCase().includes(q)) ||
        (s.ipv6 && s.ipv6.toLowerCase().includes(q))
    );
  }, [approvedServers, searchQuery]);

  const buildPayload = (): string => {
    switch (taskType) {
      case "shell":
      case "command":
        return JSON.stringify({ command: command.trim() });
      case "script": {
        const args = scriptArgs.trim()
          ? scriptArgs.trim().split(/\s+/)
          : [];
        return JSON.stringify({ script: script.trim(), args });
      }
      case "upgrade_agent":
        return JSON.stringify({
          version: upgradeVersion.trim(),
          url: upgradeUrl.trim(),
        });
      default:
        return "";
    }
  };

  const isValid = (): boolean => {
    if (selectedIds.length === 0) return false;
    const timeout = parseInt(timeoutSec, 10);
    if (isNaN(timeout) || timeout < 1 || timeout > 86400) return false;
    switch (taskType) {
      case "shell":
      case "command":
        return command.trim().length > 0;
      case "script":
        return script.trim().length > 0;
      case "upgrade_agent":
        return upgradeVersion.trim().length > 0 && upgradeUrl.trim().length > 0;
      default:
        return false;
    }
  };

  const resetForm = () => {
    setTaskType("shell");
    setCommand("");
    setScript("");
    setScriptArgs("");
    setUpgradeVersion("");
    setUpgradeUrl("");
    setTimeoutSec("300");
    setSelectedIds([]);
    setSearchQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(t("common.creating"));
    createTask.mutate(
      {
        type: taskType,
        payload: buildPayload(),
        timeout_sec: parseInt(timeoutSec, 10) || 300,
        agent_ids: selectedIds,
      },
      {
        onSuccess: () => {
          toast.success(t("admin.services.remote.toast.createSuccess"), {
            id: toastId,
          });
          resetForm();
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(
            err.message || t("common.createFailed"),
            { id: toastId }
          );
        },
      }
    );
  };

  const toggleServer = (uuid: string) => {
    setSelectedIds((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === approvedServers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(approvedServers.map((s) => s.uuid));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("admin.services.remote.create.title")}
          </DialogTitle>
          <DialogDescription>
            {t("admin.services.remote.create.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 任务类型 */}
          <div className="space-y-2">
            <Label>{t("admin.services.remote.create.type")}</Label>
            <Select
              value={taskType}
              onValueChange={(v) => setTaskType(v as TaskType)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t(
                    "admin.services.remote.create.typePlaceholder"
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((tp) => (
                  <SelectItem key={tp} value={tp}>
                    {t(`admin.services.remote.taskType.${tp}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 命令/脚本/升级参数 — 按类型显示 */}
          {(taskType === "shell" || taskType === "command") && (
            <div className="space-y-2">
              <Label>{t("admin.services.remote.create.command")}</Label>
              <Textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={t(
                  "admin.services.remote.create.commandPlaceholder"
                )}
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          )}

          {taskType === "script" && (
            <>
              <div className="space-y-2">
                <Label>{t("admin.services.remote.create.script")}</Label>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder={t(
                    "admin.services.remote.create.scriptPlaceholder"
                  )}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.services.remote.create.scriptArgs")}</Label>
                <Input
                  value={scriptArgs}
                  onChange={(e) => setScriptArgs(e.target.value)}
                  placeholder={t(
                    "admin.services.remote.create.scriptArgsPlaceholder"
                  )}
                />
              </div>
            </>
          )}

          {taskType === "upgrade_agent" && (
            <>
              <div className="space-y-2">
                <Label>
                  {t("admin.services.remote.create.upgradeVersion")}
                </Label>
                <Input
                  value={upgradeVersion}
                  onChange={(e) => setUpgradeVersion(e.target.value)}
                  placeholder={t(
                    "admin.services.remote.create.upgradeVersionPlaceholder"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.services.remote.create.upgradeUrl")}</Label>
                <Input
                  value={upgradeUrl}
                  onChange={(e) => setUpgradeUrl(e.target.value)}
                  placeholder={t(
                    "admin.services.remote.create.upgradeUrlPlaceholder"
                  )}
                />
              </div>
            </>
          )}

          {/* 超时时间 */}
          <div className="space-y-2">
            <Label>{t("admin.services.remote.create.timeout")}</Label>
            <Input
              type="number"
              min={1}
              max={86400}
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(e.target.value)}
              placeholder={t(
                "admin.services.remote.create.timeoutPlaceholder"
              )}
              className="w-40"
            />
          </div>

          {/* 目标服务器选择 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("admin.services.remote.create.servers")}</Label>
              {selectedIds.length > 0 && (
                <Badge variant="secondary">
                  {t("admin.services.remote.create.selectedCount", {
                    count: selectedIds.length,
                  })}
                </Badge>
              )}
            </div>

            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                "admin.services.remote.create.serversPlaceholder"
              )}
            />

            {approvedServers.length > 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleAll}
                >
                  {selectedIds.length === approvedServers.length
                    ? t("admin.services.remote.create.deselectAll")
                    : t("admin.services.remote.create.selectAll")}
                </Button>
              </div>
            )}

            <div className="border rounded-md max-h-48 overflow-y-auto">
              {filteredServers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t("admin.services.remote.create.noApprovedServers")}
                </div>
              ) : (
                filteredServers.map((server) => (
                  <label
                    key={server.uuid}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedIds.includes(server.uuid)}
                      onCheckedChange={() => toggleServer(server.uuid)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {server.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {server.ipv4 || server.ipv6 || server.uuid}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createTask.isPending || !isValid()}
            >
              {createTask.isPending
                ? t("common.loading")
                : t("admin.services.remote.create.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
