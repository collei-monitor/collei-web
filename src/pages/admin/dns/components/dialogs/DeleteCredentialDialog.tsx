import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteDnsCredential } from "@/services/dns";
import type { CredentialRead } from "@/types/dns";
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
  credential: CredentialRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCredentialDialog({ credential, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const deleteCredential = useDeleteDnsCredential();

  const handleDelete = () => {
    if (!credential) return;
    const toastId = toast.loading(t("admin.services.dns.credentials.toast.deleting"));
    deleteCredential.mutate(credential.id, {
      onSuccess: () => {
        toast.success(t("admin.services.dns.credentials.toast.deleteSuccess"), { id: toastId });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.services.dns.credentials.toast.deleteFailed"), { id: toastId });
      },
    });
  };


  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.services.dns.credentials.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.services.dns.credentials.delete.description", { name: credential?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteCredential.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteCredential.isPending ? t("common.loading") : t("common.confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
