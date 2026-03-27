import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteDnsRecord } from "@/services/dns";
import type { RecordRead } from "@/types/dns";
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
  record: RecordRead | null;
  domainId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRecordDialog({ record, domainId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const deleteRecord = useDeleteDnsRecord();

  const handleDelete = () => {
    if (!record) return;

    const toastId = toast.loading(t("admin.services.dns.records.toast.deleting"));
    deleteRecord.mutate(
      { recId: record.id, domainId },
      {
        onSuccess: () => {
          toast.success(t("admin.services.dns.records.toast.deleteSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.services.dns.records.toast.deleteFailed"), { id: toastId });
        },
      }
    );
  };


  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.services.dns.records.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.services.dns.records.delete.description", {
              name: record?.name ?? "",
              type: record?.type ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRecord.isPending}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRecord.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRecord.isPending ? t("common.loading") : t("common.confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
