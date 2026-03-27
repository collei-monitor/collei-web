import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteNetworkTarget } from "@/services/network";
import type { NetworkTarget } from "@/types/network";
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

interface DeleteTargetDialogProps {
  target: NetworkTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTargetDialog({ target, open, onOpenChange }: DeleteTargetDialogProps) {
  const { t } = useTranslation();
  const deleteTarget = useDeleteNetworkTarget();

  const handleDelete = () => {
    if (!target) return;
    const toastId = toast.loading(t("common.deleting"));
    deleteTarget.mutate(target.id, {
      onSuccess: () => {
        toast.success(t("admin.services.network.toast.deleteSuccess"), { id: toastId });
        onOpenChange(false);
      },
      onError: () => {
        toast.error(t("common.deleteFailed"), { id: toastId });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.services.network.delete.description", {
              name: target?.name ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTarget.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteTarget.isPending
              ? t("common.loading")
              : t("common.confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
