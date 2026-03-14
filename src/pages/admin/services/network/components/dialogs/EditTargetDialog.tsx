import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateNetworkTarget } from "@/services/network";
import type { NetworkTarget, NetworkProtocol, UpdateNetworkTargetPayload } from "@/types/network";
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

const PROTOCOLS: NetworkProtocol[] = ["icmp", "tcp", "http"];

interface EditTargetDialogProps {
  target: NetworkTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTargetDialog({ target, open, onOpenChange }: EditTargetDialogProps) {
  const { t } = useTranslation();
  const updateTarget = useUpdateNetworkTarget();

  const [form, setForm] = useState<UpdateNetworkTargetPayload>(() =>
    target
      ? {
          name: target.name,
          host: target.host,
          protocol: target.protocol,
          port: target.port,
          interval: target.interval,
          enabled: target.enabled,
        }
      : {},
  );

  const needsPort =
    (form.protocol ?? target?.protocol) === "tcp" ||
    (form.protocol ?? target?.protocol) === "http";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    const toastId = toast.loading(t("admin.services.network.toast.editSaving"));
    updateTarget.mutate(
      { id: target.id, payload: form },
      {
        onSuccess: () => {
          toast.success(t("admin.services.network.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("admin.services.network.toast.editFailed"), { id: toastId });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.services.network.edit.title")}</DialogTitle>
          <DialogDescription>{t("admin.services.network.edit.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="en-name">{t("admin.services.network.edit.name")}</Label>
            <Input
              id="en-name"
              value={form.name ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              maxLength={128}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="en-host">{t("admin.services.network.edit.host")}</Label>
            <Input
              id="en-host"
              value={form.host ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("admin.services.network.edit.protocol")}</Label>
              <Select
                value={form.protocol ?? target?.protocol ?? "icmp"}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, protocol: v as NetworkProtocol, port: null }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROTOCOLS.map((proto) => (
                    <SelectItem key={proto} value={proto}>
                      {proto.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="en-port">{t("admin.services.network.edit.port")}</Label>
              <Input
                id="en-port"
                type="number"
                min={1}
                max={65535}
                value={form.port ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    port: e.target.value ? parseInt(e.target.value, 10) : null,
                  }))
                }
                placeholder={t("admin.services.network.edit.portPlaceholder")}
                disabled={!needsPort}
                required={needsPort}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="en-interval">{t("admin.services.network.edit.interval")}</Label>
              <Input
                id="en-interval"
                type="number"
                min={10}
                max={3600}
                value={form.interval ?? target?.interval ?? 60}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    interval: parseInt(e.target.value, 10) || 60,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.services.network.edit.enabled")}</Label>
              <Select
                value={String(form.enabled ?? target?.enabled ?? 1)}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, enabled: parseInt(v, 10) }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("admin.services.network.enabled")}</SelectItem>
                  <SelectItem value="0">{t("admin.services.network.disabled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("admin.services.network.edit.cancel")}
            </Button>
            <Button type="submit" disabled={updateTarget.isPending}>
              {updateTarget.isPending ? t("common.loading") : t("admin.services.network.edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
