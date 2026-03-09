import { useTranslation } from "react-i18next";
import { useDeleteServer } from "@/services/servers";
import type { Server } from "@/types/server";
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

export function DeleteServerDialog({
  server,
  open,
  onOpenChange,
}: {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const deleteServer = useDeleteServer();

  const handleDelete = () => {
    if (!server) return;
    deleteServer.mutate(server.uuid, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.nodes.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.nodes.delete.description", { name: server?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("admin.nodes.delete.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteServer.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteServer.isPending
              ? t("common.loading")
              : t("admin.nodes.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
