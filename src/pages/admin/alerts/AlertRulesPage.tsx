import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useRules, useUpdateRule } from "@/services/notifications";
import type { AlertRuleRead } from "@/types/notification";
import { Button } from "@/components/ui/button";
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
import {
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Link,
} from "lucide-react";
import { CreateRuleDialog } from "./components/dialogs/CreateRuleDialog";
import { EditRuleDialog } from "./components/dialogs/EditRuleDialog";
import { DeleteRuleDialog } from "./components/dialogs/DeleteRuleDialog";
import { MappingsDialog } from "./components/dialogs/MappingsDialog";

export default function AlertRulesPage() {
  const { t } = useTranslation();

  const {
    data: rules = [],
    isLoading,
    isError,
    refetch,
  } = useRules();

  const updateRule = useUpdateRule();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRule, setEditRule] = useState<AlertRuleRead | null>(null);
  const [deleteRule, setDeleteRule] = useState<AlertRuleRead | null>(null);
  const [mappingsRule, setMappingsRule] = useState<AlertRuleRead | null>(null);

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("admin.alerts.rules.toast.refreshing"),
      success: t("admin.alerts.rules.toast.refreshSuccess"),
      error: t("admin.alerts.rules.toast.refreshFailed"),
    });
  }, [refetch, t]);

  const handleToggle = (rule: AlertRuleRead) => {
    const newEnabled = rule.enabled === 1 ? 0 : 1;
    updateRule.mutate(
      { id: rule.id, payload: { enabled: newEnabled } },
      {
        onSuccess: () => toast.success(t("admin.alerts.rules.toast.toggleSuccess")),
        onError: (err) =>
          toast.error(err.message || t("admin.alerts.rules.toast.toggleFailed")),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.alerts.rules.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.alerts.rules.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.alerts.rules.refresh")}</TooltipContent>
          </Tooltip>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("admin.alerts.rules.create.title")}
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.alerts.rules.fetchError")}
        </div>
      )}

      {/* Rules table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t("admin.alerts.rules.table.name")}</TableHead>
              <TableHead>{t("admin.alerts.rules.table.metric")}</TableHead>
              <TableHead>{t("admin.alerts.rules.table.condition")}</TableHead>
              <TableHead>{t("admin.alerts.rules.table.duration")}</TableHead>
              <TableHead>{t("admin.alerts.rules.table.enabled")}</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  {t("admin.alerts.rules.empty")}
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono text-xs">{rule.id}</TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`admin.alerts.rules.metrics.${rule.metric}`, rule.metric)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {rule.condition} {rule.threshold}
                  </TableCell>
                  <TableCell>{rule.duration}s</TableCell>
                  <TableCell>
                    <Badge
                      variant={rule.enabled === 1 ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() => handleToggle(rule)}
                    >
                      {rule.enabled === 1
                        ? t("admin.alerts.rules.table.on")
                        : t("admin.alerts.rules.table.off")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditRule(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("admin.alerts.rules.table.edit")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setMappingsRule(rule)}
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("admin.alerts.rules.table.mappings")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteRule(rule)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("admin.alerts.rules.table.delete")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateRuleDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditRuleDialog
        rule={editRule}
        open={!!editRule}
        onOpenChange={(o) => !o && setEditRule(null)}
      />
      <DeleteRuleDialog
        rule={deleteRule}
        open={!!deleteRule}
        onOpenChange={(o) => !o && setDeleteRule(null)}
      />
      <MappingsDialog
        rule={mappingsRule}
        open={!!mappingsRule}
        onOpenChange={(o) => !o && setMappingsRule(null)}
      />
    </div>
  );
}
