import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateNetworkTarget } from "@/services/network";
import type { CreateNetworkTargetPayload, NetworkProtocol } from "@/types/network";
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

interface CreateTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTargetDialog({ open, onOpenChange }: CreateTargetDialogProps) {
  const { t } = useTranslation();
  const createTarget = useCreateNetworkTarget();

  const [form, setForm] = useState<CreateNetworkTargetPayload>({
    name: "",
    host: "",
    protocol: "icmp",
    port: null,
    interval: 60,
    enabled: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(t("admin.services.network.toast.creating"));
    createTarget.mutate(form, {
      onSuccess: () => {
        toast.success(t("admin.services.network.toast.createSuccess"), { id: toastId });
        setForm({ name: "", host: "", protocol: "icmp", port: null, interval: 60, enabled: 1 });
        onOpenChange(false);
      },
      onError: () => {
        toast.error(t("admin.services.network.toast.createFailed"), { id: toastId });
      },
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setForm({ name: "", host: "", protocol: "icmp", port: null, interval: 60, enabled: 1 });
    onOpenChange(v);
  };

  const needsPort = form.protocol === "tcp" || form.protocol === "http";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.services.network.create.title")}</DialogTitle>
          <DialogDescription>{t("admin.services.network.create.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cn-name">{t("admin.services.network.create.name")}</Label>
            <Input
              id="cn-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("admin.services.network.create.namePlaceholder")}
              required
              maxLength={128}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cn-host">{t("admin.services.network.create.host")}</Label>
            <Input
              id="cn-host"
              value={form.host}
              onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
              placeholder={t("admin.services.network.create.hostPlaceholder")}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("admin.services.network.create.protocol")}</Label>
              <Select
                value={form.protocol}
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
              <Label htmlFor="cn-port">{t("admin.services.network.create.port")}</Label>
              <Input
                id="cn-port"
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
                placeholder={t("admin.services.network.create.portPlaceholder")}
                disabled={!needsPort}
                required={needsPort}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cn-interval">{t("admin.services.network.create.interval")}</Label>
              <Input
                id="cn-interval"
                type="number"
                min={10}
                max={3600}
                value={form.interval ?? 60}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    interval: parseInt(e.target.value, 10) || 60,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.services.network.create.enabled")}</Label>
              <Select
                value={String(form.enabled ?? 1)}
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
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t("admin.services.network.create.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createTarget.isPending || !form.name.trim() || !form.host.trim()}
            >
              {createTarget.isPending ? t("common.loading") : t("admin.services.network.create.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
