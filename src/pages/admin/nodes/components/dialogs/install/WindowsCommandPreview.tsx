import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WindowsCommandPreview({
  command,
  isProxyMode,
  enableTerminal,
  enableFileApi,
}: {
  command: string;
  isProxyMode: boolean;
  enableTerminal: boolean;
  enableFileApi: boolean;
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
      <div className="flex items-center justify-end">
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
          {copied ? t("common.copied") : t("common.copy")}
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
      {enableTerminal && (
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.install.win.terminalHint")}
        </p>
      )}
      {enableFileApi && (
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.install.win.fileApiHint")}
        </p>
      )}
    </div>
  );
}
