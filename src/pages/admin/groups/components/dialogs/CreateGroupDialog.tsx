import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateGroup } from "@/services/servers";
import type { CreateGroupPayload } from "@/types/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ServerSelector } from "../ServerSelector";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const { t } = useTranslation();
  const createGroup = useCreateGroup();

  const [form, setForm] = useState<CreateGroupPayload>({
    name: "",
    top: undefined,
    server_uuids: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(t("admin.groups.toast.creating"));
    createGroup.mutate(form, {
      onSuccess: () => {
        toast.success(t("admin.groups.toast.createSuccess"), { id: toastId });
        setForm({ name: "", top: undefined, server_uuids: [] });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.groups.toast.createFailed"), { id: toastId });
      },
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setForm({ name: "", top: undefined, server_uuids: [] });
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.groups.create.title")}</DialogTitle>
          <DialogDescription>{t("admin.groups.create.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-group-name">{t("admin.groups.create.name")}</Label>
            <Input
              id="create-group-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("admin.groups.create.namePlaceholder")}
              required
              maxLength={64}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-group-top">{t("admin.groups.create.sort")}</Label>
            <Input
              id="create-group-top"
              type="number"
              value={form.top ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  top: e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              placeholder={t("admin.groups.create.sortPlaceholder")}
            />
          </div>
          <ServerSelector
            selectedServerUuids={form.server_uuids || []}
            onSelectionChange={(uuids) =>
              setForm((p) => ({ ...p, server_uuids: uuids }))
            }
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t("admin.groups.create.cancel")}
            </Button>
            <Button type="submit" disabled={createGroup.isPending || !form.name.trim()}>
              {createGroup.isPending
                ? t("common.loading")
                : t("admin.groups.create.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
