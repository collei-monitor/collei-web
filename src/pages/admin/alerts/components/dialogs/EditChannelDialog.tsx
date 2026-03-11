import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateChannel, useProviders } from "@/services/notifications";
import type { AlertChannelRead } from "@/types/notification";
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
  channel: AlertChannelRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditChannelDialog({ channel, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const updateChannel = useUpdateChannel();
  const { data: providers = [] } = useProviders();

  const [name, setName] = useState(channel?.name ?? "");
  const [providerId, setProviderId] = useState<number | "">(channel?.provider_id ?? "");
  const [target, setTarget] = useState(channel?.target ?? "");

  const [prevChannel, setPrevChannel] = useState<AlertChannelRead | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  if (channel !== prevChannel || open !== prevOpen) {
    setPrevChannel(channel);
    setPrevOpen(open);
    if (channel) {
      setName(channel.name);
      setProviderId(channel.provider_id);
      setTarget(channel.target ?? "");
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) return;

    const payload: Record<string, string | number | null> = {};
    if (name !== channel.name) payload.name = name;
    if (providerId !== channel.provider_id) payload.provider_id = providerId === "" ? null : providerId;
    const newTarget = target.trim() || null;
    if (newTarget !== (channel.target ?? null)) payload.target = newTarget;

    if (Object.keys(payload).length === 0) {
      toast.info(t("admin.alerts.channels.channels.toast.noChanges"));
      return;
    }

    const toastId = toast.loading(t("admin.alerts.channels.channels.toast.editSaving"));
    updateChannel.mutate(
      { id: channel.id, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.alerts.channels.channels.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.alerts.channels.channels.toast.editFailed"), { id: toastId });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.alerts.channels.channels.edit.title")}</DialogTitle>
          <DialogDescription>{t("admin.alerts.channels.channels.edit.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.alerts.channels.channels.edit.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={128}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.alerts.channels.channels.edit.provider")}</Label>
            <Select
              value={providerId === "" ? "" : String(providerId)}
              onValueChange={(v) => setProviderId(parseInt(v, 10))}
            >
              <SelectTrigger disabled={providers.length === 0}>
                <SelectValue placeholder={t("admin.alerts.channels.channels.edit.providerPlaceholder")} />
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
            <Label>{t("admin.alerts.channels.channels.edit.target")}</Label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("admin.alerts.channels.channels.edit.cancel")}
            </Button>
            <Button type="submit" disabled={updateChannel.isPending || !name.trim()}>
              {updateChannel.isPending ? t("common.loading") : t("admin.alerts.channels.channels.edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
