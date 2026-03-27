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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info, Trash2 } from "lucide-react";

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
          billing_cycle_cost_code: billing.billing_cycle_cost_code,
          expiry_date: billing.expiry_date,
        }
      : {
          billing_cycle: 1,
          billing_cycle_data: 1,
          billing_cycle_cost: 0,
          billing_cycle_cost_code: "USD",
          expiry_date: 0,
        },
  );
  const [expiryDate, setExpiryDate] = useState(() =>
    billing ? timestampToDateStr(billing.expiry_date) : "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) return;
    const payload: UpsertBillingPayload = {
      ...form,
      expiry_date: dateStrToTimestamp(expiryDate),
    };
    const toastId = toast.loading(t("common.saving"));
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
    const toastId = toast.loading(t("common.deleting"));
    deleteBilling.mutate(server.uuid, {
      onSuccess: () => {
        toast.success(t("admin.nodes.billing.toast.deleteSuccess"), {
          id: toastId,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast.error(t("common.deleteFailed"), {
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
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={upsertBilling.isPending}>
            {upsertBilling.isPending
              ? t("common.loading")
              : t("common.save")}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
