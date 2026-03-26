import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDnsDomains, useDnsCredentials } from "@/services/dns";
import type { DomainRead } from "@/types/dns";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CreateDomainDialog } from "../services/dns/components/dialogs/CreateDomainDialog";
import { EditDomainDialog } from "../services/dns/components/dialogs/EditDomainDialog";
import { DeleteDomainDialog } from "../services/dns/components/dialogs/DeleteDomainDialog";

export default function DomainsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: domains = [],
    isLoading,
    isError,
  } = useDnsDomains();

  const { data: credentials = [] } = useDnsCredentials();

  const credMap = useMemo(
    () => new Map(credentials.map((c) => [c.id, c])),
    [credentials],
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editDomain, setEditDomain] = useState<DomainRead | null>(null);
  const [deleteDomain, setDeleteDomain] = useState<DomainRead | null>(null);

  const formatTime = useCallback((ts: number | null) => {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleString();
  }, []);

  const tp = "admin.services.dns.domains";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t(`${tp}.title`)}
            </h1>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t(`${tp}.add`)}
          </Button>
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
                <TableHead>{t(`${tp}.table.domain`)}</TableHead>
                <TableHead>{t(`${tp}.table.credential`)}</TableHead>
                <TableHead>{t(`${tp}.table.syncStatus`)}</TableHead>
                <TableHead>{t(`${tp}.table.lastSync`)}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : domains.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {t(`${tp}.empty`)}
                  </TableCell>
                </TableRow>
              ) : (
                domains.map((dom) => {
                  const cred = dom.credential_id ? credMap.get(dom.credential_id) : null;
                  return (
                    <TableRow
                      key={dom.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/dns/domains/${dom.id}`)}
                    >
                      <TableCell className="font-medium">{dom.domain_name}</TableCell>
                      <TableCell>{cred?.name ?? t(`${tp}.noCredential`)}</TableCell>
                      <TableCell>
                        <Badge variant={dom.sync_status === "synced" ? "default" : "secondary"}>
                          {dom.sync_status === "synced"
                            ? t(`${tp}.syncSynced`)
                            : t(`${tp}.syncPending`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {dom.last_sync_at
                          ? formatTime(dom.last_sync_at)
                          : t(`${tp}.neverSynced`)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditDomain(dom)}
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
                                onClick={() => setDeleteDomain(dom)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("common.delete")}</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateDomainDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditDomainDialog
        domain={editDomain}
        open={!!editDomain}
        onOpenChange={(v) => { if (!v) setEditDomain(null); }}
      />
      <DeleteDomainDialog
        domain={deleteDomain}
        open={!!deleteDomain}
        onOpenChange={(v) => { if (!v) setDeleteDomain(null); }}
      />
    </TooltipProvider>
  );
}
