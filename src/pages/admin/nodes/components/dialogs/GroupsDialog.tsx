import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGroups, useSetServerGroups } from "@/services/servers";
import type { Server } from "@/types/server";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GroupsDialog({
  server,
  open,
  onOpenChange,
}: {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data: allGroups = [] } = useGroups();
  const setServerGroups = useSetServerGroups();

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    server ? server.groups.map((g) => g.id) : [],
  );

  const toggleGroup = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    if (!server) return;
    setServerGroups.mutate(
      { uuid: server.uuid, payload: { group_ids: selectedIds } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.nodes.groups.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.nodes.groups.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {allGroups.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("admin.nodes.groups.empty")}
            </p>
          )}
          {allGroups.map((group) => (
            <label
              key={group.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
            >
              <input
                type="checkbox"
                className="accent-primary"
                checked={selectedIds.includes(group.id)}
                onChange={() => toggleGroup(group.id)}
              />
              <span className="text-sm">{group.name}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("admin.nodes.groups.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={setServerGroups.isPending}>
            {setServerGroups.isPending
              ? t("common.loading")
              : t("admin.nodes.groups.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
