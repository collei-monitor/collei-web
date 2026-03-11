import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteProvider } from "@/services/notifications";
import type { ProviderRead } from "@/types/notification";
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
  provider: ProviderRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProviderDialog({ provider, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const deleteProvider = useDeleteProvider();

  const handleDelete = () => {
    if (!provider) return;
    const toastId = toast.loading(t("admin.alerts.channels.providers.toast.deleting"));
    deleteProvider.mutate(provider.id, {
      onSuccess: () => {
        toast.success(t("admin.alerts.channels.providers.toast.deleteSuccess"), { id: toastId });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.alerts.channels.providers.toast.deleteFailed"), { id: toastId });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.alerts.channels.providers.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.alerts.channels.providers.delete.description", { name: provider?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("admin.alerts.channels.providers.delete.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProvider.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteProvider.isPending ? t("common.loading") : t("admin.alerts.channels.providers.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
