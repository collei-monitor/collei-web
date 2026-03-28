import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { DownloadMode } from "./types";

export interface WindowsInstallFormValues {
  interval: number;
  enableTerminal: boolean;
  enableFileApi: boolean;
  force: boolean;
  noAutoUpdate: boolean;
  downloadMode: DownloadMode;
  installDir: string;
  configDir: string;
  version: string;
}

export function WindowsOptionsForm({
  values,
  onChange,
  idPrefix = "",
}: {
  values: WindowsInstallFormValues;
  onChange: (patch: Partial<WindowsInstallFormValues>) => void;
  idPrefix?: string;
}) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const id = (name: string) => `${idPrefix}win-${name}`;
  const isProxyMode = values.downloadMode === "proxy";

  return (
    <>
      {/* 上报间隔 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={id("interval")}>
            {t("admin.nodes.install.interval")}
          </Label>
          <Input
            id={id("interval")}
            type="number"
            min={1}
            value={values.interval}
            onChange={(e) => onChange({ interval: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* 开关参数 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={id("proxy")}
            checked={isProxyMode}
            onCheckedChange={(v) =>
              onChange({ downloadMode: v ? "proxy" : "github" })
            }
          />
          <Label htmlFor={id("proxy")} className="text-sm cursor-pointer">
            {t("admin.nodes.install.proxyDownload")}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={id("terminal")}
            checked={values.enableTerminal}
            onCheckedChange={(v) => onChange({ enableTerminal: !!v })}
          />
          <Label htmlFor={id("terminal")} className="text-sm cursor-pointer">
            {t("admin.nodes.install.win.enableTerminal")}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={id("file-api")}
            checked={values.enableFileApi}
            onCheckedChange={(v) => onChange({ enableFileApi: !!v })}
          />
          <Label htmlFor={id("file-api")} className="text-sm cursor-pointer">
            {t("admin.nodes.install.win.enableFileApi")}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={id("force")}
            checked={values.force}
            onCheckedChange={(v) => onChange({ force: !!v })}
          />
          <Label htmlFor={id("force")} className="text-sm cursor-pointer">
            {t("admin.nodes.install.force")}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={id("no-auto-update")}
            checked={values.noAutoUpdate}
            onCheckedChange={(v) => onChange({ noAutoUpdate: !!v })}
          />
          <Label htmlFor={id("no-auto-update")} className="text-sm cursor-pointer">
            {t("admin.nodes.install.noAutoUpdate")}
          </Label>
        </div>
      </div>

      {/* 高级参数 */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="px-0 text-muted-foreground"
          >
            {showAdvanced
              ? t("admin.nodes.install.hideAdvanced")
              : t("admin.nodes.install.showAdvanced")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor={id("install-dir")}>
              {t("admin.nodes.install.installDir")}
            </Label>
            <Input
              id={id("install-dir")}
              value={values.installDir}
              onChange={(e) => onChange({ installDir: e.target.value })}
              placeholder={t("admin.nodes.install.win.installDirPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id("config-dir")}>
              {t("admin.nodes.install.configDir")}
            </Label>
            <Input
              id={id("config-dir")}
              value={values.configDir}
              onChange={(e) => onChange({ configDir: e.target.value })}
              placeholder={t("admin.nodes.install.win.configDirPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id("version")}>
              {t("admin.nodes.install.version")}
            </Label>
            <Input
              id={id("version")}
              value={values.version}
              onChange={(e) => onChange({ version: e.target.value })}
              placeholder="latest"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
