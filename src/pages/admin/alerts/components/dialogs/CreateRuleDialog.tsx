import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateRule } from "@/services/notifications";
import type { CreateRulePayload, AlertMetric, AlertCondition } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMetricDefaults } from "../metric-defaults";

const METRICS: AlertMetric[] = [
  "offline", "cpu", "ram", "swap", "disk", "load",
  "net_in", "net_out", "tcp", "udp", "process",
  "expiry", "login", "traffic_percent",
];

const CONDITIONS: AlertCondition[] = [">", "<", ">=", "<=", "==", "!="];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRuleDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const createRule = useCreateRule();

  const [form, setForm] = useState({
    name: "",
    metric: "" as string,
    condition: "" as string,
    threshold: "",
    duration: "",
    enabled: true,
    notify_recovery: true,
    custom_message: "",
    traffic_notify_step: "",
  });

  const md = getMetricDefaults(form.metric);

  /** 切换指标时自动填充默认值 */
  const handleMetricChange = (v: string) => {
    const d = getMetricDefaults(v);
    setForm((p) => ({
      ...p,
      metric: v,
      condition: d.condition ?? (d.hideCondition ? "" : p.condition),
      threshold:
        d.threshold != null
          ? String(d.threshold)
          : d.defaultThreshold != null
            ? String(d.defaultThreshold)
            : "",
      duration:
        d.duration != null
          ? String(d.duration)
          : d.defaultDuration != null
            ? String(d.defaultDuration)
            : "",
      notify_recovery:
        d.hideNotifyRecovery
          ? false
          : d.defaultNotifyRecovery != null
            ? d.defaultNotifyRecovery === 1
            : p.notify_recovery,
      traffic_notify_step: d.hideTrafficStep ? "" : p.traffic_notify_step,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCondition = md.condition ?? form.condition;
    const finalThreshold = md.threshold ?? Number(form.threshold);
    const finalDuration = md.duration ?? (form.duration ? Number(form.duration) : undefined);
    const finalNotifyRecovery = md.hideNotifyRecovery
      ? (md.defaultNotifyRecovery ?? 0)
      : form.notify_recovery ? 1 : 0;

    const payload: CreateRulePayload = {
      name: form.name,
      metric: form.metric,
      condition: finalCondition,
      threshold: finalThreshold,
      duration: finalDuration,
      enabled: form.enabled ? 1 : 0,
      notify_recovery: finalNotifyRecovery,
      custom_message: form.custom_message.trim() || null,
    };
    if (!md.hideTrafficStep && form.traffic_notify_step) {
      payload.traffic_notify_step = Number(form.traffic_notify_step);
    }
    const toastId = toast.loading(t("common.creating"));
    createRule.mutate(payload, {
      onSuccess: () => {
        toast.success(t("admin.alerts.rules.toast.createSuccess"), { id: toastId });
        resetForm();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("common.createFailed"), { id: toastId });
      },
    });
  };

  const resetForm = () =>
    setForm({ name: "", metric: "", condition: "", threshold: "", duration: "", enabled: true, notify_recovery: true, custom_message: "", traffic_notify_step: "" });

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const showCondition = !md.hideCondition;
  const showThreshold = !md.hideThreshold;
  const showDuration = !md.hideDuration;
  const showNotifyRecovery = !md.hideNotifyRecovery;
  const showTrafficStep = !md.hideTrafficStep;

  const canSubmit =
    form.name.trim() &&
    form.metric &&
    (md.condition != null || form.condition) &&
    (md.threshold != null || form.threshold !== "");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.alerts.rules.create.title")}</DialogTitle>
          <DialogDescription>{t("admin.alerts.rules.create.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 规则名称 */}
          <div className="space-y-2">
            <Label>{t("admin.alerts.rules.create.name")}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("admin.alerts.rules.create.namePlaceholder")}
              required
              maxLength={128}
            />
          </div>

          {/* 指标 + 条件 */}
          <div className="grid grid-cols-2 gap-4">
            <div className={showCondition ? "space-y-2" : "col-span-2 space-y-2"}>
              <Label>{t("admin.alerts.rules.create.metric")}</Label>
              <Select
                value={form.metric}
                onValueChange={handleMetricChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.alerts.rules.create.metricPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {t(`admin.alerts.rules.metrics.${m}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showCondition && (
              <div className="space-y-2">
                <Label>{t("admin.alerts.rules.create.condition")}</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => setForm((p) => ({ ...p, condition: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.alerts.rules.create.conditionPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 阈值 + 持续时间 */}
          {(showThreshold || showDuration) && (
            <div className="grid grid-cols-2 gap-4">
              {showThreshold && (
                <div className={showDuration ? "space-y-2" : "col-span-2 space-y-2"}>
                  <Label>
                    {t("admin.alerts.rules.create.threshold")}
                    {md.thresholdUnit && (
                      <span className="text-muted-foreground font-normal ml-1">
                        ({t(`admin.alerts.rules.${md.thresholdUnit}`)})
                      </span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.threshold}
                    onChange={(e) => setForm((p) => ({ ...p, threshold: e.target.value }))}
                    placeholder={
                      md.thresholdHint
                        ? t(`admin.alerts.rules.${md.thresholdHint}`)
                        : t("admin.alerts.rules.create.thresholdPlaceholder")
                    }
                    required
                  />
                </div>
              )}
              {showDuration && (
                <div className={showThreshold ? "space-y-2" : "col-span-2 space-y-2"}>
                  <Label>{t("admin.alerts.rules.create.duration")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.duration}
                    onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                    placeholder={t("admin.alerts.rules.create.durationPlaceholder")}
                  />
                </div>
              )}
            </div>
          )}

          {/* 流量梯度通知步长 */}
          {showTrafficStep && (
            <div className="space-y-2">
              <Label>{t("admin.alerts.rules.create.trafficNotifyStep")}</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.traffic_notify_step}
                onChange={(e) => setForm((p) => ({ ...p, traffic_notify_step: e.target.value }))}
                placeholder={t("admin.alerts.rules.create.trafficNotifyStepPlaceholder")}
              />
            </div>
          )}

          {/* 自定义消息模板 */}
          <div className="space-y-2">
            <Label>{t("admin.alerts.rules.create.customMessage")}</Label>
            <Textarea
              value={form.custom_message}
              onChange={(e) => setForm((p) => ({ ...p, custom_message: e.target.value }))}
              placeholder={t("admin.alerts.rules.create.customMessagePlaceholder")}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {t("admin.alerts.rules.create.customMessageHint")}
            </p>
          </div>

          {/* 启用 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="create-rule-enabled"
              checked={form.enabled}
              onCheckedChange={(v) => setForm((p) => ({ ...p, enabled: v === true }))}
            />
            <Label htmlFor="create-rule-enabled">{t("admin.alerts.rules.create.enabled")}</Label>
          </div>

          {/* 恢复通知 */}
          {showNotifyRecovery && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="create-rule-notify-recovery"
                checked={form.notify_recovery}
                onCheckedChange={(v) => setForm((p) => ({ ...p, notify_recovery: v === true }))}
              />
              <Label htmlFor="create-rule-notify-recovery">{t("admin.alerts.rules.create.notifyRecovery")}</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={createRule.isPending || !canSubmit}>
              {createRule.isPending ? t("common.loading") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
