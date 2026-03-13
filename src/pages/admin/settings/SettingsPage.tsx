import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Settings, Database, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useConfigList,
  useSetConfig,
  useBatchSetConfig,
  type ConfigBatchItem,
} from "@/services/config";
import { ConfigSkeleton } from "./components/ConfigSkeleton";
import { TextConfigField } from "./components/TextConfigField";
import { MonitoringSection } from "./components/MonitoringSection";
import { IpDbSection } from "./components/IpDbSection";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: configs, isLoading } = useConfigList();
  const setConfig = useSetConfig();
  const batchSetConfig = useBatchSetConfig();

  const handleSave = (key: string, value: string) => {
    setConfig.mutate({ key, value }, {
      onSuccess: () => toast.success(t("settings.toast.saveSuccess")),
      onError: (err) => {
        const status = (err as { status?: number })?.status;
        if (status === 409) toast.error(t("settings.toast.saveConflict"));
        else if (status === 422) toast.error(t("settings.toast.saveInvalid"));
        else toast.error(t("settings.toast.saveFailed"));
      },
    });
  };

  const handleBatchSave = (items: ConfigBatchItem[]) => {
    batchSetConfig.mutate(items, {
      onSuccess: () => toast.success(t("settings.toast.saveSuccess")),
      onError: (err) => {
        const e = err as { status?: number; message?: string };
        if (e.status === 409) toast.error(t("settings.toast.saveConflict"));
        else if (e.status === 422) toast.error(t("settings.toast.saveInvalid"), { description: e.message });
        else toast.error(t("settings.toast.saveFailed"));
      },
    });
  };

  const handleToggleDisputed = (enable: boolean) => {
    handleSave("disputed_territory", enable ? "1" : "0");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* ── 基本设置 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            {t("settings.general.title")}
          </CardTitle>
          <CardDescription>{t("settings.general.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <>
              <ConfigSkeleton />
              <ConfigSkeleton />
            </>
          ) : (
            <>
              <TextConfigField
                configKey="app_name"
                label={t("settings.general.appName")}
                description={t("settings.general.appNameDesc")}
                placeholder="Collei Monitor"
                currentValue={configs?.["app_name"]}
                onSave={handleSave}
                saving={setConfig.isPending && setConfig.variables?.key === "app_name"}
              />
              <Separator />
              <TextConfigField
                configKey="global_registration_token"
                label={t("settings.general.regToken")}
                description={t("settings.general.regTokenDesc")}
                placeholder={t("settings.general.regTokenPlaceholder")}
                currentValue={configs?.["global_registration_token"]}
                generateRandom
                onSave={handleSave}
                saving={setConfig.isPending && setConfig.variables?.key === "global_registration_token"}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── 监控参数 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            {t("settings.monitoring.title")}
          </CardTitle>
          <CardDescription>{t("settings.monitoring.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <ConfigSkeleton />
              <ConfigSkeleton />
              <ConfigSkeleton />
            </div>
          ) : (
            <MonitoringSection
              configs={configs!}
              onBatchSave={handleBatchSave}
              saving={batchSetConfig.isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* ── IP 数据库 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            {t("settings.ipDb.title")}
          </CardTitle>
          <CardDescription>{t("settings.ipDb.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <ConfigSkeleton />
              <ConfigSkeleton />
            </div>
          ) : (
            <IpDbSection
              currentDb={configs?.["ip_db"]}
              disputedEnabled={configs?.["disputed_territory"] === "1"}
              onSave={handleSave}
              onToggleDisputed={handleToggleDisputed}
              saving={setConfig.isPending && setConfig.variables?.key === "ip_db"}
              disputedSaving={setConfig.isPending && setConfig.variables?.key === "disputed_territory"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
