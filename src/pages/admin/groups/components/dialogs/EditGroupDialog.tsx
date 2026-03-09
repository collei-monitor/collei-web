import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateGroup } from "@/services/servers";
import type { GroupWithServers } from "@/types/server";
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

interface EditGroupDialogProps {
  group: GroupWithServers | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGroupDialog({ group, open, onOpenChange }: EditGroupDialogProps) {
  const { t } = useTranslation();
  const updateGroup = useUpdateGroup();

  const [name, setName] = useState(group?.name ?? "");
  const [top, setTop] = useState<number | "">(group?.top ?? "");
  const [serverUuids, setServerUuids] = useState<string[]>(
    group?.server_uuids ?? [],
  );

  const [prevGroup, setPrevGroup] = useState<GroupWithServers | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  if (group !== prevGroup || open !== prevOpen) {
    setPrevGroup(group);
    setPrevOpen(open);
    if (group) {
      setName(group.name);
      setTop(group.top);
      setServerUuids(group.server_uuids ?? []);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    const payload: {
      name?: string;
      top?: number;
      server_uuids?: string[];
    } = {};
    if (name !== group.name) payload.name = name;
    if (top !== "" && top !== group.top) payload.top = top;
    if (JSON.stringify(serverUuids) !== JSON.stringify(group.server_uuids ?? [])) {
      payload.server_uuids = serverUuids;
    }

    // Check if there is anything to update
    if (Object.keys(payload).length === 0) {
      toast.info(t("admin.groups.toast.noChanges"));
      return;
    }

    const toastId = toast.loading(t("admin.groups.toast.editSaving"));
    updateGroup.mutate(
      { id: group.id, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.groups.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.groups.toast.editFailed"), { id: toastId });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.groups.edit.title")}</DialogTitle>
          <DialogDescription>{t("admin.groups.edit.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-group-name">{t("admin.groups.edit.name")}</Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={64}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-group-top">{t("admin.groups.edit.sort")}</Label>
            <Input
              id="edit-group-top"
              type="number"
              value={top}
              onChange={(e) =>
                setTop(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>
          <ServerSelector
            selectedServerUuids={serverUuids}
            onSelectionChange={setServerUuids}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("admin.groups.edit.cancel")}
            </Button>
            <Button type="submit" disabled={updateGroup.isPending || !name.trim()}>
              {updateGroup.isPending
                ? t("common.loading")
                : t("admin.groups.edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
