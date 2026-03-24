import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useConfigList } from "@/services/config";
import { useCreateServer } from "@/services/servers";
import { useAuthStore } from "@/store/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InstallOptions {
  url: string;
  regToken?: string;
  token?: string;
  name?: string;
  interval?: number;
  enableSsh?: boolean;
  setupCa?: boolean;
  force?: boolean;
  installDir?: string;
  configDir?: string;
  version?: string;
}

type Downloader = "wget" | "curl";

// ── Command Builder ───────────────────────────────────────────────────────────

const SCRIPT_URL =
  "https://raw.githubusercontent.com/collei-monitor/collei-agent/main/install.sh";

function buildInstallCommand(opts: InstallOptions, dl: Downloader = "wget"): string {
  const args: string[] = [];

  args.push(`--url ${opts.url}`);

  if (opts.regToken) {
    args.push(`--reg-token ${opts.regToken}`);
  } else if (opts.token) {
    args.push(`--token ${opts.token}`);
  }

  if (opts.name) {
    const val = opts.name.includes(" ") ? `'${opts.name}'` : opts.name;
    args.push(`--name ${val}`);
  }
  if (opts.interval && opts.interval !== 2) {
    args.push(`--interval ${opts.interval}`);
  }

  if (opts.enableSsh) args.push("--enable-ssh");
  if (opts.setupCa) args.push("--setup-ca");
  if (opts.force) args.push("--force");

  if (opts.installDir) args.push(`--install-dir ${opts.installDir}`);
  if (opts.configDir) args.push(`--config-dir ${opts.configDir}`);
  if (opts.version && opts.version !== "latest") {
    args.push(`--version ${opts.version}`);
  }

  const paramStr = args.join(" \\\n  ");

  if (dl === "wget") {
    return `wget -O- ${SCRIPT_URL} | bash -s -- \\\n  ${paramStr}`;
  }
  return `curl -sfL ${SCRIPT_URL} | bash -s -- \\\n  ${paramStr}`;
}

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
  const [interval, setInterval] = useState(2);
  const [enableSsh, setEnableSsh] = useState(false);
  const [setupCa, setSetupCa] = useState(false);
  const [force, setForce] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [installDir, setInstallDir] = useState("");
  const [configDir, setConfigDir] = useState("");
  const [version, setVersion] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // 被动注册结果
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const agentUrl = configMap?.agent_url || user?.agent_url || "";
  const apiUrl = agentUrl || configMap?.api_base_url || window.location.origin;
  const regToken = configMap?.global_registration_token || "";

  // ── Validation ────────────────────────────────────────────────────────────
  const validationError = useMemo(() => {
    if (autoRegister || isPassiveMode) {
      if (!regToken && autoRegister && !isPassiveMode) {
        return t("admin.nodes.install.error.noRegToken");
      }
      if (setupCa && !enableSsh) {
        return t("admin.nodes.install.error.caRequiresSsh");
      }
      if (interval <= 0) {
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
  }, [autoRegister, isPassiveMode, regToken, setupCa, enableSsh, interval, name, t]);

  // 获取当前 token 值
  const activeToken = isPassiveMode ? serverToken! : createdToken;

  // ── Build command ─────────────────────────────────────────────────────────
  const command = useMemo(() => {
    if (!autoRegister && !isPassiveMode) return null; // 被动模式未创建时无命令

    if (autoRegister && !isPassiveMode) {
      // 自动注册模式
      return buildInstallCommand(
        {
          url: apiUrl,
          regToken,
          name: name || undefined,
          interval,
          enableSsh,
          setupCa,
          force,
          installDir: installDir || undefined,
          configDir: configDir || undefined,
          version: version || undefined,
        },
        downloader,
      );
    }

    // 被动注册模式（有 serverToken 或已创建）
    if (!activeToken) return null;
    return buildInstallCommand(
      {
        url: apiUrl,
        token: activeToken,
        name: name || undefined,
        interval,
        enableSsh,
        setupCa,
        force,
        installDir: installDir || undefined,
        configDir: configDir || undefined,
        version: version || undefined,
      },
      downloader,
    );
  }, [
    autoRegister, isPassiveMode, apiUrl, regToken, activeToken, name,
    interval, enableSsh, setupCa, force, installDir, configDir, version, downloader,
  ]);

  const handleCopy = () => {
    if (!command) return;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── 被动注册：创建服务器 ───────────────────────────────────────────────────
  const handleCreateServer = () => {
    if (!name.trim()) return;
    const toastId = toast.loading(t("admin.nodes.install.creating"));
    createServer.mutate(
      { name: name.trim(), remark: remark.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("admin.nodes.install.createSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("admin.nodes.install.createFailed"), { id: toastId });
        },
      },
    );
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return "••••••••";
    return token.slice(0, 4) + "••••••••" + token.slice(-4);
  };

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

            {/* 自动注册模式 */}
            {(autoRegister || isPassiveMode) && (
              <div className="space-y-4">
                {/* 名称 */}
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

                {/* Token 显示 */}
                {autoRegister && !isPassiveMode && regToken && (
                  <div className="space-y-2">
                    <Label>{t("admin.nodes.install.regTokenLabel")}</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono break-all">
                        {showToken ? regToken : maskToken(regToken)}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setShowToken((v) => !v)}
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {isPassiveMode && serverToken && (
                  <div className="space-y-2">
                    <Label>{t("admin.nodes.install.serverTokenLabel")}</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono break-all">
                        {showToken ? serverToken : maskToken(serverToken)}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setShowToken((v) => !v)}
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 可选参数 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="install-interval">
                      {t("admin.nodes.install.interval")}
                    </Label>
                    <Input
                      id="install-interval"
                      type="number"
                      min={1}
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* 开关参数 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="install-ssh"
                      checked={enableSsh}
                      onCheckedChange={(v) => {
                        setEnableSsh(!!v);
                        if (!v) setSetupCa(false);
                      }}
                    />
                    <Label htmlFor="install-ssh" className="text-sm cursor-pointer">
                      {t("admin.nodes.install.enableSsh")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="install-ca"
                      checked={setupCa}
                      disabled={!enableSsh}
                      onCheckedChange={(v) => setSetupCa(!!v)}
                    />
                    <Label
                      htmlFor="install-ca"
                      className={`text-sm cursor-pointer ${!enableSsh ? "text-muted-foreground" : ""}`}
                    >
                      {t("admin.nodes.install.setupCa")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="install-force"
                      checked={force}
                      onCheckedChange={(v) => setForce(!!v)}
                    />
                    <Label htmlFor="install-force" className="text-sm cursor-pointer">
                      {t("admin.nodes.install.force")}
                    </Label>
                  </div>
                </div>

                {/* 高级参数 */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-0 text-muted-foreground">
                      {showAdvanced
                        ? t("admin.nodes.install.hideAdvanced")
                        : t("admin.nodes.install.showAdvanced")}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="install-dir">
                        {t("admin.nodes.install.installDir")}
                      </Label>
                      <Input
                        id="install-dir"
                        value={installDir}
                        onChange={(e) => setInstallDir(e.target.value)}
                        placeholder={t("admin.nodes.install.installDirPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="config-dir">
                        {t("admin.nodes.install.configDir")}
                      </Label>
                      <Input
                        id="config-dir"
                        value={configDir}
                        onChange={(e) => setConfigDir(e.target.value)}
                        placeholder={t("admin.nodes.install.configDirPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="install-version">
                        {t("admin.nodes.install.version")}
                      </Label>
                      <Input
                        id="install-version"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="latest"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* 验证错误 */}
                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}

                {/* 命令展示 */}
                {command && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("admin.nodes.install.command")}</Label>
                      <div className="flex items-center gap-1">
                        <Tabs
                          value={downloader}
                          onValueChange={(v) => setDownloader(v as Downloader)}
                        >
                          <TabsList className="h-7">
                            <TabsTrigger value="wget" className="text-xs px-2 h-6">
                              wget
                            </TabsTrigger>
                            <TabsTrigger value="curl" className="text-xs px-2 h-6">
                              curl
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>
                    <div className="relative">
                      <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                        {command}
                      </pre>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.nodes.install.hint")}
                    </p>
                    {setupCa && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {t("admin.nodes.install.caHint")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 被动注册模式（取消勾选自动注册 & 非 serverToken 模式） */}
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

                {/* 创建成功后显示命令 */}
                {createdToken && (
                  <div className="space-y-4">
                    {/* 可选参数 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passive-interval">
                          {t("admin.nodes.install.interval")}
                        </Label>
                        <Input
                          id="passive-interval"
                          type="number"
                          min={1}
                          value={interval}
                          onChange={(e) => setInterval(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="passive-ssh"
                          checked={enableSsh}
                          onCheckedChange={(v) => {
                            setEnableSsh(!!v);
                            if (!v) setSetupCa(false);
                          }}
                        />
                        <Label htmlFor="passive-ssh" className="text-sm cursor-pointer">
                          {t("admin.nodes.install.enableSsh")}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="passive-ca"
                          checked={setupCa}
                          disabled={!enableSsh}
                          onCheckedChange={(v) => setSetupCa(!!v)}
                        />
                        <Label
                          htmlFor="passive-ca"
                          className={`text-sm cursor-pointer ${!enableSsh ? "text-muted-foreground" : ""}`}
                        >
                          {t("admin.nodes.install.setupCa")}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="passive-force"
                          checked={force}
                          onCheckedChange={(v) => setForce(!!v)}
                        />
                        <Label htmlFor="passive-force" className="text-sm cursor-pointer">
                          {t("admin.nodes.install.force")}
                        </Label>
                      </div>
                    </div>

                    {/* 命令展示 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{t("admin.nodes.install.command")}</Label>
                        <Tabs
                          value={downloader}
                          onValueChange={(v) => setDownloader(v as Downloader)}
                        >
                          <TabsList className="h-7">
                            <TabsTrigger value="wget" className="text-xs px-2 h-6">
                              wget
                            </TabsTrigger>
                            <TabsTrigger value="curl" className="text-xs px-2 h-6">
                              curl
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      <div className="relative">
                        <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                          {buildInstallCommand(
                            {
                              url: apiUrl,
                              token: createdToken,
                              name: name || undefined,
                              interval,
                              enableSsh,
                              setupCa,
                              force,
                            },
                            downloader,
                          )}
                        </pre>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              buildInstallCommand(
                                {
                                  url: apiUrl,
                                  token: createdToken,
                                  name: name || undefined,
                                  interval,
                                  enableSsh,
                                  setupCa,
                                  force,
                                },
                                downloader,
                              ),
                            );
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("admin.nodes.install.hint")}
                      </p>
                    </div>
                  </div>
                )}

                {validationError && (
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
                ? t("admin.nodes.install.creating")
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
