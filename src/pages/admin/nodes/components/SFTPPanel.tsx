/**
 * SFTP 文件管理面板
 * 桌面端右键菜单操作，手机端保留行内按钮
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSFTPConnection } from "@/hooks/use-sftp-connection";
import type { SFTPFileEntry, SFTPConnectionStatus } from "@/types/sftp";
import { AuthDialog } from "./AuthDialog";
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
} from "lucide-react";
import { toast } from "sonner";
import { SFTPFileListContent } from "./sftp/SFTPFileListContent";
import { SFTPEditorDialog } from "./sftp/SFTPEditorDialog";

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

interface SFTPPanelProps {
  serverUuid: string;
  serverName?: string;
}

export interface SFTPPanelHandle {
  disconnect: () => void;
}

// ── 组件 ──────────────────────────────────────────────────────────────────────

export const SFTPPanel = forwardRef<SFTPPanelHandle, SFTPPanelProps>(function SFTPPanel({ serverUuid }, ref) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // 文件列表状态
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<SFTPFileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [homeDir, setHomeDir] = useState("");

  // 对话框状态
  const [mkdirOpen, setMkdirOpen] = useState(false);
  const [mkdirName, setMkdirName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SFTPFileEntry | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SFTPFileEntry | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorFileName, setEditorFileName] = useState("");
  const [editorFilePath, setEditorFilePath] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const connectedRef = useRef(false);

  // SFTP 连接
  const {
    status,
    errorMessage,
    uploadTasks,
    connect,
    disconnect,
    sendAuth,
    ls,
    cat,
    write,
    download,
    upload,
    mkdir,
    rm,
    rename,
    clearUploadTask,
  } = useSFTPConnection({
    serverUuid,
    onReady: (dir) => {
      connectedRef.current = true;
      setHomeDir(dir);
      setCurrentPath(dir);
    },
    onAuthRequired: () => {
      // auth_required 状态由 status 驱动 AuthDialog
    },
    onError: (msg) => {
      toast.error(msg);
    },
    onClosed: (reason) => {
      connectedRef.current = false;
      toast.info(t("sftp.toast.sessionClosed", { reason }));
    },
  });

  useImperativeHandle(ref, () => ({ disconnect }), [disconnect]);

  // 自动连接（使用 ref 防止 StrictMode 双重调用）
  const sftpConnectedRef = useRef(false);
  useEffect(() => {
    if (!serverUuid || sftpConnectedRef.current) return;
    sftpConnectedRef.current = true;
    connect();
    return () => {
      sftpConnectedRef.current = false;
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
        const result = await ls(path);
        // 排序：目录在前，然后按名称
        result.sort((a, b) => {
          if (a.type === "dir" && b.type !== "dir") return -1;
          if (a.type !== "dir" && b.type === "dir") return 1;
          return a.name.localeCompare(b.name);
        });
        setEntries(result);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("sftp.toast.loadFailed"),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [ls, t],
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
    (entry: SFTPFileEntry) => {
      if (entry.type === "dir") {
        navigateTo(joinPath(currentPath, entry.name));
      }
    },
    [currentPath, navigateTo],
  );

  // ── 文件操作 ────────────────────────────────────────────────────────────────

  const handleDownload = useCallback(
    async (entry: SFTPFileEntry) => {
      if (entry.type === "dir") {
        toast.error(t("sftp.toast.cannotDownloadDir"));
        return;
      }
      try {
        toast.info(t("sftp.toast.downloading", { name: entry.name }));
        await download(joinPath(currentPath, entry.name));
        toast.success(t("sftp.toast.downloadSuccess", { name: entry.name }));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("sftp.toast.downloadFailed"),
        );
      }
    },
    [currentPath, download, t],
  );

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        try {
          await upload(currentPath, file);
          toast.success(t("sftp.toast.uploadSuccess", { name: file.name }));
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : t("sftp.toast.uploadFailed", { name: file.name }),
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
      toast.success(t("sftp.toast.mkdirSuccess", { name: mkdirName.trim() }));
      setMkdirOpen(false);
      setMkdirName("");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("sftp.toast.mkdirFailed"),
      );
    }
  }, [currentPath, mkdirName, mkdir, refresh, t]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const path = joinPath(currentPath, deleteTarget.name);
      await rm(path, deleteTarget.type === "dir");
      toast.success(t("sftp.toast.deleteSuccess", { name: deleteTarget.name }));
      setDeleteOpen(false);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("sftp.toast.deleteFailed"),
      );
    }
  }, [currentPath, deleteTarget, rm, refresh, t]);

  const handleRename = useCallback(async () => {
    if (!renameTarget || !renameName.trim()) return;
    try {
      const oldPath = joinPath(currentPath, renameTarget.name);
      const newPath = joinPath(currentPath, renameName.trim());
      await rename(oldPath, newPath);
      toast.success(t("sftp.toast.renameSuccess"));
      setRenameOpen(false);
      setRenameTarget(null);
      setRenameName("");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("sftp.toast.renameFailed"),
      );
    }
  }, [currentPath, renameTarget, renameName, rename, refresh, t]);

  const handleAuthSubmit = useCallback(
    (username: string, password: string) => {
      sendAuth(username, password);
    },
    [sendAuth],
  );

  const handleReconnect = useCallback(() => {
    connect();
  }, [connect]);

  const openRenameDialog = useCallback((entry: SFTPFileEntry) => {
    setRenameTarget(entry);
    setRenameName(entry.name);
    setRenameOpen(true);
  }, []);

  const openDeleteDialog = useCallback((entry: SFTPFileEntry) => {
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
    setEditorLoading(false);
    setEditorOpen(true);
  }, [currentPath]);

  const openEditFileDialog = useCallback(
    async (entry: SFTPFileEntry) => {
      if (entry.type !== "file") {
        toast.error(t("sftp.toast.onlyFileEditable"));
        return;
      }
      const filePath = joinPath(currentPath, entry.name);
      setEditorMode("edit");
      setEditorFileName(entry.name);
      setEditorFilePath(filePath);
      setEditorContent("");
      setEditorLoading(true);
      setEditorOpen(true);

      try {
        const result = await cat(filePath);
        setEditorContent(result.content);
      } catch (err: any) {
        if (err?.isBinary) {
          setEditorOpen(false);
          toast.warning(
            t("sftp.toast.binaryFile", { name: entry.name }),
          );
        } else {
          toast.error(
            err instanceof Error ? err.message : t("sftp.toast.readFailed"),
          );
        }
      } finally {
        setEditorLoading(false);
      }
    },
    [cat, currentPath, t],
  );

  const handleSaveEditor = useCallback(async () => {
    const name = editorFileName.trim();
    if (!name) {
      toast.error(t("sftp.toast.fileNameRequired"));
      return;
    }

    const filePath = joinPath(currentPath, name);
    setEditorSaving(true);
    try {
      await write(filePath, editorContent, "utf-8");
      toast.success(
        t(
          editorMode === "create"
            ? "sftp.toast.createFileSuccess"
            : "sftp.toast.saveSuccess",
          { name },
        ),
      );
      setEditorOpen(false);
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("sftp.toast.saveFailed"),
      );
    } finally {
      setEditorSaving(false);
    }
  }, [currentPath, editorContent, editorFileName, editorMode, refresh, t, write]);

  // ── 渲染 ────────────────────────────────────────────────────────────────────

  // 未连接/初始化中
  if (status !== "connected") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-3">
            <StatusIcon status={status} />
            <p className="text-sm text-muted-foreground">
              {status === "error" ? errorMessage : t(`sftp.status.${status}`)}
            </p>
            {(status === "closed" || status === "error") && (
              <Button size="sm" variant="outline" onClick={handleReconnect}>
                {t("sftp.reconnect")}
              </Button>
            )}
          </div>
        </div>

        <AuthDialog
          open={status === "auth_required"}
          onSubmit={handleAuthSubmit}
          onCancel={disconnect}
        />
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
            onClick={() => navigateTo(homeDir)}
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
                onClick={() => {
                  openMkdirDialog();
                }}
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("sftp.actions.mkdir")}</TooltipContent>
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
            <TooltipContent>{t("sftp.actions.newFile")}</TooltipContent>
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
            <TooltipContent>{t("sftp.actions.upload")}</TooltipContent>
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
          <SFTPFileListContent
            entries={entries}
            isLoading={isLoading}
            isMobile={true}
            onEntryClick={handleEntryClick}
            onEdit={openEditFileDialog}
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
              <SFTPFileListContent
                entries={entries}
                isLoading={isLoading}
                isMobile={false}
                onEntryClick={handleEntryClick}
                onEdit={openEditFileDialog}
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
              {t("sftp.actions.mkdir")}
            </ContextMenuItem>
            <ContextMenuItem onClick={openCreateFileDialog}>
              <FilePlus className="mr-2 h-4 w-4" />
              {t("sftp.actions.newFile")}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {t("sftp.actions.upload")}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}

      {/* 底栏 */}
      <div className="flex items-center justify-between border-t px-3 py-1.5 text-xs text-muted-foreground">
        <span className="truncate">{currentPath}</span>
        <span className="shrink-0">
          {t("sftp.itemCount", { count: entries.length })}
        </span>
      </div>

      {/* 创建目录对话框 */}
      <Dialog open={mkdirOpen} onOpenChange={setMkdirOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("sftp.mkdir.title")}</DialogTitle>
            <DialogDescription>{t("sftp.mkdir.description")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleMkdir();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="mkdir-name">{t("sftp.mkdir.name")}</Label>
              <Input
                id="mkdir-name"
                value={mkdirName}
                onChange={(e) => setMkdirName(e.target.value)}
                placeholder={t("sftp.mkdir.placeholder")}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMkdirOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!mkdirName.trim()}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 重命名对话框 */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("sftp.rename.title")}</DialogTitle>
            <DialogDescription>
              {t("sftp.rename.description", { name: renameTarget?.name })}
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
              <Label htmlFor="rename-name">{t("sftp.rename.newName")}</Label>
              <Input
                id="rename-name"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  !renameName.trim() || renameName === renameTarget?.name
                }
              >
                {t("sftp.rename.confirm")}
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
                ? t("sftp.delete.descriptionDir", { name: deleteTarget?.name })
                : t("sftp.delete.descriptionFile", {
                    name: deleteTarget?.name,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SFTPEditorDialog
        open={editorOpen}
        mode={editorMode}
        fileName={editorFileName}
        filePath={editorFilePath}
        content={editorContent}
        loading={editorLoading}
        saving={editorSaving}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditorSaving(false);
            setEditorLoading(false);
          }
        }}
        onFileNameChange={setEditorFileName}
        onContentChange={setEditorContent}
        onSave={handleSaveEditor}
      />

    </div>
  );
});

// ── 状态图标 ──────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: SFTPConnectionStatus }) {
  if (
    status === "creating" ||
    status === "waiting" ||
    status === "authenticating"
  ) {
    return <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />;
  }
  if (status === "error") {
    return <AlertCircle className="h-8 w-8 text-destructive" />;
  }
  return null;
}

