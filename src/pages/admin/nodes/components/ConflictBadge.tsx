import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import type { ServerConflict } from "@/types/server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConflictBadge({
  conflict,
  currentRunId,
}: {
  conflict: ServerConflict;
  currentRunId: string | null;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            <TriangleAlert className="h-3.5 w-3.5 text-red-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t("admin.nodes.conflict.badge")}</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-4 w-4" />
              {t("admin.nodes.conflict.title")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.nodes.conflict.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
              <span className="text-muted-foreground whitespace-nowrap">
                {t("admin.nodes.conflict.conflictRunId")}
              </span>
              <span className="font-mono text-xs break-all text-destructive">
                {conflict.run_id}
              </span>

              <span className="text-muted-foreground whitespace-nowrap">
                {t("admin.nodes.conflict.conflictIp")}
              </span>
              <span className="font-mono text-xs">{conflict.ip}</span>

              <span className="text-muted-foreground whitespace-nowrap">
                {t("admin.nodes.conflict.lastSeen")}
              </span>
              <span className="text-xs">
                {new Date(conflict.last_seen * 1000).toLocaleString()}
              </span>

              {currentRunId && (
                <>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {t("admin.nodes.conflict.currentRunId")}
                  </span>
                  <span className="font-mono text-xs break-all text-muted-foreground">
                    {currentRunId}
                  </span>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
