import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteGroup } from "@/services/servers";
import type { GroupWithServers } from "@/types/server";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteGroupDialogProps {
  group: GroupWithServers | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteGroupDialog({ group, open, onOpenChange }: DeleteGroupDialogProps) {
  const { t } = useTranslation();
  const deleteGroup = useDeleteGroup();

  const handleDelete = () => {
    if (!group) return;
    const toastId = toast.loading(t("admin.groups.toast.deleting"));
    deleteGroup.mutate(group.id, {
      onSuccess: () => {
        toast.success(t("admin.groups.toast.deleteSuccess"), { id: toastId });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.groups.toast.deleteFailed"), { id: toastId });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.groups.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.groups.delete.description", { name: group?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("admin.groups.delete.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteGroup.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteGroup.isPending ? t("common.loading") : t("admin.groups.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
