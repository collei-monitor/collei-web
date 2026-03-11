import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteChannel } from "@/services/notifications";
import type { AlertChannelRead } from "@/types/notification";
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
  channel: AlertChannelRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteChannelDialog({ channel, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const deleteChannel = useDeleteChannel();

  const handleDelete = () => {
    if (!channel) return;
    const toastId = toast.loading(t("admin.alerts.channels.channels.toast.deleting"));
    deleteChannel.mutate(channel.id, {
      onSuccess: () => {
        toast.success(t("admin.alerts.channels.channels.toast.deleteSuccess"), { id: toastId });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.alerts.channels.channels.toast.deleteFailed"), { id: toastId });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.alerts.channels.channels.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.alerts.channels.channels.delete.description", { name: channel?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("admin.alerts.channels.channels.delete.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteChannel.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteChannel.isPending ? t("common.loading") : t("admin.alerts.channels.channels.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
