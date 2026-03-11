import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAlertHistory } from "@/services/notifications";
import type { AlertHistoryParams } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, X } from "lucide-react";

function formatTimestamp(ts: number | null): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString();
}

export default function EventCenterPage() {
  const { t } = useTranslation();

  const [serverUuid, setServerUuid] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [limit, setLimit] = useState("50");
  const [params, setParams] = useState<AlertHistoryParams>({ limit: 50 });

  const {
    data: history = [],
    isLoading,
    isError,
    refetch,
  } = useAlertHistory(params);

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("admin.alerts.events.toast.refreshing"),
      success: t("admin.alerts.events.toast.refreshSuccess"),
      error: t("admin.alerts.events.toast.refreshFailed"),
    });
  }, [refetch, t]);

  const handleFilter = () => {
    const p: AlertHistoryParams = {};
    if (serverUuid.trim()) p.server_uuid = serverUuid.trim();
    if (ruleId.trim()) p.rule_id = Number(ruleId);
    if (limit.trim()) p.limit = Number(limit);
    setParams(p);
  };

  const handleReset = () => {
    setServerUuid("");
    setRuleId("");
    setLimit("50");
    setParams({ limit: 50 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.alerts.events.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.alerts.events.subtitle")}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("admin.alerts.events.refresh")}</TooltipContent>
        </Tooltip>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.alerts.events.filterServer")}</Label>
          <Input
            className="w-56"
            value={serverUuid}
            onChange={(e) => setServerUuid(e.target.value)}
            placeholder={t("admin.alerts.events.filterServerPlaceholder")}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.alerts.events.filterRule")}</Label>
          <Input
            className="w-32"
            type="number"
            value={ruleId}
            onChange={(e) => setRuleId(e.target.value)}
            placeholder={t("admin.alerts.events.filterRulePlaceholder")}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.alerts.events.limit")}</Label>
          <Input
            className="w-24"
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
        <Button onClick={handleFilter} size="sm">
          <Search className="h-4 w-4 mr-1" />
          {t("admin.alerts.events.filter")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="h-4 w-4 mr-1" />
          {t("admin.alerts.events.reset")}
        </Button>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.alerts.events.fetchError")}
        </div>
      )}

      {/* History table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.alerts.events.table.id")}</TableHead>
              <TableHead>{t("admin.alerts.events.table.serverUuid")}</TableHead>
              <TableHead>{t("admin.alerts.events.table.ruleId")}</TableHead>
              <TableHead>{t("admin.alerts.events.table.status")}</TableHead>
              <TableHead>{t("admin.alerts.events.table.value")}</TableHead>
              <TableHead>{t("admin.alerts.events.table.createdAt")}</TableHead>
              <TableHead>{t("admin.alerts.events.table.updatedAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  {t("admin.alerts.events.empty")}
                </TableCell>
              </TableRow>
            ) : (
              history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">
                    {item.server_uuid}
                  </TableCell>
                  <TableCell>{item.rule_id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.status === "firing" ? "destructive" : "default"}
                    >
                      {t(`admin.alerts.events.status.${item.status}`, item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {item.value != null ? item.value.toFixed(2) : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatTimestamp(item.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatTimestamp(item.updated_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
