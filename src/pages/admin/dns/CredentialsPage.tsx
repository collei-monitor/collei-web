import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDnsCredentials } from "@/services/dns";
import type { CredentialRead } from "@/types/dns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { CreateCredentialDialog } from "./components/dialogs/CreateCredentialDialog";
import { EditCredentialDialog } from "./components/dialogs/EditCredentialDialog";
import { DeleteCredentialDialog } from "./components/dialogs/DeleteCredentialDialog";

export default function CredentialsPage() {
  const { t } = useTranslation();

  const {
    data: credentials = [],
    isLoading,
    isError,
    refetch,
  } = useDnsCredentials();

  const [createOpen, setCreateOpen] = useState(false);
  const [editCred, setEditCred] = useState<CredentialRead | null>(null);
  const [deleteCred, setDeleteCred] = useState<CredentialRead | null>(null);

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("common.refreshing"),
      success: t("admin.services.dns.credentials.toast.refreshSuccess"),
      error: t("common.refreshFailed"),
    });
  }, [refetch, t]);


  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.services.dns.credentials.title")}
          </h1>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("common.refreshList")}</TooltipContent>
            </Tooltip>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("admin.services.dns.credentials.add")}
            </Button>
          </div>
        </div>

        {isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {t("admin.services.dns.fetchError")}
          </div>
        )}

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("admin.services.dns.credentials.table.provider")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : credentials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {t("admin.services.dns.credentials.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                credentials.map((cred) => (
                  <TableRow key={cred.id}>
                    <TableCell className="font-medium">{cred.name}</TableCell>
                    <TableCell>{cred.provider}</TableCell>
                    <TableCell>
                      <Badge variant={cred.is_valid ? "default" : "destructive"}>
                        {cred.is_valid
                          ? t("admin.services.dns.credentials.validBadge")
                          : t("admin.services.dns.credentials.invalidBadge")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditCred(cred)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("common.edit")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteCred(cred)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("common.delete")}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateCredentialDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditCredentialDialog
        credential={editCred}
        open={!!editCred}
        onOpenChange={(v) => { if (!v) setEditCred(null); }}
      />
      <DeleteCredentialDialog
        credential={deleteCred}
        open={!!deleteCred}
        onOpenChange={(v) => { if (!v) setDeleteCred(null); }}
      />
    </TooltipProvider>
  );
}
