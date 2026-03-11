import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateChannel, useProviders } from "@/services/notifications";
import type { CreateChannelPayload } from "@/types/notification";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const createChannel = useCreateChannel();
  const { data: providers = [] } = useProviders();

  const [form, setForm] = useState<{ name: string; provider_id: number | ""; target: string }>({
    name: "",
    provider_id: "",
    target: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateChannelPayload = {
      name: form.name,
      provider_id: form.provider_id as number,
      target: form.target?.trim() || null,
    };
    const toastId = toast.loading(t("admin.alerts.channels.channels.toast.creating"));
    createChannel.mutate(payload, {
      onSuccess: () => {
        toast.success(t("admin.alerts.channels.channels.toast.createSuccess"), { id: toastId });
        setForm({ name: "", provider_id: "", target: "" });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.alerts.channels.channels.toast.createFailed"), { id: toastId });
      },
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setForm({ name: "", provider_id: "", target: "" });
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.alerts.channels.channels.create.title")}</DialogTitle>
          <DialogDescription>{t("admin.alerts.channels.channels.create.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.alerts.channels.channels.create.name")}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("admin.alerts.channels.channels.create.namePlaceholder")}
              required
              maxLength={128}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.alerts.channels.channels.create.provider")}</Label>
            <Select
              value={form.provider_id === "" ? "" : String(form.provider_id)}
              onValueChange={(v) => setForm((p) => ({ ...p, provider_id: parseInt(v, 10) }))}
            >
              <SelectTrigger disabled={providers.length === 0}>
                <SelectValue placeholder={t("admin.alerts.channels.channels.create.providerPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name ?? p.type ?? `#${p.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.alerts.channels.channels.create.target")}</Label>
            <Input
              value={form.target ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
              placeholder={t("admin.alerts.channels.channels.create.targetPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t("admin.alerts.channels.channels.create.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createChannel.isPending || !form.name.trim() || form.provider_id === ""}
            >
              {createChannel.isPending ? t("common.loading") : t("admin.alerts.channels.channels.create.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
