import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useEngineStatus,
  useEngineStates,
  useReloadEngine,
} from "@/services/notifications";
import type { AlertStateItem } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { RefreshCw, RotateCw } from "lucide-react";

type FilterTab = "all" | "firing" | "pending" | "ok";

function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString();
}

function statusVariant(status: string) {
  switch (status) {
    case "firing":
      return "destructive" as const;
    case "pending":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export default function AlertEnginePage() {
  const { t } = useTranslation();

  const {
    data: engineStatus,
    isLoading: statusLoading,
    isError: statusError,
    refetch: refetchStatus,
  } = useEngineStatus({ refetchInterval: 5000 });

  const {
    data: states = [],
    isLoading: statesLoading,
    isError: statesError,
    refetch: refetchStates,
  } = useEngineStates({ refetchInterval: 5000 });

  const reloadEngine = useReloadEngine();

  const [filter, setFilter] = useState<FilterTab>("all");

  const handleRefresh = useCallback(() => {
    toast.promise(Promise.all([refetchStatus(), refetchStates()]), {
      loading: t("admin.alerts.engine.toast.refreshing"),
      success: t("admin.alerts.engine.toast.refreshSuccess"),
      error: t("admin.alerts.engine.toast.refreshFailed"),
    });
  }, [refetchStatus, refetchStates, t]);

  const handleReload = () => {
    const toastId = toast.loading(t("admin.alerts.engine.toast.reloading"));
    reloadEngine.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("admin.alerts.engine.toast.reloadSuccess"), { id: toastId });
      },
      onError: (err) => {
        toast.error(err.message || t("admin.alerts.engine.toast.reloadFailed"), {
          id: toastId,
        });
      },
    });
  };

  const filteredStates: AlertStateItem[] =
    filter === "all" ? states : states.filter((s) => s.status === filter);

  const isError = statusError || statesError;

  const statusCards = [
    { label: t("admin.alerts.engine.status.rulesCount"), value: engineStatus?.rules_count },
    { label: t("admin.alerts.engine.status.mappingsCount"), value: engineStatus?.mappings_count },
    { label: t("admin.alerts.engine.status.channelsCount"), value: engineStatus?.channels_count },
    { label: t("admin.alerts.engine.status.statesCount"), value: engineStatus?.states_count },
    { label: t("admin.alerts.engine.status.firingCount"), value: engineStatus?.firing_count },
    { label: t("admin.alerts.engine.status.pendingCount"), value: engineStatus?.pending_count },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.alerts.engine.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.alerts.engine.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.alerts.engine.refresh")}</TooltipContent>
          </Tooltip>
          <Button variant="outline" onClick={handleReload} disabled={reloadEngine.isPending}>
            <RotateCw className="h-4 w-4 mr-2" />
            {t("admin.alerts.engine.reload")}
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.alerts.engine.fetchError")}
        </div>
      )}

      {/* Status overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {t("admin.alerts.engine.status.title")}
            {engineStatus && (
              <Badge variant={engineStatus.running ? "default" : "destructive"}>
                {engineStatus.running
                  ? t("admin.alerts.engine.status.running")
                  : t("admin.alerts.engine.status.stopped")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {statusCards.map((c, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold">{c.value ?? "-"}</div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* States section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t("admin.alerts.engine.states.title")}
          </h2>
          <div className="flex gap-1">
            {(["all", "firing", "pending", "ok"] as FilterTab[]).map((tab) => (
              <Button
                key={tab}
                size="sm"
                variant={filter === tab ? "default" : "ghost"}
                onClick={() => setFilter(tab)}
              >
                {t(`admin.alerts.engine.states.filter${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
                {tab !== "all" && (
                  <span className="ml-1 text-xs opacity-70">
                    ({states.filter((s) => s.status === tab).length})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.alerts.engine.states.table.server")}</TableHead>
                <TableHead>{t("admin.alerts.engine.states.table.rule")}</TableHead>
                <TableHead>{t("admin.alerts.engine.states.table.metric")}</TableHead>
                <TableHead>{t("admin.alerts.engine.states.table.status")}</TableHead>
                <TableHead>{t("admin.alerts.engine.states.table.value")}</TableHead>
                <TableHead>{t("admin.alerts.engine.states.table.pendingSince")}</TableHead>
                <TableHead>{t("admin.alerts.engine.states.table.lastNotified")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredStates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    {t("admin.alerts.engine.states.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStates.map((s, i) => (
                  <TableRow key={`${s.server_uuid}-${s.rule_id}-${i}`}>
                    <TableCell>
                      <div className="text-sm font-medium">{s.server_name ?? "-"}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                        {s.server_uuid}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{s.rule_name ?? "-"}</div>
                      <div className="text-xs text-muted-foreground">#{s.rule_id}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {s.metric
                          ? t(`admin.alerts.rules.metrics.${s.metric}`, s.metric)
                          : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(s.status)}>
                        {t(`admin.alerts.engine.states.status.${s.status}`, s.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{s.value.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{formatTimestamp(s.pending_since)}</TableCell>
                    <TableCell className="text-sm">{formatTimestamp(s.last_notified_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
