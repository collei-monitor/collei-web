import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  TriangleAlert,
  FlaskConical,
  Save,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailableIpDbs, useTestIpDb } from "@/services/config";

export function IpDbSection({
  currentDb,
  disputedEnabled,
  onSave,
  onToggleDisputed,
  saving,
  disputedSaving,
}: {
  currentDb: string | null | undefined;
  disputedEnabled: boolean;
  onSave: (key: string, value: string) => void;
  onToggleDisputed: (enable: boolean) => void;
  saving: boolean;
  disputedSaving: boolean;
}) {
  const { t } = useTranslation();
  const { data: availableDbs, isLoading: loadingDbs } = useAvailableIpDbs();
  const testMutation = useTestIpDb();

  const [selectedDb, setSelectedDb] = useState(currentDb ?? "");
  const [testIp, setTestIp] = useState("");
  const [testResult, setTestResult] = useState<{
    region_code: string | null;
    db_name: string;
  } | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const isDirty = selectedDb !== (currentDb ?? "");

  const handleTest = async () => {
    if (!selectedDb || !testIp.trim()) return;
    const tid = toast.loading(t("settings.ipDb.testing"));
    try {
      const result = await testMutation.mutateAsync({
        db_name: selectedDb,
        ip: testIp.trim(),
      });
      setTestResult({ region_code: result.region_code, db_name: result.db_name });
      toast.dismiss(tid);
      toast.success(t("settings.ipDb.testSuccess"), {
        description: result.region_code
          ? t("settings.ipDb.testResultDesc", {
              ip: result.ip,
              code: result.region_code,
            })
          : t("settings.ipDb.testNotFound"),
      });
    } catch {
      toast.dismiss(tid);
      toast.error(t("settings.ipDb.testFailed"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("settings.ipDb.current")}</Label>
        <div className="flex gap-2 items-center">
          {loadingDbs ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <Select
              value={selectedDb}
              onValueChange={setSelectedDb}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("settings.ipDb.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {availableDbs?.map((db) => (
                  <SelectItem key={db} value={db}>
                    {db}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="sm"
            disabled={!isDirty || saving || !selectedDb}
            onClick={() => onSave("ip_db", selectedDb)}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="ml-1.5">{t("settings.action.save")}</span>
          </Button>
        </div>
        {availableDbs && availableDbs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("settings.ipDb.noDbAvailable")}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>{t("settings.ipDb.testTitle")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("settings.ipDb.testDesc")}
        </p>
        <div className="flex gap-2">
          <Input
            placeholder={t("settings.ipDb.testIpPlaceholder")}
            value={testIp}
            onChange={(e) => setTestIp(e.target.value)}
            className="max-w-xs"
            onKeyDown={(e) => e.key === "Enter" && handleTest()}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!selectedDb || !testIp.trim() || testMutation.isPending}
            onClick={handleTest}
          >
            {testMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4" />
            )}
            <span className="ml-1.5">{t("settings.ipDb.testButton")}</span>
          </Button>
        </div>
        {testResult && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("settings.ipDb.result")}</span>
            {testResult.region_code ? (
              <Badge variant="secondary">{testResult.region_code}</Badge>
            ) : (
              <Badge variant="outline">{t("settings.ipDb.resultNull")}</Badge>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* ── 争议地区合并 ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm flex items-center gap-1.5">
              <TriangleAlert className="h-3.5 w-3.5 text-destructive" />
              {t("settings.ipDb.disputedTitle")}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("settings.ipDb.disputedDesc")}
            </p>
          </div>
          {disputedEnabled ? (
            <div className="flex items-center gap-2">
              <Badge>{t("settings.ipDb.disputedActive")}</Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={disputedSaving}
                onClick={() => onToggleDisputed(false)}
              >
                {disputedSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                ) : null}
                {t("settings.ipDb.disputedDisable")}
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              disabled={disputedSaving}
              onClick={() => setConfirmOpen(true)}
            >
              {disputedSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <TriangleAlert className="h-4 w-4 mr-1.5" />
              )}
              {t("settings.ipDb.disputedEnable")}
            </Button>
          )}
        </div>

        {disputedEnabled && (
          <Alert>
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>
              {t("settings.ipDb.disputedActiveHint")}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* ── 开启确认对话框 ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              {t("settings.ipDb.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{t("settings.ipDb.confirmDesc")}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("settings.ipDb.confirmCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onToggleDisputed(true);
              }}
            >
              {t("settings.ipDb.confirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}