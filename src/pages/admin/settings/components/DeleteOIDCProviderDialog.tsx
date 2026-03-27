import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteOIDC } from "@/services/oidc";
import type { OIDCProviderRead } from "@/services/oidc";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  provider: OIDCProviderRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteOIDCProviderDialog({ provider, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const deleteOIDC = useDeleteOIDC();

  const handleDelete = () => {
    if (!provider) return;
    const toastId = toast.loading(t("common.deleting"));
    deleteOIDC.mutate(provider.name, {
      onSuccess: () => {
        toast.success(t("admin.oidc.toast.deleteSuccess"), { id: toastId });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("common.deleteFailed"), { id: toastId });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.oidc.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.oidc.delete.description", { name: provider?.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteOIDC.isPending}
          >
            {t("common.delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
