import { useTranslation } from "react-i18next";
import type { NetworkTarget } from "@/types/network";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart2, Pencil, SendHorizontal, Trash2 } from "lucide-react";

interface NetworkTargetRowProps {
  target: NetworkTarget;
  onEdit: (t: NetworkTarget) => void;
  onDispatch: (t: NetworkTarget) => void;
  onViewStatus: (t: NetworkTarget) => void;
  onDelete: (t: NetworkTarget) => void;
}

export function NetworkTargetRow({
  target,
  onEdit,
  onDispatch,
  onViewStatus,
  onDelete,
}: NetworkTargetRowProps) {
  const { t } = useTranslation();

  const protocolLabel =
    t(`admin.services.network.protocols.${target.protocol}`, { defaultValue: target.protocol.toUpperCase() });

  return (
    <TableRow>
      <TableCell className="font-medium">{target.name}</TableCell>
      <TableCell>
        <span className="font-mono text-sm">{target.host}</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs font-mono">
          {protocolLabel}
        </Badge>
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground text-sm">
        {target.port ?? "—"}
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground text-sm">
        {target.interval}s
      </TableCell>
      <TableCell>
        {target.enabled === 1 ? (
          <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs">
            {t("admin.services.network.enabled")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {t("admin.services.network.disabled")}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(target)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.services.network.actions.edit")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onViewStatus(target)}
              >
                <BarChart2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.services.network.actions.viewStatus")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDispatch(target)}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.services.network.actions.dispatch")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(target)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.services.network.actions.delete")}</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}
