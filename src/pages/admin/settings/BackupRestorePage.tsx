import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  Loader2,
  Clock,
  Eye,
  EyeOff,
  Info,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  useRestoreStatus,
  useDownloadBackup,
  useUploadRestore,
  useCancelRestore,
} from "@/services/backup";

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export default function BackupRestorePage() {
  const { t } = useTranslation();

  // ── Backup state ──
  const [backupPassword, setBackupPassword] = useState("");
  const [backupPasswordVisible, setBackupPasswordVisible] = useState(false);
  const [excludeMonitoring, setExcludeMonitoring] = useState(false);

  // ── Restore state ──
  const [restorePassword, setRestorePassword] = useState("");
  const [restorePasswordVisible, setRestorePasswordVisible] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Queries & Mutations ──
  const { data: restoreStatus } = useRestoreStatus();
  const downloadBackup = useDownloadBackup();
  const uploadRestore = useUploadRestore();
  const cancelRestore = useCancelRestore();

  const handleDownload = () => {
    if (backupPassword.length < 8) {
      toast.error(t("settings.backup.passwordTooShort"));
      return;
    }

    downloadBackup.mutate(
      { password: backupPassword, excludeMonitoring },
      {
        onSuccess: (blob) => {
          const ts = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, 19);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `collei-backup-${ts}.collei-backup`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(t("settings.backup.downloadSuccess"));
          setBackupPassword("");
        },
        onError: (err) => {
          const status = (err as { status?: number })?.status;
          if (status === 422) {
            toast.error(t("settings.backup.passwordTooShort"));
          } else {
            toast.error(t("settings.backup.downloadFailed"));
          }
        },
      },
    );
  };

  const handleRestore = () => {
    if (!restoreFile) {
      toast.error(t("settings.backup.noFileSelected"));
      return;
    }
    if (!restorePassword) {
      toast.error(t("settings.backup.passwordRequired"));
      return;
    }

    uploadRestore.mutate(
      { file: restoreFile, password: restorePassword },
      {
        onSuccess: () => {
          toast.success(t("settings.backup.restoreUploaded"));
          setRestoreFile(null);
          setRestorePassword("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onError: (err) => {
          const status = (err as { status?: number })?.status;
          if (status === 400) {
            toast.error(t("settings.backup.restoreInvalid"));
          } else if (status === 409) {
            toast.error(t("settings.backup.restoreConflict"));
          } else if (status === 413) {
            toast.error(t("settings.backup.restoreTooLarge"));
          } else {
            toast.error(t("settings.backup.restoreFailed"));
          }
        },
      },
    );
  };

  const handleCancelRestore = () => {
    cancelRestore.mutate(undefined, {
      onSuccess: () => toast.success(t("settings.backup.cancelSuccess")),
      onError: () => toast.error(t("settings.backup.cancelFailed")),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.backup.pageTitle")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("settings.backup.pageSubtitle")}
        </p>
      </div>

      {/* ── 待恢复状态提示 ── */}
      {restoreStatus?.pending && restoreStatus.backup_meta && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("settings.backup.pendingTitle")}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{t("settings.backup.pendingDesc")}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                v{restoreStatus.backup_meta.collei_version}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {formatTimestamp(restoreStatus.backup_meta.created_at)}
              </Badge>
              <Badge variant="outline">
                {restoreStatus.backup_meta.files.length}{" "}
                {t("settings.backup.files")}
              </Badge>
            </div>
            <div className="pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t("settings.backup.cancelRestore")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("settings.backup.cancelConfirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("settings.backup.cancelConfirmDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelRestore}
                      disabled={cancelRestore.isPending}
                    >
                      {cancelRestore.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      {t("common.confirmDelete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ── 创建备份 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            {t("settings.backup.createTitle")}
          </CardTitle>
          <CardDescription>{t("settings.backup.createDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-password">
              {t("settings.backup.encryptPassword")}
            </Label>
            <div className="relative">
              <Input
                id="backup-password"
                type={backupPasswordVisible ? "text" : "password"}
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                placeholder={t("settings.backup.passwordPlaceholder")}
                className="pr-10 [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setBackupPasswordVisible(!backupPasswordVisible)}
              >
                {backupPasswordVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.backup.passwordHint")}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="exclude-monitoring"
              checked={excludeMonitoring}
              onCheckedChange={(checked) =>
                setExcludeMonitoring(checked === true)
              }
            />
            <Label
              htmlFor="exclude-monitoring"
              className="text-sm font-normal cursor-pointer"
            >
              {t("settings.backup.excludeMonitoring")}
            </Label>
          </div>
          {excludeMonitoring && (
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              {t("settings.backup.excludeMonitoringHint")}
            </p>
          )}

          <Separator />

          <Button
            onClick={handleDownload}
            disabled={downloadBackup.isPending || backupPassword.length < 8}
          >
            {downloadBackup.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {downloadBackup.isPending
              ? t("settings.backup.downloading")
              : t("settings.backup.downloadButton")}
          </Button>
        </CardContent>
      </Card>

      {/* ── 恢复备份 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            {t("settings.backup.restoreTitle")}
          </CardTitle>
          <CardDescription>{t("settings.backup.restoreDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restore-file">
              {t("settings.backup.selectFile")}
            </Label>
            <Input
              ref={fileInputRef}
              id="restore-file"
              type="file"
              accept=".collei-backup"
              onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restore-password">
              {t("settings.backup.decryptPassword")}
            </Label>
            <div className="relative">
              <Input
                id="restore-password"
                type={restorePasswordVisible ? "text" : "password"}
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                placeholder={t("settings.backup.decryptPasswordPlaceholder")}
                className="pr-10 [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() =>
                  setRestorePasswordVisible(!restorePasswordVisible)
                }
              >
                {restorePasswordVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={
                  !restoreFile ||
                  !restorePassword ||
                  uploadRestore.isPending ||
                  restoreStatus?.pending
                }
              >
                {uploadRestore.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploadRestore.isPending
                  ? t("settings.backup.uploading")
                  : t("settings.backup.restoreButton")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("settings.backup.restoreConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.backup.restoreConfirmDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestore}>
                  {t("settings.backup.restoreConfirmButton")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
