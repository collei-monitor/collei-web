import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useDnsRecords, useSyncDnsDomain, useDnsDomains } from "@/services/dns";
import type { RecordRead } from "@/types/dns";
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
import { ArrowLeft, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { CreateRecordDialog } from "../services/dns/components/dialogs/CreateRecordDialog";
import { EditRecordDialog } from "../services/dns/components/dialogs/EditRecordDialog";
import { DeleteRecordDialog } from "../services/dns/components/dialogs/DeleteRecordDialog";

export default function DomainDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const domainId = Number(id);

  const { data: domains = [] } = useDnsDomains();
  const domain = domains.find((d) => d.id === domainId) ?? null;

  const { data: records, isLoading } = useDnsRecords(domainId > 0 ? domainId : null);
  const syncDomain = useSyncDnsDomain();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<RecordRead | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<RecordRead | null>(null);

  const handleSync = () => {
    if (!domainId) return;
    const toastId = toast.loading(t("admin.services.dns.records.toast.syncing"));
    syncDomain.mutate(domainId, {
      onSuccess: () => {
        toast.success(t("admin.services.dns.records.toast.syncSuccess"), { id: toastId });
      },
      onError: (err) => {
        toast.error(err.message || t("admin.services.dns.records.toast.syncFailed"), { id: toastId });
      },
    });
  };

  const tp = "admin.services.dns.records";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dns/domains")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {domain?.domain_name ?? t(`${tp}.title`)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncDomain.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${syncDomain.isPending ? "animate-spin" : ""}`} />
                  {t(`${tp}.sync`)}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t(`${tp}.syncHint`)}</TooltipContent>
            </Tooltip>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t(`${tp}.add`)}
            </Button>
          </div>
        </div>

        {/* Records table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(`${tp}.table.name`)}</TableHead>
                <TableHead>{t(`${tp}.table.type`)}</TableHead>
                <TableHead>{t(`${tp}.table.content`)}</TableHead>
                <TableHead className="text-right">{t(`${tp}.table.ttl`)}</TableHead>
                <TableHead className="text-right">{t(`${tp}.table.priority`)}</TableHead>
                <TableHead>{t(`${tp}.table.proxied`)}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  </TableRow>
                ))
              ) : !records?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {t(`${tp}.empty`)}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-mono text-xs max-w-40 truncate">{rec.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rec.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-55 truncate">{rec.content}</TableCell>
                    <TableCell className="text-right">{rec.ttl}</TableCell>
                    <TableCell className="text-right">{rec.priority ?? "-"}</TableCell>
                    <TableCell>
                      {rec.proxied ? t(`${tp}.proxiedOn`) : t(`${tp}.proxiedOff`)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditRecord(rec)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteRecord(rec)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {domainId > 0 && (
        <>
          <CreateRecordDialog
            domainId={domainId}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
          <EditRecordDialog
            record={editRecord}
            domainId={domainId}
            open={!!editRecord}
            onOpenChange={(v) => { if (!v) setEditRecord(null); }}
          />
          <DeleteRecordDialog
            record={deleteRecord}
            domainId={domainId}
            open={!!deleteRecord}
            onOpenChange={(v) => { if (!v) setDeleteRecord(null); }}
          />
        </>
      )}
    </TooltipProvider>
  );
}
