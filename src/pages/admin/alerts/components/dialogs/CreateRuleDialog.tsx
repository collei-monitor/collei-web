import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateRule } from "@/services/notifications";
import type { CreateRulePayload, AlertMetric, AlertCondition } from "@/types/notification";
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isOffline = form.metric === "offline";
    const payload: CreateRulePayload = {
      name: form.name,
      metric: form.metric,
      condition: isOffline ? "==" : form.condition,
      threshold: isOffline ? 1 : Number(form.threshold),
      duration: form.duration ? Number(form.duration) : undefined,
      enabled: form.enabled ? 1 : 0,
      notify_recovery: form.notify_recovery ? 1 : 0,
    };
    const toastId = toast.loading(t("admin.alerts.rules.toast.creating"));
    createRule.mutate(payload, {
      onSuccess: () => {
        toast.success(t("admin.alerts.rules.toast.createSuccess"), { id: toastId });
        resetForm();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.alerts.rules.toast.createFailed"), { id: toastId });
      },
    });
  };

  const resetForm = () =>
    setForm({ name: "", metric: "", condition: "", threshold: "", duration: "", enabled: true, notify_recovery: true });

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const isOffline = form.metric === "offline";
  const canSubmit =
    form.name.trim() && form.metric && (isOffline || (form.condition && form.threshold !== ""));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.alerts.rules.create.title")}</DialogTitle>
          <DialogDescription>{t("admin.alerts.rules.create.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("admin.alerts.rules.create.metric")}</Label>
              <Select
                value={form.metric}
                onValueChange={(v) => setForm((p) => ({ ...p, metric: v }))}
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
            {!isOffline && (
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
          <div className="grid grid-cols-2 gap-4">
            {!isOffline && (
              <div className="space-y-2">
                <Label>{t("admin.alerts.rules.create.threshold")}</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.threshold}
                  onChange={(e) => setForm((p) => ({ ...p, threshold: e.target.value }))}
                  placeholder={t("admin.alerts.rules.create.thresholdPlaceholder")}
                  required
                />
              </div>
            )}
            <div className={isOffline ? "col-span-2" : "space-y-2"}>
              <Label>{t("admin.alerts.rules.create.duration")}</Label>
              <Input
                type="number"
                min={0}
                value={form.duration}
                onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                placeholder={t("admin.alerts.rules.create.durationPlaceholder")}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-rule-enabled"
              checked={form.enabled}
              onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="create-rule-enabled">{t("admin.alerts.rules.create.enabled")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-rule-notify-recovery"
              checked={form.notify_recovery}
              onChange={(e) => setForm((p) => ({ ...p, notify_recovery: e.target.checked }))}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="create-rule-notify-recovery">{t("admin.alerts.rules.create.notifyRecovery")}</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t("admin.alerts.rules.create.cancel")}
            </Button>
            <Button type="submit" disabled={createRule.isPending || !canSubmit}>
              {createRule.isPending ? t("common.loading") : t("admin.alerts.rules.create.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
