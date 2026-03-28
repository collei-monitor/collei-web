/**
 * Terminal (ConPTY) 连接状态栏
 */

import { useTranslation } from "react-i18next";
import type { TerminalConnectionStatus } from "@/types/terminal";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, WifiOff } from "lucide-react";

interface TerminalStatusIndicatorProps {
  status: TerminalConnectionStatus;
  serverName?: string;
}

const statusConfig: Record<TerminalConnectionStatus, {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ElementType;
  spin?: boolean;
}> = {
  idle: { variant: "secondary", icon: WifiOff },
  creating: { variant: "outline", icon: Loader2, spin: true },
  waiting: { variant: "outline", icon: Loader2, spin: true },
  connected: { variant: "default", icon: Check },
  error: { variant: "destructive", icon: X },
  closed: { variant: "secondary", icon: WifiOff },
};

export function TerminalStatusIndicator({ status, serverName }: TerminalStatusIndicatorProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-sm">
      {serverName && (
        <span className="font-medium text-muted-foreground">{serverName}</span>
      )}
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.spin ? "animate-spin" : ""}`} />
        {t(`terminal.status.${status}`)}
      </Badge>
    </div>
  );
}
