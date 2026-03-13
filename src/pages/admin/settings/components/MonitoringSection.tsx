import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "./NumberInput";
import type { ConfigBatchItem } from "@/services/config";

export function MonitoringSection({
  configs,
  onBatchSave,
  saving,
}: {
  configs: Record<string, string | null>;
  onBatchSave: (items: ConfigBatchItem[]) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();

  const [offlineThreshold, setOfflineThreshold] = useState(
    configs["offline_threshold_seconds"] ?? ""
  );
  const [offlineInterval, setOfflineInterval] = useState(
    configs["offline_check_interval"] ?? ""
  );
  const [loadRetain, setLoadRetain] = useState(
    configs["load_retain_seconds"] ?? ""
  );

  const isDirty =
    offlineThreshold !== (configs["offline_threshold_seconds"] ?? "") ||
    offlineInterval !== (configs["offline_check_interval"] ?? "") ||
    loadRetain !== (configs["load_retain_seconds"] ?? "");

  const isValid = (
    [offlineThreshold, offlineInterval, loadRetain] as string[]
  ).every((v) => v === "" || (!isNaN(Number(v)) && Number(v) > 0));

  const handleSave = () => {
    const items: ConfigBatchItem[] = [];
    if (offlineThreshold !== (configs["offline_threshold_seconds"] ?? "") && offlineThreshold) {
      items.push({ key: "offline_threshold_seconds", value: offlineThreshold });
    }
    if (offlineInterval !== (configs["offline_check_interval"] ?? "") && offlineInterval) {
      items.push({ key: "offline_check_interval", value: offlineInterval });
    }
    if (loadRetain !== (configs["load_retain_seconds"] ?? "") && loadRetain) {
      items.push({ key: "load_retain_seconds", value: loadRetain });
    }
    if (items.length > 0) onBatchSave(items);
  };

  return (
    <div className="space-y-3">
      <NumberInput
        id="offline_threshold_seconds"
        label={t("settings.monitoring.offlineThreshold")}
        description={t("settings.monitoring.offlineThresholdDesc")}
        unit={t("settings.monitoring.seconds")}
        min={1}
        value={offlineThreshold}
        onChange={setOfflineThreshold}
      />
      <NumberInput
        id="offline_check_interval"
        label={t("settings.monitoring.offlineInterval")}
        description={t("settings.monitoring.offlineIntervalDesc")}
        unit={t("settings.monitoring.seconds")}
        min={1}
        value={offlineInterval}
        onChange={setOfflineInterval}
      />
      <NumberInput
        id="load_retain_seconds"
        label={t("settings.monitoring.loadRetain")}
        description={t("settings.monitoring.loadRetainDesc")}
        unit={t("settings.monitoring.seconds")}
        min={1}
        value={loadRetain}
        onChange={setLoadRetain}
      />
      <div className="flex justify-end pt-2">
        <Button
          disabled={!isDirty || !isValid || saving}
          onClick={handleSave}
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-1.5">{t("settings.action.save")}</span>
        </Button>
      </div>
    </div>
  );
}
