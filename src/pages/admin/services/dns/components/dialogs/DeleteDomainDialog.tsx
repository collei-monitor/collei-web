import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteDnsDomain } from "@/services/dns";
import type { DomainRead } from "@/types/dns";
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
  domain: DomainRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDomainDialog({ domain, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const deleteDomain = useDeleteDnsDomain();

  const handleDelete = () => {
    if (!domain) return;

    const toastId = toast.loading(t("admin.services.dns.domains.toast.deleting"));
    deleteDomain.mutate(domain.id, {
      onSuccess: () => {
        toast.success(t("admin.services.dns.domains.toast.deleteSuccess"), { id: toastId });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.services.dns.domains.toast.deleteFailed"), { id: toastId });
      },
    });
  };

  const tp = "admin.services.dns.domains";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`${tp}.delete.title`)}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(`${tp}.delete.description`, { name: domain?.domain_name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteDomain.isPending}>
            {t(`${tp}.delete.cancel`)}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteDomain.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteDomain.isPending ? t("common.loading") : t(`${tp}.delete.confirm`)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
