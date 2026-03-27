import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { useDnsRecords, useSyncDnsDomain } from "@/services/dns";
import type { DomainRead, RecordRead } from "@/types/dns";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateRecordDialog } from "./CreateRecordDialog";
import { EditRecordDialog } from "./EditRecordDialog";
import { DeleteRecordDialog } from "./DeleteRecordDialog";

interface Props {
  domain: DomainRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordsDialog({ domain, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const domainId = domain?.id ?? 0;
  const { data: records, isLoading } = useDnsRecords(open && domainId > 0 ? domainId : null);
  const syncDomain = useSyncDnsDomain();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<RecordRead | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<RecordRead | null>(null);

  const handleSync = () => {
    if (!domain) return;
    const toastId = toast.loading(t("admin.services.dns.records.toast.syncing"));
    syncDomain.mutate(domain.id, {
      onSuccess: () => {
        toast.success(t("admin.services.dns.records.toast.syncSuccess"), { id: toastId });
      },
      onError: (err) => {
        toast.error(err.message || t("admin.services.dns.records.toast.syncFailed"), { id: toastId });
      },
    });
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.services.dns.records.title")}</DialogTitle>
            <DialogDescription>
              {t("common.name", { domain: domain?.domain_name ?? "" })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncDomain.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${syncDomain.isPending ? "animate-spin" : ""}`} />
                    {t("admin.services.dns.records.sync")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("admin.services.dns.records.syncHint")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t("admin.services.dns.records.add")}
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !records?.length ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {t("admin.services.dns.records.empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.services.dns.records.table.name")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("admin.services.dns.records.table.content")}</TableHead>
                  <TableHead className="text-right">{t("admin.services.dns.records.table.ttl")}</TableHead>
                  <TableHead className="text-right">{t("admin.services.dns.records.table.priority")}</TableHead>
                  <TableHead>{t("admin.services.dns.records.table.proxied")}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-mono text-xs max-w-35 truncate">
                      {rec.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rec.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-50 truncate">
                      {rec.content}
                    </TableCell>
                    <TableCell className="text-right">{rec.ttl}</TableCell>
                    <TableCell className="text-right">{rec.priority ?? "-"}</TableCell>
                    <TableCell>
                      {rec.proxied ? t("admin.services.dns.records.proxiedOn") : t("admin.services.dns.records.proxiedOff")}
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
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

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
    </>
  );
}
