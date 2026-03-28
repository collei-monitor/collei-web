import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfigList } from "@/services/config";
import { useCreateServer } from "@/services/servers";
import { useAuthStore } from "@/store/auth";
import {
  TokenDisplay,
  InstallOptionsForm,
  CommandPreview,
  buildInstallCommand,
  SCRIPT_URL,
} from "./install";
import type { Downloader, DownloadMode, InstallFormValues } from "./install";

// ── Component ─────────────────────────────────────────────────────────────────

export function InstallCommandDialog({
  open,
  onOpenChange,
  /** 被动注册模式：提供 server token */
  serverToken,
  /** 被动注册模式：提供 server name */
  serverName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverToken?: string | null;
  serverName?: string;
}) {
  const { t } = useTranslation();
  const { data: configMap } = useConfigList();
  const createServer = useCreateServer();
  const user = useAuthStore((s) => s.user);

  const isPassiveMode = !!serverToken;

  // ── Form state ────────────────────────────────────────────────────────────
  const [autoRegister, setAutoRegister] = useState(!isPassiveMode);
  const [downloader, setDownloader] = useState<Downloader>("wget");
  const [name, setName] = useState(serverName ?? "");
  const [remark, setRemark] = useState("");
  const [formValues, setFormValues] = useState<InstallFormValues>({
    interval: 2,
    enableSsh: false,
    setupCa: false,
    force: false,
    downloadMode: "github" as DownloadMode,
    installDir: "",
    configDir: "",
    version: "",
  });

  // 被动注册结果
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const apiUrl = user?.agent_url || window.location.origin;
  const regToken = configMap?.global_registration_token || "";

  // 面板中转可用性检查
  const agentBinaryUrl = configMap?.agent_url || "";
  // const agentScriptUrl = configMap?.agent_install_script_url || "";
  const proxyAvailable = !!agentBinaryUrl;
  const isProxyMode = formValues.downloadMode === "proxy";

  const handleFormChange = useCallback((patch: Partial<InstallFormValues>) => {
    setFormValues((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validationError = useMemo(() => {
    if (autoRegister || isPassiveMode) {
      if (!regToken && autoRegister && !isPassiveMode) {
        return t("admin.nodes.install.error.noRegToken");
      }
      if (formValues.setupCa && !formValues.enableSsh) {
        return t("admin.nodes.install.error.caRequiresSsh");
      }
      if (formValues.interval <= 0) {
        return t("admin.nodes.install.error.intervalPositive");
      }
      if (name && /['"\\]/.test(name)) {
        return t("admin.nodes.install.error.nameInvalid");
      }
    } else {
      if (!name.trim()) {
        return t("admin.nodes.install.error.nameRequired");
      }
    }
    return null;
  }, [autoRegister, isPassiveMode, regToken, formValues.setupCa, formValues.enableSsh, formValues.interval, name, t]);

  // 获取当前 token 值
  const activeToken = isPassiveMode ? serverToken! : createdToken;

  // ── 构建面板中转脚本 URL ────────────────────────────────────────────────────
  const proxyScriptUrl = useMemo(() => {
    if (!isProxyMode) return SCRIPT_URL;
    const tokenForUrl = autoRegister && !isPassiveMode ? regToken : activeToken;
    if (!tokenForUrl) return SCRIPT_URL;
    return `${apiUrl}/api/v1/agent/install-script?token=${tokenForUrl}`;
  }, [isProxyMode, autoRegister, isPassiveMode, regToken, activeToken, apiUrl]);

  // ── Build install options ─────────────────────────────────────────────────
  const makeInstallOpts = useCallback(
    (tokenKey: "regToken" | "token", tokenValue: string) => ({
      url: apiUrl,
      [tokenKey]: tokenValue,
      name: name || undefined,
      interval: formValues.interval,
      enableSsh: formValues.enableSsh,
      setupCa: formValues.setupCa,
      force: formValues.force,
      installDir: formValues.installDir || undefined,
      configDir: formValues.configDir || undefined,
      version: formValues.version || undefined,
      proxyDownload: isProxyMode || undefined,
    }),
    [apiUrl, name, formValues, isProxyMode],
  );

  // ── Build command ─────────────────────────────────────────────────────────
  const command = useMemo(() => {
    if (autoRegister || isPassiveMode) {
      if (autoRegister && !isPassiveMode) {
        return buildInstallCommand(makeInstallOpts("regToken", regToken), downloader, proxyScriptUrl);
      }
      if (!activeToken) return null;
      return buildInstallCommand(makeInstallOpts("token", activeToken), downloader, proxyScriptUrl);
    }
    // 被动模式（手动创建）
    if (!createdToken) return null;
    return buildInstallCommand(makeInstallOpts("token", createdToken), downloader, proxyScriptUrl);
  }, [autoRegister, isPassiveMode, regToken, activeToken, createdToken, downloader, proxyScriptUrl, makeInstallOpts]);

  // ── 被动注册：创建服务器 ───────────────────────────────────────────────────
  const handleCreateServer = () => {
    if (!name.trim()) return;
    const toastId = toast.loading(t("common.creating"));
    createServer.mutate(
      { name: name.trim(), remark: remark.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("admin.nodes.install.createSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("common.createFailed"), { id: toastId });
        },
      },
    );
  };

  // ── 共享的选项表单 + 命令预览 ──────────────────────────────────────────────
  const renderOptionsAndCommand = (idPrefix: string) => (
    <>
      <InstallOptionsForm
        values={formValues}
        onChange={handleFormChange}
        proxyAvailable={proxyAvailable}
        idPrefix={idPrefix}
      />

      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}

      {command && (
        <>
          <Label>{t("admin.nodes.install.command")}</Label>
          <CommandPreview
            command={command}
            downloader={downloader}
            onDownloaderChange={setDownloader}
            isProxyMode={isProxyMode}
            setupCa={formValues.setupCa}
          />
          <p className="text-xs text-muted-foreground">
            {t("admin.nodes.install.hint")}
          </p>
        </>
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.nodes.install.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.nodes.install.description")}
          </DialogDescription>
        </DialogHeader>

        {/* OS Tabs */}
        <Tabs defaultValue="linux">
          <TabsList className="w-full">
            <TabsTrigger value="linux" className="flex-1">Linux</TabsTrigger>
            <TabsTrigger value="windows" className="flex-1" disabled>
              Windows
            </TabsTrigger>
            <TabsTrigger value="macos" className="flex-1" disabled>
              macOS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="linux" className="space-y-4 mt-4">
            {/* 注册模式切换（仅在非已有 server token 时显示） */}
            {!isPassiveMode && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto-register"
                  checked={autoRegister}
                  onCheckedChange={(v) => {
                    setAutoRegister(!!v);
                    setCreatedToken(null);
                  }}
                />
                <Label htmlFor="auto-register" className="text-sm cursor-pointer">
                  {t("admin.nodes.install.autoRegister")}
                </Label>
              </div>
            )}

            {/* 自动注册 / 已有 serverToken 模式 */}
            {(autoRegister || isPassiveMode) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="install-name">
                    {t("admin.nodes.install.name")}
                  </Label>
                  <Input
                    id="install-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("admin.nodes.install.namePlaceholder")}
                  />
                </div>

                {autoRegister && !isPassiveMode && regToken && (
                  <TokenDisplay
                    label={t("admin.nodes.install.regTokenLabel")}
                    token={regToken}
                  />
                )}
                {isPassiveMode && serverToken && (
                  <TokenDisplay
                    label={t("admin.nodes.install.serverTokenLabel")}
                    token={serverToken}
                  />
                )}

                {renderOptionsAndCommand("install-")}
              </div>
            )}

            {/* 被动注册模式（手动创建服务器） */}
            {!autoRegister && !isPassiveMode && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("admin.nodes.install.passiveDesc")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="passive-name">
                    {t("admin.nodes.install.name")}
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="passive-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("admin.nodes.install.namePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passive-remark">
                    {t("admin.nodes.install.remark")}
                  </Label>
                  <Input
                    id="passive-remark"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder={t("admin.nodes.install.remarkPlaceholder")}
                  />
                </div>

                {createdToken && renderOptionsAndCommand("passive-")}

                {validationError && !createdToken && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="windows">
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("admin.nodes.install.comingSoon")}
            </p>
          </TabsContent>
          <TabsContent value="macos">
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("admin.nodes.install.comingSoon")}
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {!autoRegister && !isPassiveMode && !createdToken && (
            <Button
              onClick={handleCreateServer}
              disabled={!!validationError || createServer.isPending}
            >
              {createServer.isPending
                ? t("common.creating")
                : t("admin.nodes.install.createServer")}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("admin.nodes.install.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
