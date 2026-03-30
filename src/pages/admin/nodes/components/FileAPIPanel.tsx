/**
 * File API 文件管理面板（原生文件操作，无需 SSH）
 * 桌面端右键菜单操作，手机端保留行内按钮
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFileAPIConnection } from "@/hooks/use-files-connection";
import type { FileEntry } from "@/types/fileapi";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FilePlus,
  Upload,
  FolderPlus,
  RefreshCw,
  ChevronRight,
  Home,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUp,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { FileAPIListContent } from "./fileapi/FileAPIListContent";
import { FileAPIEditorDialog } from "./fileapi/FileAPIEditorDialog";
import { FilePreviewDialog, getFileMimeType } from "./FilePreviewDialog";

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function joinPath(base: string, name: string): string {
  return base.endsWith("/") ? `${base}${name}` : `${base}/${name}`;
}

function parentPath(path: string): string {
  if (path === "/") return "/";
  const parts = path.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.length <= 1 ? "/" : parts.join("/");
}

function pathSegments(path: string): { name: string; path: string }[] {
  const parts = path.split("/").filter(Boolean);
  const segments: { name: string; path: string }[] = [];
  let acc = "";
  for (const part of parts) {
    acc += "/" + part;
    segments.push({ name: part, path: acc });
  }
  return segments;
}

// ── 属性 ──────────────────────────────────────────────────────────────────────

interface FileAPIPanelProps {
  serverUuid: string;
  serverName?: string;
}

export interface FileAPIPanelHandle {
  disconnect: () => void;
}

// ── 状态图标 ──────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === "creating" || status === "waiting") {
    return <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />;
  }
  if (status === "error") {
    return <AlertCircle className="h-8 w-8 text-destructive" />;
  }
  return <WifiOff className="h-8 w-8 text-muted-foreground" />;
}

// ── 组件 ──────────────────────────────────────────────────────────────────────

export const FileAPIPanel = forwardRef<FileAPIPanelHandle, FileAPIPanelProps>(function FileAPIPanel({ serverUuid }, ref) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // 文件列表状态
  const [currentPath, setCurrentPath] = useState("/");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 对话框状态
  const [mkdirOpen, setMkdirOpen] = useState(false);
  const [mkdirName, setMkdirName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorFileName, setEditorFileName] = useState("");
  const [editorFilePath, setEditorFilePath] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorEncoding, setEditorEncoding] = useState("utf-8");
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);

  // 预览对话框状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewFilePath, setPreviewFilePath] = useState("");
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMimeType, setPreviewMimeType] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const connectedRef = useRef(false);

  // File API 连接
  const {
    status,
    errorMessage,
    uploadTasks,
    connect,
    disconnect,
    readdir,
    read,
    readBlob,
    write,
    upload,
    remove,
    rename,
    mkdir,
    rmdir,
    clearUploadTask,
  } = useFileAPIConnection({
    serverUuid,
    onReady: () => {
      connectedRef.current = true;
      setCurrentPath("/");
    },
    onError: (msg) => {
      toast.error(msg);
    },
    onClosed: (reason) => {
      connectedRef.current = false;
      toast.info(t("fileapi.toast.sessionClosed", { reason }));
    },
  });

  useImperativeHandle(ref, () => ({ disconnect }), [disconnect]);

  // 自动连接（cancelled 标志防止 StrictMode / 快速卸载的双重调用）
  useEffect(() => {
    if (!serverUuid) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      connect();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      disconnect();
    };
  }, [serverUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 当 currentPath 变化且已连接时加载文件列表
  useEffect(() => {
    if (status !== "connected" || !currentPath) return;
    loadFiles(currentPath);
  }, [currentPath, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFiles = useCallback(
    async (path: string) => {
      setIsLoading(true);
      try {
        const result = await readdir(path);
        result.sort((a, b) => {
          if (a.type === "dir" && b.type !== "dir") return -1;
          if (a.type !== "dir" && b.type === "dir") return 1;
          return a.name.localeCompare(b.name);
        });
        setEntries(result);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("fileapi.toast.loadFailed"),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [readdir, t],
  );

  const refresh = useCallback(() => {
    if (currentPath) loadFiles(currentPath);
  }, [currentPath, loadFiles]);

  // ── 导航 ────────────────────────────────────────────────────────────────────

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const navigateUp = useCallback(() => {
    setCurrentPath(parentPath(currentPath));
  }, [currentPath]);

  const handleEntryClick = useCallback(
    (entry: FileEntry) => {
      if (entry.type === "dir" || entry.type === "drive") {
        navigateTo(joinPath(currentPath, entry.name));
      }
    },
    [currentPath, navigateTo],
  );

  // ── 文件操作 ────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        try {
          await upload(currentPath, file);
          toast.success(t("fileapi.toast.uploadSuccess", { name: file.name }));
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : t("fileapi.toast.uploadFailed", { name: file.name }),
          );
        }
      }
      refresh();
    },
    [currentPath, upload, refresh, t],
  );

  const handleMkdir = useCallback(async () => {
    if (!mkdirName.trim()) return;
    try {
      await mkdir(joinPath(currentPath, mkdirName.trim()));
      toast.success(t("fileapi.toast.mkdirSuccess", { name: mkdirName.trim() }));
      setMkdirOpen(false);
      setMkdirName("");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("fileapi.toast.mkdirFailed"),
      );
    }
  }, [currentPath, mkdirName, mkdir, refresh, t]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const path = joinPath(currentPath, deleteTarget.name);
      if (deleteTarget.type === "dir") {
        await rmdir(path);
      } else {
        await remove(path);
      }
      toast.success(t("fileapi.toast.deleteSuccess", { name: deleteTarget.name }));
      setDeleteOpen(false);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("fileapi.toast.deleteFailed"),
      );
    }
  }, [currentPath, deleteTarget, remove, rmdir, refresh, t]);

  const handleRename = useCallback(async () => {
    if (!renameTarget || !renameName.trim()) return;
    try {
      const oldPath = joinPath(currentPath, renameTarget.name);
      const newPath = joinPath(currentPath, renameName.trim());
      await rename(oldPath, newPath);
      toast.success(t("fileapi.toast.renameSuccess"));
      setRenameOpen(false);
      setRenameTarget(null);
      setRenameName("");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("fileapi.toast.renameFailed"),
      );
    }
  }, [currentPath, renameTarget, renameName, rename, refresh, t]);

  const handleReconnect = useCallback(() => {
    connect();
  }, [connect]);

  const openRenameDialog = useCallback((entry: FileEntry) => {
    setRenameTarget(entry);
    setRenameName(entry.name);
    setRenameOpen(true);
  }, []);

  const openDeleteDialog = useCallback((entry: FileEntry) => {
    setDeleteTarget(entry);
    setDeleteOpen(true);
  }, []);

  const openMkdirDialog = useCallback(() => {
    setMkdirName("");
    setMkdirOpen(true);
  }, []);

  const openCreateFileDialog = useCallback(() => {
    setEditorMode("create");
    setEditorFileName("");
    setEditorFilePath(currentPath || "/");
    setEditorContent("");
    setEditorEncoding("utf-8");
    setEditorLoading(false);
    setEditorOpen(true);
  }, [currentPath]);

  const openEditFileDialog = useCallback(
    async (entry: FileEntry) => {
      if (entry.type !== "file") {
        toast.error(t("fileapi.toast.onlyFileEditable"));
        return;
      }
      const filePath = joinPath(currentPath, entry.name);
      setEditorMode("edit");
      setEditorFileName(entry.name);
      setEditorFilePath(filePath);
      setEditorContent("");
      setEditorEncoding("utf-8");
      setEditorLoading(true);
      setEditorOpen(true);

      try {
        const result = await read(filePath, "utf-8");
        setEditorContent(result.content);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("fileapi.toast.readFailed"),
        );
      } finally {
        setEditorLoading(false);
      }
    },
    [read, currentPath, t],
  );

  const openPreviewDialog = useCallback(
    async (entry: FileEntry) => {
      if (entry.type !== "file") return;
      const filePath = joinPath(currentPath, entry.name);
      const mime = getFileMimeType(entry.name);

      // 清理上次的 blob URL
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);

      setPreviewFileName(entry.name);
      setPreviewFilePath(filePath);
      setPreviewMimeType(mime);
      setPreviewBlobUrl(null);
      setPreviewLoading(true);
      setPreviewOpen(true);

      try {
        const blob = await readBlob(filePath);
        const url = URL.createObjectURL(blob);
        setPreviewBlobUrl(url);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("fileapi.preview.loadFailed"),
        );
      } finally {
        setPreviewLoading(false);
      }
    },
    [currentPath, readBlob, previewBlobUrl, t],
  );

  const handlePreviewClose = useCallback(
    (open: boolean) => {
      setPreviewOpen(open);
      if (!open && previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
    },
    [previewBlobUrl],
  );

  const handleDownload = useCallback(
    async (entry: FileEntry) => {
      if (entry.type !== "file") return;
      const filePath = joinPath(currentPath, entry.name);
      try {
        toast.info(t("fileapi.toast.downloading", { name: entry.name }));
        const blob = await readBlob(filePath);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = entry.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t("fileapi.toast.downloadSuccess", { name: entry.name }));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("fileapi.toast.downloadFailed"),
        );
      }
    },
    [currentPath, readBlob, t],
  );

  const handleSaveEditor = useCallback(async () => {
    const name = editorFileName.trim();
    if (!name) {
      toast.error(t("fileapi.toast.fileNameRequired"));
      return;
    }

    const filePath = joinPath(currentPath, name);
    setEditorSaving(true);
    try {
      await write(filePath, editorContent, editorEncoding);
      toast.success(
        t(
          editorMode === "create"
            ? "fileapi.toast.createFileSuccess"
            : "fileapi.toast.saveSuccess",
          { name },
        ),
      );
      setEditorOpen(false);
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("fileapi.toast.saveFailed"),
      );
    } finally {
      setEditorSaving(false);
    }
  }, [currentPath, editorContent, editorEncoding, editorFileName, editorMode, refresh, t, write]);

  const handleEditorEncodingChange = useCallback(
    async (newEncoding: string) => {
      setEditorEncoding(newEncoding);
      if (editorMode === "edit" && editorFilePath) {
        setEditorLoading(true);
        try {
          const result = await read(editorFilePath, newEncoding);
          setEditorContent(result.content);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : t("fileapi.toast.readFailed"),
          );
        } finally {
          setEditorLoading(false);
        }
      }
    },
    [read, editorFilePath, editorMode, t],
  );

  // ── 渲染 ────────────────────────────────────────────────────────────────────

  // 未连接/初始化中
  if (status !== "connected") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-3">
            <StatusIcon status={status} />
            <p className="text-sm text-muted-foreground">
              {status === "error" ? errorMessage : t(`fileapi.status.${status}`)}
            </p>
            {(status === "closed" || status === "error") && (
              <Button size="sm" variant="outline" onClick={handleReconnect}>
                {t("fileapi.reconnect")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto text-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => navigateTo("/")}
          >
            <Home className="h-3.5 w-3.5" />
          </Button>

          {currentPath !== "/" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={navigateUp}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
          )}

          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          {pathSegments(currentPath).map((seg, i, arr) => (
            <span key={seg.path} className="flex items-center gap-1 shrink-0">
              {i < arr.length - 1 ? (
                <>
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => navigateTo(seg.path)}
                  >
                    {seg.name}
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </>
              ) : (
                <span className="font-medium">{seg.name}</span>
              )}
            </span>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={refresh}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.refresh")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={openMkdirDialog}
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("fileapi.actions.mkdir")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={openCreateFileDialog}
              >
                <FilePlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("fileapi.actions.newFile")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("fileapi.actions.upload")}</TooltipContent>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* 上传进度 */}
      {uploadTasks.length > 0 && (
        <div className="border-b px-3 py-2 space-y-2">
          {uploadTasks.map((task) => (
            <div
              key={task.requestId}
              className="flex items-center gap-2 text-xs"
            >
              {task.status === "uploading" && (
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              )}
              {task.status === "done" && (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              )}
              {task.status === "error" && (
                <AlertCircle className="h-3 w-3 text-destructive" />
              )}

              <span className="truncate flex-1">{task.fileName}</span>

              {task.status === "uploading" && (
                <div className="flex items-center gap-2 w-32">
                  <Progress
                    value={task.received}
                    max={task.total}
                    className="h-1.5"
                  />
                  <span className="text-muted-foreground w-10 text-right">
                    {Math.round((task.received / task.total) * 100)}%
                  </span>
                </div>
              )}

              {task.status !== "uploading" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => clearUploadTask(task.requestId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 文件列表 */}
      {isMobile ? (
        <div className="flex-1 overflow-auto">
          <FileAPIListContent
            entries={entries}
            isLoading={isLoading}
            isMobile={true}
            onEntryClick={handleEntryClick}
            onEdit={openEditFileDialog}
            onView={openPreviewDialog}
            onDownload={handleDownload}
            onRename={openRenameDialog}
            onDelete={openDeleteDialog}
            t={t}
          />
        </div>
      ) : (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex-1 overflow-auto">
              <FileAPIListContent
                entries={entries}
                isLoading={isLoading}
                isMobile={false}
                onEntryClick={handleEntryClick}
                onEdit={openEditFileDialog}
                onView={openPreviewDialog}
                onDownload={handleDownload}
                onRename={openRenameDialog}
                onDelete={openDeleteDialog}
                t={t}
              />
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("common.refresh")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={openMkdirDialog}>
              <FolderPlus className="mr-2 h-4 w-4" />
              {t("fileapi.actions.mkdir")}
            </ContextMenuItem>
            <ContextMenuItem onClick={openCreateFileDialog}>
              <FilePlus className="mr-2 h-4 w-4" />
              {t("fileapi.actions.newFile")}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {t("fileapi.actions.upload")}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}

      {/* 底栏 */}
      <div className="flex items-center justify-between border-t px-3 py-1.5 text-xs text-muted-foreground">
        <span className="truncate">{currentPath}</span>
        <span className="shrink-0">
          {t("fileapi.itemCount", { count: entries.length })}
        </span>
      </div>

      {/* 创建目录对话框 */}
      <Dialog open={mkdirOpen} onOpenChange={setMkdirOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("fileapi.mkdir.title")}</DialogTitle>
            <DialogDescription>{t("fileapi.mkdir.description")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleMkdir();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="mkdir-name">{t("fileapi.mkdir.name")}</Label>
              <Input
                id="mkdir-name"
                value={mkdirName}
                onChange={(e) => setMkdirName(e.target.value)}
                placeholder={t("fileapi.mkdir.placeholder")}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMkdirOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!mkdirName.trim()}>
                {t("common.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 重命名对话框 */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("fileapi.rename.title")}</DialogTitle>
            <DialogDescription>
              {t("fileapi.rename.description", { name: renameTarget?.name })}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="rename-name">{t("fileapi.rename.newName")}</Label>
              <Input
                id="rename-name"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!renameName.trim()}>
                {t("fileapi.rename.confirm")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "dir"
                ? t("fileapi.delete.descriptionDir", { name: deleteTarget?.name })
                : t("fileapi.delete.descriptionFile", { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 文件编辑器 */}
      <FileAPIEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        mode={editorMode}
        fileName={editorFileName}
        onFileNameChange={setEditorFileName}
        filePath={editorFilePath}
        content={editorContent}
        encoding={editorEncoding}
        onContentChange={setEditorContent}
        onEncodingChange={handleEditorEncodingChange}
        loading={editorLoading}
        saving={editorSaving}
        onSave={handleSaveEditor}
      />

      <FilePreviewDialog
        open={previewOpen}
        fileName={previewFileName}
        filePath={previewFilePath}
        blobUrl={previewBlobUrl}
        loading={previewLoading}
        mimeType={previewMimeType}
        onOpenChange={handlePreviewClose}
        onDownload={() => {
          if (previewBlobUrl) {
            const a = document.createElement("a");
            a.href = previewBlobUrl;
            a.download = previewFileName;
            a.click();
          }
        }}
      />
    </div>
  );
});
