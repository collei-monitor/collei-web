/**
 * SSH 脚本库管理页面
 */

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useSshScripts,
  useCreateSshScript,
  useUpdateSshScript,
  useDeleteSshScript,
} from "@/services/sshScripts";
import type {
  SshScript,
  CreateSshScriptPayload,
  UpdateSshScriptPayload,
} from "@/types/sshScript";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Plus, Pencil, Trash2, Code2 } from "lucide-react";

// ── 常量 ──────────────────────────────────────────────────────────────────────

const LANGUAGES = ["bash", "python", "powershell", "fish"] as const;

function formatTimestamp(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

// ── 语言徽章颜色映射 ──────────────────────────────────────────────────────────

function getLanguageVariant(lang: string): "default" | "secondary" | "outline" {
  switch (lang) {
    case "bash":
      return "default";
    case "python":
      return "secondary";
    default:
      return "outline";
  }
}

// ── 创建 / 编辑对话框 ──────────────────────────────────────────────────────────

function ScriptDialog({
  open,
  script,
  onOpenChange,
}: {
  open: boolean;
  script: SshScript | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!script;
  const createScript = useCreateSshScript();
  const updateScript = useUpdateSshScript();

  const [name, setName] = useState(script?.name ?? "");
  const [description, setDescription] = useState(script?.description ?? "");
  const [content, setContent] = useState(script?.content ?? "");
  const [language, setLanguage] = useState<string>(script?.language ?? "bash");
  const [top, setTop] = useState(script?.top ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(t("common.saving"));

    if (isEdit && script) {
      const payload: UpdateSshScriptPayload = {
        name: name.trim(),
        content: content.trim(),
        language,
        top,
        description: description.trim() || undefined,
      };
      updateScript.mutate(
        { id: script.id, payload },
        {
          onSuccess: () => {
            toast.success(t("admin.services.sshScripts.toast.editSuccess"), {
              id: toastId,
            });
            onOpenChange(false);
          },
          onError: () => toast.error(t("common.updateFailed"), { id: toastId }),
        },
      );
    } else {
      const payload: CreateSshScriptPayload = {
        name: name.trim(),
        content: content.trim(),
        language,
        description: description.trim() || undefined,
      };
      createScript.mutate(payload, {
        onSuccess: () => {
          toast.success(t("admin.services.sshScripts.toast.createSuccess"), {
            id: toastId,
          });
          onOpenChange(false);
        },
        onError: () => toast.error(t("common.createFailed"), { id: toastId }),
      });
    }
  };

  const isPending = createScript.isPending || updateScript.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t(
              isEdit
                ? "admin.services.sshScripts.edit.title"
                : "admin.services.sshScripts.create.title",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              isEdit
                ? "admin.services.sshScripts.edit.description"
                : "admin.services.sshScripts.create.description",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 脚本名称 */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="script-name">
                {t("admin.services.sshScripts.fields.name")}
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="script-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(
                  "admin.services.sshScripts.fields.namePlaceholder",
                )}
                required
                maxLength={128}
              />
            </div>

            {/* 脚本语言 */}
            <div className="space-y-2">
              <Label>{t("admin.services.sshScripts.fields.language")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {t(`admin.services.sshScripts.language.${lang}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="script-description">
              {t("admin.services.sshScripts.fields.description")}
            </Label>
            <Input
              id="script-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(
                "admin.services.sshScripts.fields.descriptionPlaceholder",
              )}
              maxLength={512}
            />
          </div>

          {/* 脚本内容 */}
          <div className="space-y-2">
            <Label htmlFor="script-content">
              {t("admin.services.sshScripts.fields.content")}
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Textarea
              id="script-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t(
                "admin.services.sshScripts.fields.contentPlaceholder",
              )}
              required
              rows={10}
              className="font-mono text-sm resize-y"
            />
          </div>

          {/* 排序权重（仅编辑时显示） */}
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="script-top">
                {t("admin.services.sshScripts.fields.top")}
              </Label>
              <Input
                id="script-top"
                type="number"
                value={top}
                onChange={(e) => setTop(parseInt(e.target.value, 10) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.services.sshScripts.fields.topHint")}
              </p>
            </div>
          )}

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
              disabled={isPending || !name.trim() || !content.trim()}
            >
              {isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── 删除确认对话框 ─────────────────────────────────────────────────────────────

function DeleteScriptDialog({
  script,
  open,
  onOpenChange,
}: {
  script: SshScript | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const deleteScript = useDeleteSshScript();

  const handleDelete = () => {
    if (!script) return;
    const toastId = toast.loading(t("common.deleting"));
    deleteScript.mutate(script.id, {
      onSuccess: () => {
        toast.success(t("admin.services.sshScripts.toast.deleteSuccess"), {
          id: toastId,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast.error(t("admin.services.sshScripts.toast.deleteFailed"), {
          id: toastId,
        });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.services.sshScripts.delete.description", {
              name: script?.name ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteScript.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteScript.isPending
              ? t("common.deleting")
              : t("common.confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────────

export default function SshScriptsPage() {
  const { t } = useTranslation();
  const { data: scripts = [], isLoading, isError, refetch } = useSshScripts();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SshScript | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SshScript | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleEdit = useCallback((script: SshScript) => {
    setEditTarget(script);
    setEditOpen(true);
  }, []);

  const handleDelete = useCallback((script: SshScript) => {
    setDeleteTarget(script);
    setDeleteOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("common.refreshing"),
      success: t("admin.services.sshScripts.toast.refreshSuccess"),
      error: t("common.refreshFailed"),
    });
  }, [refetch, t]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="h-6 w-6" />
            {t("admin.services.sshScripts.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.services.sshScripts.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.refresh")}</TooltipContent>
          </Tooltip>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("admin.services.sshScripts.add")}
          </Button>
        </div>
      </div>

      <Separator />

      {/* 内容区 */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t("admin.services.sshScripts.fetchError")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("common.refresh")}
          </Button>
        </div>
      ) : scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Code2 className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("admin.services.sshScripts.empty")}
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("admin.services.sshScripts.add")}
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">
                  {t("admin.services.sshScripts.table.name")}
                </TableHead>
                <TableHead className="w-[30%] hidden md:table-cell">
                  {t("admin.services.sshScripts.table.description")}
                </TableHead>
                <TableHead className="w-[10%]">
                  {t("admin.services.sshScripts.table.language")}
                </TableHead>
                <TableHead className="w-[10%] hidden lg:table-cell">
                  {t("admin.services.sshScripts.table.top")}
                </TableHead>
                <TableHead className="w-[15%] hidden lg:table-cell">
                  {t("admin.services.sshScripts.table.updatedAt")}
                </TableHead>
                <TableHead className="w-[5%] text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {scripts.map((script) => (
                <TableRow key={script.id}>
                  <TableCell>
                    <div className="font-medium">{script.name}</div>
                    {/* 移动端显示描述 */}
                    {script.description && (
                      <div className="md:hidden text-xs text-muted-foreground mt-0.5 truncate max-w-50">
                        {script.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-sm truncate block max-w-60">
                      {script.description ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLanguageVariant(script.language)}>
                      {script.language}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {script.top}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                    {formatTimestamp(script.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(script)}
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
                            onClick={() => handleDelete(script)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("common.delete")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 创建对话框 */}
      <ScriptDialog
        key="create"
        open={createOpen}
        script={null}
        onOpenChange={setCreateOpen}
      />

      {/* 编辑对话框 */}
      <ScriptDialog
        key={editTarget?.id ?? "edit"}
        open={editOpen}
        script={editTarget}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
      />

      {/* 删除确认对话框 */}
      <DeleteScriptDialog
        script={deleteTarget}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
