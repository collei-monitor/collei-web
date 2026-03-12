import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useApproveServer, useUpdateServer } from "@/services/servers";
import type { Server } from "@/types/server";
import { ServerApproval, ServerVisibility } from "@/types/server";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Tags,
} from "lucide-react";

export function ServerActions({
  server,
  onDelete,
  onGroups,
}: {
  server: Server;
  onDelete: (s: Server) => void;
  onGroups: (s: Server) => void;
}) {
  const { t } = useTranslation();
  const approveServer = useApproveServer();
  const updateServer = useUpdateServer();

  const isPending = server.is_approved === ServerApproval.PENDING;
  const isHidden = server.hidden === ServerVisibility.HIDDEN;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t("admin.nodes.actions.open")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isPending && (
          <DropdownMenuItem
            onClick={() =>
              approveServer.mutate(server.uuid, {
                onSuccess: () => toast.success(t("admin.nodes.toast.approveSuccess")),
                onError: () => toast.error(t("admin.nodes.toast.approveFailed")),
              })
            }
            disabled={approveServer.isPending}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {t("admin.nodes.actions.approve")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onGroups(server)}>
          <Tags className="mr-2 h-4 w-4" />
          {t("admin.nodes.actions.groups")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            updateServer.mutate(
              { uuid: server.uuid, payload: { hidden: isHidden ? 0 : 1 } },
              {
                onSuccess: () =>
                  toast.success(
                    t(isHidden ? "admin.nodes.toast.showSuccess" : "admin.nodes.toast.hideSuccess"),
                  ),
                onError: () => toast.error(t("admin.nodes.toast.visibilityFailed")),
              },
            )
          }
        >
          {isHidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              {t("admin.nodes.actions.show")}
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              {t("admin.nodes.actions.hide")}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(server)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("admin.nodes.actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
