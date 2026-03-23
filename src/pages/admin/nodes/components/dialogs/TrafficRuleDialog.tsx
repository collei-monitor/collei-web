import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useServerTrafficRule,
  useUpsertTrafficRule,
  useClearTrafficRule,
} from "@/services/servers";
import type { Server } from "@/types/server";
import type { TrafficRule, UpsertTrafficRulePayload } from "@/types/server";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info, Trash2 } from "lucide-react";

function toTrafficGB(bytes: number): string {
  if (bytes === 0) return "0";
  return (bytes / 1073741824).toFixed(2);
}

function fromTrafficGB(gb: string): number {
  const val = parseFloat(gb);
  if (isNaN(val) || val <= 0) return 0;
  return Math.round(val * 1073741824);
}

export function TrafficRuleDialog({
  server,
  open,
  onOpenChange,
}: {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data: trafficRule, isLoading } = useServerTrafficRule(
    open && server ? server.uuid : null,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.nodes.trafficRule.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.nodes.trafficRule.description")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : (
          <TrafficRuleForm
            server={server}
            trafficRule={trafficRule ?? null}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TrafficRuleForm({
  server,
  trafficRule,
  onOpenChange,
}: {
  server: Server | null;
  trafficRule: TrafficRule | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const upsertTrafficRule = useUpsertTrafficRule();
  const clearTrafficRule = useClearTrafficRule();

  const [form, setForm] = useState<UpsertTrafficRulePayload>(() =>
    trafficRule
      ? {
          traffic_reset_day: trafficRule.traffic_reset_day,
          traffic_threshold: trafficRule.traffic_threshold,
          accounting_mode: trafficRule.accounting_mode,
        }
      : {
          traffic_reset_day: 1,
          traffic_threshold: 0,
          accounting_mode: 1,
        },
  );
  const [trafficGB, setTrafficGB] = useState(() =>
    trafficRule ? toTrafficGB(trafficRule.traffic_threshold) : "0",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) return;
    const payload: UpsertTrafficRulePayload = {
      ...form,
      traffic_threshold: fromTrafficGB(trafficGB),
    };
    const toastId = toast.loading(t("admin.nodes.trafficRule.toast.saving"));
    upsertTrafficRule.mutate(
      { uuid: server.uuid, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.nodes.trafficRule.toast.saveSuccess"), {
            id: toastId,
          });
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("admin.nodes.trafficRule.toast.saveFailed"), {
            id: toastId,
          });
        },
      },
    );
  };

  const handleClear = () => {
    if (!server) return;
    const toastId = toast.loading(t("admin.nodes.trafficRule.toast.clearing"));
    clearTrafficRule.mutate(server.uuid, {
      onSuccess: () => {
        toast.success(t("admin.nodes.trafficRule.toast.clearSuccess"), {
          id: toastId,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast.error(t("admin.nodes.trafficRule.toast.clearFailed"), {
          id: toastId,
        });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 流量阈值 */}
      <div className="space-y-2">
        <Label>{t("admin.nodes.trafficRule.trafficThreshold")}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={trafficGB}
            onChange={(e) => setTrafficGB(e.target.value)}
          />
          <span className="text-sm text-muted-foreground shrink-0">GB</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.trafficRule.trafficThresholdHint")}
        </p>
      </div>

      {/* 流量重置日 */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Label>{t("admin.nodes.trafficRule.trafficResetDay")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="inline-flex">
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-sm" side="right">
              <p className="font-medium mb-1">{t("admin.nodes.trafficRule.hints.resetDayTitle")}</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><span className="font-mono">null</span> → {t("admin.nodes.trafficRule.hints.resetDayNull")}</li>
                <li><span className="font-mono">0</span> → {t("admin.nodes.trafficRule.hints.resetDay0")}</li>
                <li><span className="font-mono">-1</span> → {t("admin.nodes.trafficRule.hints.resetDayMinus1")}</li>
                <li><span className="font-mono">1–31</span> → {t("admin.nodes.trafficRule.hints.resetDay131")}</li>
              </ul>
            </PopoverContent>
          </Popover>
        </div>
        <Input
          type="number"
          min={-1}
          max={31}
          placeholder="null"
          value={form.traffic_reset_day ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            setForm((p) => ({
              ...p,
              traffic_reset_day: val === "" ? null : parseInt(val, 10) || 0,
            }));
          }}
        />
      </div>

      {/* 流量计算模式 */}
      <div className="space-y-2">
        <Label>{t("admin.nodes.trafficRule.accountingMode")}</Label>
        <Select
          value={String(form.accounting_mode ?? 1)}
          onValueChange={(v) =>
            setForm((p) => ({ ...p, accounting_mode: parseInt(v, 10) }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{t("admin.nodes.trafficRule.modes.outOnly")}</SelectItem>
            <SelectItem value="2">{t("admin.nodes.trafficRule.modes.inOnly")}</SelectItem>
            <SelectItem value="3">{t("admin.nodes.trafficRule.modes.sum")}</SelectItem>
            <SelectItem value="4">{t("admin.nodes.trafficRule.modes.max")}</SelectItem>
            <SelectItem value="5">{t("admin.nodes.trafficRule.modes.min")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("admin.nodes.trafficRule.accountingModeHint")}
        </p>
      </div>

      <DialogFooter className="flex-row justify-between sm:justify-between">
        {trafficRule && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleClear}
            disabled={clearTrafficRule.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("admin.nodes.trafficRule.clear")}
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("admin.nodes.trafficRule.cancel")}
          </Button>
          <Button type="submit" disabled={upsertTrafficRule.isPending}>
            {upsertTrafficRule.isPending
              ? t("common.loading")
              : t("admin.nodes.trafficRule.save")}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
