import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDeleteRule } from "@/services/notifications";
import type { AlertRuleRead } from "@/types/notification";
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
  rule: AlertRuleRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRuleDialog({ rule, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const deleteRule = useDeleteRule();

  const handleDelete = () => {
    if (!rule) return;
    const toastId = toast.loading(t("admin.alerts.rules.toast.deleting"));
    deleteRule.mutate(rule.id, {
      onSuccess: () => {
        toast.success(t("admin.alerts.rules.toast.deleteSuccess"), { id: toastId });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.alerts.rules.toast.deleteFailed"), { id: toastId });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.alerts.rules.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.alerts.rules.delete.description", { name: rule?.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("admin.alerts.rules.delete.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRule.isPending ? t("common.loading") : t("admin.alerts.rules.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
