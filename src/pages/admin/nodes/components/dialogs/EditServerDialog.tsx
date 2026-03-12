import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateServer } from "@/services/servers";
import type { Server, UpdateServerPayload } from "@/types/server";
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

export function EditServerDialog({
  server,
  open,
  onOpenChange,
}: {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const updateServer = useUpdateServer();

  const [form, setForm] = useState<UpdateServerPayload>(() =>
    server
      ? {
          name: server.name,
          region: server.region ?? "",
          top: server.top,
          hidden: server.hidden,
        }
      : {},
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) return;
    const toastId = toast.loading(t("admin.nodes.toast.editSaving"));
    updateServer.mutate(
      { uuid: server.uuid, payload: form },
      {
        onSuccess: () => {
          toast.success(t("admin.nodes.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("admin.nodes.toast.editFailed"), { id: toastId });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.nodes.edit.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.nodes.edit.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t("admin.nodes.edit.name")}</Label>
            <Input
              id="edit-name"
              value={form.name ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-region">{t("admin.nodes.edit.region")}</Label>
            <Input
              id="edit-region"
              value={form.region ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, region: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-top">{t("admin.nodes.edit.sort")}</Label>
              <Input
                id="edit-top"
                type="number"
                value={form.top ?? 0}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    top: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.nodes.edit.visibility")}</Label>
              <Select
                value={String(form.hidden ?? 0)}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, hidden: parseInt(v, 10) }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    {t("admin.nodes.visible")}
                  </SelectItem>
                  <SelectItem value="1">
                    {t("admin.nodes.hidden")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("admin.nodes.edit.cancel")}
            </Button>
            <Button type="submit" disabled={updateServer.isPending}>
              {updateServer.isPending
                ? t("common.loading")
                : t("admin.nodes.edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
