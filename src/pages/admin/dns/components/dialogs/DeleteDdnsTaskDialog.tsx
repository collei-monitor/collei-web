import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteDdnsTask } from "@/services/dns";
import type { DdnsTaskRead } from "@/types/dns";
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

interface Props {
  task: DdnsTaskRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDdnsTaskDialog({ task, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const deleteTask = useDeleteDdnsTask();

  const handleDelete = () => {
    if (!task) return;

    const toastId = toast.loading(t("admin.services.dns.ddns.toast.deleting"));
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success(t("admin.services.dns.ddns.toast.deleteSuccess"), { id: toastId });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.services.dns.ddns.toast.deleteFailed"), { id: toastId });
      },
    });
  };


  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.services.dns.ddns.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.services.dns.ddns.delete.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTask.isPending}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteTask.isPending ? t("common.loading") : t("common.confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
