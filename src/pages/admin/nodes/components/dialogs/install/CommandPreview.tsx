import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Downloader } from "./types";

export function CommandPreview({
  command,
  downloader,
  onDownloaderChange,
  isProxyMode,
  setupCa,
}: {
  command: string;
  downloader: Downloader;
  onDownloaderChange: (d: Downloader) => void;
  isProxyMode: boolean;
  setupCa: boolean;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Tabs
          value={downloader}
          onValueChange={(v) => onDownloaderChange(v as Downloader)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="wget" className="text-xs px-3">
              wget
            </TabsTrigger>
            <TabsTrigger value="curl" className="text-xs px-3">
              curl
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 mr-1" />
          ) : (
            <Copy className="h-3.5 w-3.5 mr-1" />
          )}
          {copied
            ? t("admin.nodes.install.copied")
            : t("admin.nodes.install.copy")}
        </Button>
      </div>

      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all select-all">
        {command}
      </pre>

      {isProxyMode && (
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.install.proxyHint")}
        </p>
      )}
      {setupCa && (
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.install.caHint")}
        </p>
      )}
    </div>
  );
}
