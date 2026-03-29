import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SCRIPT_URL, WIN_SCRIPT_URL } from "./types";
import type { Downloader } from "./types";

function buildLinuxUninstallCommand(dl: Downloader): string {
  if (dl === "wget") {
    return `wget -qO- ${SCRIPT_URL} | bash -s -- uninstall`;
  }
  return `curl -fsSL ${SCRIPT_URL} | bash -s -- uninstall`;
}

function buildWindowsUninstallCommand(): string {
  // URL 包含查询参数时用单引号包裹，避免 PowerShell 解析 &
  const quotedUrl = WIN_SCRIPT_URL.includes("?") ? `'${WIN_SCRIPT_URL}'` : WIN_SCRIPT_URL;
  
  return (
    `powershell -ExecutionPolicy Bypass -Command ` +
    `"irm ${quotedUrl} -OutFile $env:TEMP\\ci.ps1; ` +
    `& $env:TEMP\\ci.ps1 uninstall; ` +
    `Remove-Item $env:TEMP\\ci.ps1"`
  );
}

// ── Linux ─────────────────────────────────────────────────────────────────────

export function LinuxUninstallSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [dl, setDl] = useState<Downloader>("wget");
  const [copied, setCopied] = useState(false);

  const command = buildLinuxUninstallCommand(dl);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="px-0 text-destructive/60 hover:text-destructive gap-1"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {t("admin.nodes.install.uninstall.title")}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.install.uninstall.desc")}
        </p>
        <div className="flex items-center justify-between">
          <Tabs value={dl} onValueChange={(v) => setDl(v as Downloader)}>
            <TabsList className="h-8">
              <TabsTrigger value="wget" className="text-xs px-3">
                wget
              </TabsTrigger>
              <TabsTrigger value="curl" className="text-xs px-3">
                curl
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" className="h-8" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3.5 w-3.5 mr-1" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
        </div>
        <pre className="bg-destructive/5 border border-destructive/20 p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all select-all text-destructive/80">
          {command}
        </pre>
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.install.uninstall.linuxHint")}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Windows ───────────────────────────────────────────────────────────────────

export function WindowsUninstallSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const command = buildWindowsUninstallCommand();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="px-0 text-destructive/60 hover:text-destructive gap-1"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {t("admin.nodes.install.uninstall.title")}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.install.uninstall.desc")}
        </p>
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" className="h-8" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3.5 w-3.5 mr-1" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
        </div>
        <pre className="bg-destructive/5 border border-destructive/20 p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all select-all text-destructive/80">
          {command}
        </pre>
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.install.uninstall.winHint")}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
