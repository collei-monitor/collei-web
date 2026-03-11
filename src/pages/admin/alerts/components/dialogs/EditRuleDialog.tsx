import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateRule } from "@/services/notifications";
import type { AlertRuleRead, UpdateRulePayload, AlertMetric, AlertCondition } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const METRICS: AlertMetric[] = [
  "offline", "cpu", "ram", "swap", "disk", "load",
  "net_in", "net_out", "tcp", "udp", "process",
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
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rule) return;

    const isOffline = metric === "offline";
    const payload: UpdateRulePayload = {};
    if (name !== rule.name) payload.name = name;
    if (metric !== rule.metric) payload.metric = metric;
    const newCondition = isOffline ? "==" : condition;
    if (newCondition !== rule.condition) payload.condition = newCondition;
    const newThreshold = isOffline ? 1 : Number(threshold);
    if (newThreshold !== rule.threshold) payload.threshold = newThreshold;
    if (Number(duration) !== rule.duration) payload.duration = Number(duration);
    const newEnabled = enabled ? 1 : 0;
    if (newEnabled !== rule.enabled) payload.enabled = newEnabled;
    const newNotifyRecovery = notifyRecovery ? 1 : 0;
    if (newNotifyRecovery !== rule.notify_recovery) payload.notify_recovery = newNotifyRecovery;

    if (Object.keys(payload).length === 0) {
      toast.info(t("admin.alerts.rules.toast.noChanges"));
      return;
    }

    const toastId = toast.loading(t("admin.alerts.rules.toast.editSaving"));
    updateRule.mutate(
      { id: rule.id, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.alerts.rules.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.alerts.rules.toast.editFailed"), { id: toastId });
        },
      },
    );
  };

  const isOffline = metric === "offline";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.alerts.rules.edit.title")}</DialogTitle>
          <DialogDescription>{t("admin.alerts.rules.edit.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.alerts.rules.edit.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={128}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("admin.alerts.rules.edit.metric")}</Label>
              <Select value={metric} onValueChange={setMetric}>
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
            {!isOffline && (
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
          <div className="grid grid-cols-2 gap-4">
            {!isOffline && (
              <div className="space-y-2">
                <Label>{t("admin.alerts.rules.edit.threshold")}</Label>
                <Input
                  type="number"
                  step="any"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  required
                />
              </div>
            )}
            <div className={isOffline ? "col-span-2" : "space-y-2"}>
              <Label>{t("admin.alerts.rules.edit.duration")}</Label>
              <Input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-rule-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="edit-rule-enabled">{t("admin.alerts.rules.edit.enabled")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-rule-notify-recovery"
              checked={notifyRecovery}
              onChange={(e) => setNotifyRecovery(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="edit-rule-notify-recovery">{t("admin.alerts.rules.edit.notifyRecovery")}</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("admin.alerts.rules.edit.cancel")}
            </Button>
            <Button type="submit" disabled={updateRule.isPending || !name.trim()}>
              {updateRule.isPending ? t("common.loading") : t("admin.alerts.rules.edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
