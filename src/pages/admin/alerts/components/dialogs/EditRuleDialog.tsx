import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateRule } from "@/services/notifications";
import type { AlertRuleRead, UpdateRulePayload, AlertMetric, AlertCondition } from "@/types/notification";
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
  "expiry", "login", "ip_change", "traffic_percent",
];

const CONDITIONS: AlertCondition[] = [">", "<", ">=", "<=", "==", "!="];

interface Props {
  rule: AlertRuleRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRuleDialog({ rule, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const updateRule = useUpdateRule();

  const [name, setName] = useState(rule?.name ?? "");
  const [metric, setMetric] = useState(rule?.metric ?? "");
  const [condition, setCondition] = useState(rule?.condition ?? "");
  const [threshold, setThreshold] = useState<string>(String(rule?.threshold ?? ""));
  const [duration, setDuration] = useState<string>(String(rule?.duration ?? ""));
  const [enabled, setEnabled] = useState(rule?.enabled === 1);
  const [notifyRecovery, setNotifyRecovery] = useState(rule?.notify_recovery === 1);
  const [customMessage, setCustomMessage] = useState(rule?.custom_message ?? "");
  const [trafficNotifyStep, setTrafficNotifyStep] = useState<string>(
    rule?.traffic_notify_step != null ? String(rule.traffic_notify_step) : ""
  );

  const [prevRule, setPrevRule] = useState<AlertRuleRead | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  if (rule !== prevRule || open !== prevOpen) {
    setPrevRule(rule);
    setPrevOpen(open);
    if (rule) {
      setName(rule.name);
      setMetric(rule.metric);
      setCondition(rule.condition);
      setThreshold(String(rule.threshold));
      setDuration(String(rule.duration));
      setEnabled(rule.enabled === 1);
      setNotifyRecovery(rule.notify_recovery === 1);
      setCustomMessage(rule.custom_message ?? "");
      setTrafficNotifyStep(rule.traffic_notify_step != null ? String(rule.traffic_notify_step) : "");
    }
  }

  const md = getMetricDefaults(metric);

  /** 切换指标时自动填充默认值 */
  const handleMetricChange = (v: string) => {
    const d = getMetricDefaults(v);
    setMetric(v);
    setCondition(d.condition ?? (d.hideCondition ? "" : condition));
    setThreshold(
      d.threshold != null
        ? String(d.threshold)
        : d.defaultThreshold != null
          ? String(d.defaultThreshold)
          : threshold,
    );
    setDuration(
      d.duration != null
        ? String(d.duration)
        : d.defaultDuration != null
          ? String(d.defaultDuration)
          : duration,
    );
    if (d.hideNotifyRecovery) {
      setNotifyRecovery(false);
    } else if (d.defaultNotifyRecovery != null) {
      setNotifyRecovery(d.defaultNotifyRecovery === 1);
    }
    if (d.hideTrafficStep) {
      setTrafficNotifyStep("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rule) return;

    const finalCondition = md.condition ?? condition;
    const finalThreshold = md.threshold ?? Number(threshold);
    const finalDuration = md.duration ?? Number(duration);
    const finalNotifyRecovery = md.hideNotifyRecovery
      ? (md.defaultNotifyRecovery ?? 0)
      : notifyRecovery ? 1 : 0;

    const payload: UpdateRulePayload = {};
    if (name !== rule.name) payload.name = name;
    if (metric !== rule.metric) payload.metric = metric;
    if (finalCondition !== rule.condition) payload.condition = finalCondition;
    if (finalThreshold !== rule.threshold) payload.threshold = finalThreshold;
    if (finalDuration !== rule.duration) payload.duration = finalDuration;
    const newEnabled = enabled ? 1 : 0;
    if (newEnabled !== rule.enabled) payload.enabled = newEnabled;
    if (finalNotifyRecovery !== rule.notify_recovery) payload.notify_recovery = finalNotifyRecovery;

    const newCustomMessage = customMessage.trim() || null;
    if (newCustomMessage !== (rule.custom_message ?? null)) payload.custom_message = newCustomMessage;

    const newTrafficStep = (!md.hideTrafficStep && trafficNotifyStep) ? Number(trafficNotifyStep) : null;
    if (newTrafficStep !== (rule.traffic_notify_step ?? null)) payload.traffic_notify_step = newTrafficStep;

    if (Object.keys(payload).length === 0) {
      toast.info(t("admin.alerts.rules.toast.noChanges"));
      return;
    }

    const toastId = toast.loading(t("common.saving"));
    updateRule.mutate(
      { id: rule.id, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.alerts.rules.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("common.updateFailed"), { id: toastId });
        },
      },
    );
  };

  const showCondition = !md.hideCondition;
  const showThreshold = !md.hideThreshold;
  const showDuration = !md.hideDuration;
  const showNotifyRecovery = !md.hideNotifyRecovery;
  const showTrafficStep = !md.hideTrafficStep;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.alerts.rules.edit.title")}</DialogTitle>
          <DialogDescription>{t("admin.alerts.rules.edit.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 规则名称 */}
          <div className="space-y-2">
            <Label>{t("admin.alerts.rules.edit.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={128}
            />
          </div>

          {/* 指标 + 条件 */}
          <div className="grid grid-cols-2 gap-4">
            <div className={showCondition ? "space-y-2" : "col-span-2 space-y-2"}>
              <Label>{t("admin.alerts.rules.edit.metric")}</Label>
              <Select value={metric} onValueChange={handleMetricChange}>
                <SelectTrigger>
                  <SelectValue />
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
                <Label>{t("admin.alerts.rules.edit.condition")}</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue />
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
                    {t("admin.alerts.rules.edit.threshold")}
                    {md.thresholdUnit && (
                      <span className="text-muted-foreground font-normal ml-1">
                        ({t(`admin.alerts.rules.${md.thresholdUnit}`)})
                      </span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder={
                      md.thresholdHint
                        ? t(`admin.alerts.rules.${md.thresholdHint}`)
                        : undefined
                    }
                    required
                  />
                </div>
              )}
              {showDuration && (
                <div className={showThreshold ? "space-y-2" : "col-span-2 space-y-2"}>
                  <Label>{t("admin.alerts.rules.edit.duration")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* 流量梯度通知步长 */}
          {showTrafficStep && (
            <div className="space-y-2">
              <Label>{t("admin.alerts.rules.edit.trafficNotifyStep")}</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={trafficNotifyStep}
                onChange={(e) => setTrafficNotifyStep(e.target.value)}
                placeholder={t("admin.alerts.rules.create.trafficNotifyStepPlaceholder")}
              />
            </div>
          )}

          {/* 自定义消息模板 */}
          <div className="space-y-2">
            <Label>{t("admin.alerts.rules.edit.customMessage")}</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
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
              id="edit-rule-enabled"
              checked={enabled}
              onCheckedChange={(v) => setEnabled(v === true)}
            />
            <Label htmlFor="edit-rule-enabled">{t("common.enable")}</Label>
          </div>

          {/* 恢复通知 */}
          {showNotifyRecovery && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-rule-notify-recovery"
                checked={notifyRecovery}
                onCheckedChange={(v) => setNotifyRecovery(v === true)}
              />
              <Label htmlFor="edit-rule-notify-recovery">{t("admin.alerts.rules.edit.notifyRecovery")}</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateRule.isPending || !name.trim()}>
              {updateRule.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
