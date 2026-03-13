import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useServerBilling,
  useUpsertBilling,
  useDeleteBilling,
} from "@/services/servers";
import type { Server } from "@/types/server";
import type { BillingRule, UpsertBillingPayload } from "@/types/server";
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
import { Separator } from "@/components/ui/separator";
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

function timestampToDateStr(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toISOString().slice(0, 10);
}

function dateStrToTimestamp(str: string): number {
  if (!str) return 0;
  return Math.floor(new Date(str + "T00:00:00Z").getTime() / 1000);
}

export function BillingDialog({
  server,
  open,
  onOpenChange,
}: {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data: billing, isLoading } = useServerBilling(
    open && server ? server.uuid : null,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.nodes.billing.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.nodes.billing.description")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : (
          <BillingForm
            server={server}
            billing={billing ?? null}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BillingForm({
  server,
  billing,
  onOpenChange,
}: {
  server: Server | null;
  billing: BillingRule | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const upsertBilling = useUpsertBilling();
  const deleteBilling = useDeleteBilling();

  const [form, setForm] = useState<UpsertBillingPayload>(() =>
    billing
      ? {
          billing_cycle: billing.billing_cycle,
          billing_cycle_data: billing.billing_cycle_data,
          billing_cycle_cost: billing.billing_cycle_cost,
          traffic_reset_day: billing.traffic_reset_day,
          traffic_threshold: billing.traffic_threshold,
          accounting_mode: billing.accounting_mode,
          billing_cycle_cost_code: billing.billing_cycle_cost_code,
          expiry_date: billing.expiry_date,
        }
      : {
          billing_cycle: 1,
          billing_cycle_data: 1,
          billing_cycle_cost: 0,
          traffic_reset_day: 1,
          traffic_threshold: 0,
          accounting_mode: 1,
          billing_cycle_cost_code: "USD",
          expiry_date: 0,
        },
  );
  const [trafficGB, setTrafficGB] = useState(() =>
    billing ? toTrafficGB(billing.traffic_threshold) : "0",
  );
  const [expiryDate, setExpiryDate] = useState(() =>
    billing ? timestampToDateStr(billing.expiry_date) : "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) return;
    const payload: UpsertBillingPayload = {
      ...form,
      traffic_threshold: fromTrafficGB(trafficGB),
      expiry_date: dateStrToTimestamp(expiryDate),
    };
    const toastId = toast.loading(t("admin.nodes.billing.toast.saving"));
    upsertBilling.mutate(
      { uuid: server.uuid, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.nodes.billing.toast.saveSuccess"), {
            id: toastId,
          });
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("admin.nodes.billing.toast.saveFailed"), {
            id: toastId,
          });
        },
      },
    );
  };

  const handleDelete = () => {
    if (!server) return;
    const toastId = toast.loading(t("admin.nodes.billing.toast.deleting"));
    deleteBilling.mutate(server.uuid, {
      onSuccess: () => {
        toast.success(t("admin.nodes.billing.toast.deleteSuccess"), {
          id: toastId,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast.error(t("admin.nodes.billing.toast.deleteFailed"), {
          id: toastId,
        });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 计费周期与出账日 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>{t("admin.nodes.billing.billingCycle")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex">
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-sm" side="right">
                <p className="font-medium mb-1">{t("admin.nodes.billing.hints.cycleTitle")}</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>1 → {t("admin.nodes.billing.cycles.monthly")}</li>
                  <li>3 → {t("admin.nodes.billing.cycles.quarterly")}</li>
                  <li>6 → {t("admin.nodes.billing.cycles.semiAnnual")}</li>
                  <li>12 → {t("admin.nodes.billing.cycles.annual")}</li>
                </ul>
                <p className="mt-2 text-muted-foreground">{t("admin.nodes.billing.hints.cycleRenew")}</p>
              </PopoverContent>
            </Popover>
          </div>
          <Input
            type="number"
            min={1}
            value={form.billing_cycle ?? 1}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                billing_cycle: parseInt(e.target.value, 10) || 1,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t("admin.nodes.billing.billingDay")}</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={form.billing_cycle_data ?? 1}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                billing_cycle_data: parseInt(e.target.value, 10) || 1,
              }))
            }
          />
        </div>
      </div>

      {/* 费用与货币 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("admin.nodes.billing.cost")}</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            placeholder={t("admin.nodes.billing.costPlaceholder")}
            value={form.billing_cycle_cost ?? 0}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                billing_cycle_cost: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t("admin.nodes.billing.currency")}</Label>
          <Select
            value={form.billing_cycle_cost_code}
            onValueChange={(v) =>
              setForm((p) => ({ ...p, billing_cycle_cost_code: v }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CNY">CNY (¥)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="JPY">JPY (¥)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* 流量相关 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("admin.nodes.billing.trafficThreshold")}</Label>
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
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>{t("admin.nodes.billing.trafficResetDay")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex">
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-sm" side="right">
                <p className="font-medium mb-1">{t("admin.nodes.billing.hints.resetDayTitle")}</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li><span className="font-mono">0</span> → {t("admin.nodes.billing.hints.resetDay0")}</li>
                  <li><span className="font-mono">-1</span> → {t("admin.nodes.billing.hints.resetDayMinus1")}</li>
                  <li><span className="font-mono">1–31</span> → {t("admin.nodes.billing.hints.resetDay131")}</li>
                </ul>
                <p className="mt-2 text-muted-foreground">{t("admin.nodes.billing.hints.resetDayFallback")}</p>
              </PopoverContent>
            </Popover>
          </div>
          <Input
            type="number"
            min={-1}
            max={31}
            value={form.traffic_reset_day ?? 0}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                traffic_reset_day: parseInt(e.target.value, 10) || 0,
              }))
            }
          />
        </div>
      </div>

      {/* 流量计算模式 */}
      <div className="space-y-2">
        <Label>{t("admin.nodes.billing.accountingMode")}</Label>
        <Select
          value={String(form.accounting_mode)}
          onValueChange={(v) =>
            setForm((p) => ({ ...p, accounting_mode: parseInt(v, 10) }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">
              {t("admin.nodes.billing.modes.outOnly")}
            </SelectItem>
            <SelectItem value="2">
              {t("admin.nodes.billing.modes.inOnly")}
            </SelectItem>
            <SelectItem value="3">
              {t("admin.nodes.billing.modes.sum")}
            </SelectItem>
            <SelectItem value="4">
              {t("admin.nodes.billing.modes.max")}
            </SelectItem>
            <SelectItem value="5">
              {t("admin.nodes.billing.modes.min")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* 到期时间 */}
      <div className="space-y-2">
        <Label>{t("admin.nodes.billing.expiryDate")}</Label>
        <Input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />
      </div>

      <DialogFooter className="flex-row justify-between sm:justify-between">
        {billing && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteBilling.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("admin.nodes.billing.delete")}
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("admin.nodes.billing.cancel")}
          </Button>
          <Button type="submit" disabled={upsertBilling.isPending}>
            {upsertBilling.isPending
              ? t("common.loading")
              : t("admin.nodes.billing.save")}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
