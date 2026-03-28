/**
 * SSH 快捷脚本浮动面板
 * 定位�?SSH 终端页面的右侧，默认收起，点击展开显示脚本列表
 * 支持面板内直接增删改脚本
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useSshScripts,
  useCreateSshScript,
  useUpdateSshScript,
  useDeleteSshScript,
} from "@/services/sshScripts";
import type { SshScript, CreateSshScriptPayload, UpdateSshScriptPayload } from "@/types/sshScript";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Code2, X, Play, Search, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";

// ── 常量 ──────────────────────────────────────────────────────────────────────

const LANGUAGES = ["bash", "python", "powershell", "fish"] as const;

interface SshScriptsPanelProps {
  /** 将脚本内容注入到终端 */
  onSend: (content: string) => void;
}

function getLanguageBadgeClass(lang: string): string {
  switch (lang) {
    case "bash":
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
    case "python":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
    case "powershell":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
    case "fish":
      return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
    default:
      return "";
  }
}

// ── 脚本列表条目 ────────────────────────────────────────────────────────────────

function ScriptItem({
  script,
  onSend,
  onEdit,
  onDelete,
}: {
  script: SshScript;
  onSend: (content: string) => void;
  onEdit: (script: SshScript) => void;
  onDelete: (script: SshScript) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="px-3 py-2.5 hover:bg-accent transition-colors border-b border-border/50 last:border-0">
      {/* 标题行：名称 + 语言徽章 + 操作按钮（始终可见） */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-sm leading-tight truncate flex-1 min-w-0">
          {script.name}
        </span>
        <Badge
          variant="outline"
          className={`text-[10px] px-1 py-0 h-4 shrink-0 ${getLanguageBadgeClass(script.language)}`}
        >
          {script.language}
        </Badge>
        {/* 操作按钮组 */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title={t("ssh.scripts.send")}
            onClick={() => onSend(script.content + "\n")}
          >
            <Play className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title={t("common.edit")}
            onClick={() => onEdit(script)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            title={t("common.delete")}
            onClick={() => onDelete(script)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 脚本内容预览 */}
      <pre className="mt-1 text-[10px] font-mono text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap break-all">
        {script.content}
      </pre>

      {/* 描述（若有） */}
      {script.description && (
        <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic line-clamp-1">
          {script.description}
        </p>
      )}
    </div>
  );
}

// ── 内联表单（新�?/ 编辑�?──────────────────────────────────────────────────────

function ScriptForm({
  script,
  onCancel,
}: {
  script: SshScript | null;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!script;
  const createScript = useCreateSshScript();
  const updateScript = useUpdateSshScript();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<string>("bash");
  const [top, setTop] = useState(0);

  useEffect(() => {
    setName(script?.name ?? "");
    setDescription(script?.description ?? "");
    setContent(script?.content ?? "");
    setLanguage(script?.language ?? "bash");
    setTop(script?.top ?? 0);
  }, [script]);

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
            toast.success(t("admin.services.sshScripts.toast.editSuccess"), { id: toastId });
            onCancel();
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
          toast.success(t("admin.services.sshScripts.toast.createSuccess"), { id: toastId });
          onCancel();
        },
        onError: () => toast.error(t("common.createFailed"), { id: toastId }),
      });
    }
  };

  const isPending = createScript.isPending || updateScript.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 名称 */}
        <div className="space-y-1">
          <Label className="text-xs">
            {t("admin.services.sshScripts.fields.name")}
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("admin.services.sshScripts.fields.namePlaceholder")}
            className="h-7 text-xs"
            required
            maxLength={128}
          />
        </div>

        {/* 语言 */}
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.services.sshScripts.fields.language")}</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang} className="text-xs">
                  {t(`admin.services.sshScripts.language.${lang}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 描述 */}
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.services.sshScripts.fields.description")}</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("admin.services.sshScripts.fields.descriptionPlaceholder")}
            className="h-7 text-xs"
            maxLength={512}
          />
        </div>

        {/* 内容 */}
        <div className="space-y-1">
          <Label className="text-xs">
            {t("admin.services.sshScripts.fields.content")}
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("admin.services.sshScripts.fields.contentPlaceholder")}
            required
            rows={8}
            className="font-mono text-xs resize-none"
          />
        </div>

        {/* 排序权重（仅编辑�?*/}
        {isEdit && (
          <div className="space-y-1">
            <Label className="text-xs">{t("admin.services.sshScripts.fields.top")}</Label>
            <Input
              type="number"
              value={top}
              onChange={(e) => setTop(parseInt(e.target.value, 10) || 0)}
              className="h-7 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              {t("admin.services.sshScripts.fields.topHint")}
            </p>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="border-t border-border p-2 flex gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="flex-1 h-7 text-xs"
          disabled={isPending || !name.trim() || !content.trim()}
        >
          {isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}

// ── 主组�?────────────────────────────────────────────────────────────────────

export function SshScriptsPanel({ onSend }: SshScriptsPanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // null = 列表视图；undefined = 新建；SshScript = 编辑
  const [formTarget, setFormTarget] = useState<SshScript | null | undefined>(null);
  const [deleteTarget, setDeleteTarget] = useState<SshScript | null>(null);

  const { data: scripts = [], isLoading } = useSshScripts();
  const deleteScript = useDeleteSshScript();

  const isFormView = formTarget !== null;

  const filtered = scripts.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase())),
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    const toastId = toast.loading(t("common.deleting"));
    deleteScript.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t("admin.services.sshScripts.toast.deleteSuccess"), { id: toastId });
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error(t("admin.services.sshScripts.toast.deleteFailed"), { id: toastId });
      },
    });
  };

  return (
    <>
      {/* 折叠状态：右侧悬浮切换按钮 */}
      {!open && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30">
          <button
            className="flex flex-col items-center gap-1.5 rounded-l-md border border-r-0 border-border bg-background/90 px-1.5 py-3 shadow-md hover:bg-accent transition-colors backdrop-blur-sm"
            onClick={() => setOpen(true)}
            title={t("ssh.scripts.title")}
          >
            <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span
              className="text-[10px] text-muted-foreground font-medium leading-none"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              {t("ssh.scripts.title")}
            </span>
          </button>
        </div>
      )}

      {/* 展开状态：右侧浮动面板 */}
      {open && (
        <div className="absolute right-0 top-0 bottom-0 z-30 w-72 bg-background border-l border-border shadow-xl flex flex-col">

          {/* ── 面板头部 ── */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2 shrink-0">
            {isFormView ? (
              <>
                <button
                  className="flex items-center gap-1.5 text-sm font-medium hover:text-foreground/70 transition-colors"
                  onClick={() => setFormTarget(null)}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {formTarget
                    ? t("admin.services.sshScripts.edit.title")
                    : t("admin.services.sshScripts.create.title")}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setOpen(false); setFormTarget(null); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{t("ssh.scripts.title")}</span>
                  {scripts.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                      {scripts.length}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title={t("admin.services.sshScripts.add")}
                    onClick={() => setFormTarget(undefined)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* ── 表单视图 ── */}
          {isFormView && (
            <ScriptForm
              script={formTarget ?? null}
              onCancel={() => setFormTarget(null)}
            />
          )}

          {/* ── 列表视图 ── */}
          {!isFormView && (
            <>
              {/* 搜索�?*/}
              <div className="px-3 py-2 border-b border-border shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("ssh.scripts.search")}
                    className="h-7 pl-8 text-xs"
                  />
                </div>
              </div>

              {/* 脚本列表 */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4">
                    <Code2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {search ? t("ssh.scripts.noResults") : t("ssh.scripts.empty")}
                    </p>
                    {!search && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-7 text-xs"
                        onClick={() => setFormTarget(undefined)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {t("admin.services.sshScripts.add")}
                      </Button>
                    )}
                  </div>
                ) : (
                  filtered.map((script) => (
                    <ScriptItem
                      key={script.id}
                      script={script}
                      onSend={onSend}
                      onEdit={(s) => setFormTarget(s)}
                      onDelete={(s) => setDeleteTarget(s)}
                    />
                  ))
                )}
              </div>

              {/* 底部提示 */}
              <div className="border-t border-border px-3 py-1.5 shrink-0">
                <p className="text-[10px] text-muted-foreground text-center">
                  {t("ssh.scripts.hint")}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 删除确认对话�?*/}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.services.sshScripts.delete.description", {
                name: deleteTarget?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

