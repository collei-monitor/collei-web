import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { Server } from "@/types/server";
import { ServerApproval } from "@/types/server";

export function StatusBadge({ server }: { server: Server }) {
  const { t } = useTranslation();

  if (server.is_approved === ServerApproval.PENDING) {
    return <Badge variant="outline">{t("admin.nodes.status.pending")}</Badge>;
  }
  if (server.status === 1) {
    return (
      <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
        {t("admin.nodes.status.online")}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
      {t("admin.nodes.status.offline")}
    </Badge>
  );
}
