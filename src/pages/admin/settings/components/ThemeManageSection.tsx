import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Trash2,
  RefreshCw,
  Check,
  Package,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useThemeList,
  useUploadTheme,
  useActivateTheme,
  useDeleteTheme,
  type ThemeInfo,
} from "@/services/config";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ThemeCard({
  theme,
  onActivate,
  onDelete,
  activating,
  deleting,
}: {
  theme: ThemeInfo;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  activating: boolean;
  deleting: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          {theme.is_builtin ? (
            <Layers className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{theme.name}</span>
            {theme.is_active && (
              <Badge variant="default" className="shrink-0">
                <Check className="mr-1 h-3 w-3" />
                {t("settings.themes.active")}
              </Badge>
            )}
            {theme.is_builtin && (
              <Badge variant="secondary" className="shrink-0">
                {t("settings.themes.builtin")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {theme.version && <span>v{theme.version}</span>}
            {theme.author && <span>· {theme.author}</span>}
            {!theme.is_builtin && theme.total_size > 0 && (
              <span>
                · {theme.file_count} {t("settings.themes.files")} ·{" "}
                {formatSize(theme.total_size)}
              </span>
            )}
          </div>
          {theme.description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {theme.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {!theme.is_active && (
          <Button
            size="sm"
            variant="outline"
            disabled={activating}
            onClick={() => onActivate(theme.id)}
          >
            {activating ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t("common.enable")}
          </Button>
        )}
        {!theme.is_builtin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={deleting}>
                {deleting ? (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                {t("common.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("settings.themes.deleteConfirm")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.themes.deleteConfirmDesc", {
                    name: theme.name,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(theme.id)}>
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

export function ThemeManageSection() {
  const { t } = useTranslation();
  const { data: themes, isLoading } = useThemeList();
  const uploadTheme = useUploadTheme();
  const activateTheme = useActivateTheme();
  const deleteTheme = useDeleteTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error(t("settings.themes.fileTooLarge"));
      return;
    }

    uploadTheme.mutate(file, {
      onSuccess: () => toast.success(t("settings.themes.uploadSuccess")),
      onError: (err) => {
        toast.error(t("settings.themes.uploadFailed"), {
          description: (err as Error).message,
        });
      },
    });

    if (fileRef.current) fileRef.current.value = "";
  };

  const handleActivate = (id: string) => {
    activateTheme.mutate(id, {
      onSuccess: () => toast.success(t("settings.themes.activateSuccess")),
      onError: (err) => {
        toast.error(t("settings.themes.activateFailed"), {
          description: (err as Error).message,
        });
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteTheme.mutate(id, {
      onSuccess: () => toast.success(t("settings.themes.deleteSuccess")),
      onError: (err) => {
        toast.error(t("settings.themes.deleteFailed"), {
          description: (err as Error).message,
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 主题列表 */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {themes?.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onActivate={handleActivate}
              onDelete={handleDelete}
              activating={
                activateTheme.isPending &&
                activateTheme.variables === theme.id
              }
              deleting={
                deleteTheme.isPending &&
                deleteTheme.variables === theme.id
              }
            />
          ))}
        </div>
      )}

      <Separator />

      {/* 上传区域 */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("settings.themes.uploadHint")}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="outline"
          disabled={uploadTheme.isPending}
          onClick={() => fileRef.current?.click()}
        >
          {uploadTheme.isPending ? (
            <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-4 w-4" />
          )}
          {t("settings.themes.upload")}
        </Button>
      </div>
    </div>
  );
}
