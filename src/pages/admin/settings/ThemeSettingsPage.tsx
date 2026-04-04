import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Palette, Code } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useConfigList, useSetConfig } from "@/services/config";
import { ThemeManageSection } from "./components/ThemeManageSection";
import { ConfigSkeleton } from "./components/ConfigSkeleton";
import { TextareaConfigField } from "./components/TextareaConfigField";

export default function ThemeSettingsPage() {
  const { t } = useTranslation();
  const { data: configs, isLoading } = useConfigList();
  const setConfig = useSetConfig();

  const handleSave = (key: string, value: string) => {
    setConfig.mutate(
      { key, value },
      {
        onSuccess: () => toast.success(t("settings.toast.saveSuccess")),
        onError: (err) => {
          const status = (err as { status?: number })?.status;
          if (status === 409) toast.error(t("settings.toast.saveConflict"));
          else if (status === 422) toast.error(t("settings.toast.saveInvalid"));
          else toast.error(t("common.updateFailed"));
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.themes.pageTitle")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("settings.themes.pageSubtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            {t("settings.themes.title")}
          </CardTitle>
          <CardDescription>{t("settings.themes.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeManageSection />
        </CardContent>
      </Card>

      {/* ── 展示页自定义代码 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code className="h-4 w-4" />
            {t("settings.script.title")}
          </CardTitle>
          <CardDescription>{t("settings.script.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <>
              <ConfigSkeleton />
              <ConfigSkeleton />
            </>
          ) : (
            <>
              <TextareaConfigField
                configKey="custom_headers"
                label={t("settings.script.customHeaders")}
                description={t("settings.script.customHeadersDesc")}
                placeholder={t("settings.script.customHeadersPlaceholder")}
                currentValue={configs?.["custom_headers"]}
                onSave={handleSave}
                saving={
                  setConfig.isPending &&
                  setConfig.variables?.key === "custom_headers"
                }
              />
              <Separator />
              <TextareaConfigField
                configKey="custom_body"
                label={t("settings.script.customBody")}
                description={t("settings.script.customBodyDesc")}
                placeholder={t("settings.script.customBodyPlaceholder")}
                currentValue={configs?.["custom_body"]}
                onSave={handleSave}
                saving={
                  setConfig.isPending &&
                  setConfig.variables?.key === "custom_body"
                }
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
