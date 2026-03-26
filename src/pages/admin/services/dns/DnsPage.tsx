import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useDnsCredentials,
  useDnsDomains,
  useDdnsTasks,
} from "@/services/dns";
import { useServers } from "@/services/servers";
import type {
  CredentialRead,
  DomainRead,
  DdnsTaskRead,
} from "@/types/dns";
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
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  List,
} from "lucide-react";

import { CreateCredentialDialog } from "./components/dialogs/CreateCredentialDialog";
import { EditCredentialDialog } from "./components/dialogs/EditCredentialDialog";
import { DeleteCredentialDialog } from "./components/dialogs/DeleteCredentialDialog";
import { CreateDomainDialog } from "./components/dialogs/CreateDomainDialog";
import { EditDomainDialog } from "./components/dialogs/EditDomainDialog";
import { DeleteDomainDialog } from "./components/dialogs/DeleteDomainDialog";
import { RecordsDialog } from "./components/dialogs/RecordsDialog";
import { CreateDdnsTaskDialog } from "./components/dialogs/CreateDdnsTaskDialog";
import { EditDdnsTaskDialog } from "./components/dialogs/EditDdnsTaskDialog";
import { DeleteDdnsTaskDialog } from "./components/dialogs/DeleteDdnsTaskDialog";

export default function DnsPage() {
  const { t } = useTranslation();

  // ── data queries ──────────────────────────────────────────────────────────
  const {
    data: credentials = [],
    isLoading: credsLoading,
    isError: credsError,
    refetch: refetchCreds,
  } = useDnsCredentials();

  const {
    data: domains = [],
    isLoading: domainsLoading,
    isError: domainsError,
    refetch: refetchDomains,
  } = useDnsDomains();

  const {
    data: ddnsTasks = [],
    isLoading: ddnsLoading,
    isError: ddnsError,
    refetch: refetchDdns,
  } = useDdnsTasks({ refetchInterval: 30_000 });

  const { data: servers = [] } = useServers();

  // ── lookup maps ───────────────────────────────────────────────────────────
  const credMap = useMemo(
    () => new Map(credentials.map((c) => [c.id, c])),
    [credentials],
  );
  const serverMap = useMemo(
    () => new Map(servers.map((s) => [s.uuid, s])),
    [servers],
  );

  // ── credential dialogs ────────────────────────────────────────────────────
  const [createCredOpen, setCreateCredOpen] = useState(false);
  const [editCred, setEditCred] = useState<CredentialRead | null>(null);
  const [deleteCred, setDeleteCred] = useState<CredentialRead | null>(null);

  // ── domain dialogs ────────────────────────────────────────────────────────
  const [createDomainOpen, setCreateDomainOpen] = useState(false);
  const [editDomain, setEditDomain] = useState<DomainRead | null>(null);
  const [deleteDomain, setDeleteDomain] = useState<DomainRead | null>(null);
  const [recordsDomain, setRecordsDomain] = useState<DomainRead | null>(null);

  // ── DDNS task dialogs ─────────────────────────────────────────────────────
  const [createDdnsOpen, setCreateDdnsOpen] = useState(false);
  const [editDdnsTask, setEditDdnsTask] = useState<DdnsTaskRead | null>(null);
  const [deleteDdnsTask, setDeleteDdnsTask] = useState<DdnsTaskRead | null>(null);

  // ── refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    toast.promise(
      Promise.all([refetchCreds(), refetchDomains(), refetchDdns()]),
      {
        loading: t("admin.services.dns.credentials.toast.refreshing"),
        success: t("admin.services.dns.credentials.toast.refreshSuccess"),
        error: t("admin.services.dns.credentials.toast.refreshFailed"),
      },
    );
  }, [refetchCreds, refetchDomains, refetchDdns, t]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const isLoading = credsLoading || domainsLoading || ddnsLoading;
  const isError = credsError || domainsError || ddnsError;

  const formatTime = (ts: number | null) => {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleString();
  };

  const tp = "admin.services.dns";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t(`${tp}.title`)}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t(`${tp}.subtitle`)}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t(`${tp}.refresh`)}</TooltipContent>
          </Tooltip>
        </div>

        {isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {t(`${tp}.fetchError`)}
          </div>
        )}

        {/* ── Credentials Section ─────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t(`${tp}.credentials.title`)}</h2>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateCredOpen(true)}>
              <Plus className="h-4 w-4" />
              {t(`${tp}.credentials.add`)}
            </Button>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(`${tp}.credentials.table.name`)}</TableHead>
                  <TableHead>{t(`${tp}.credentials.table.provider`)}</TableHead>
                  <TableHead>{t(`${tp}.credentials.table.valid`)}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
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
                      {t(`${tp}.credentials.empty`)}
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
                            ? t(`${tp}.credentials.validBadge`)
                            : t(`${tp}.credentials.invalidBadge`)}
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
        </section>

        {/* ── Domains Section ─────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t(`${tp}.domains.title`)}</h2>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateDomainOpen(true)}>
              <Plus className="h-4 w-4" />
              {t(`${tp}.domains.add`)}
            </Button>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(`${tp}.domains.table.domain`)}</TableHead>
                  <TableHead>{t(`${tp}.domains.table.credential`)}</TableHead>
                  <TableHead>{t(`${tp}.domains.table.syncStatus`)}</TableHead>
                  <TableHead>{t(`${tp}.domains.table.lastSync`)}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
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
                      {t(`${tp}.domains.empty`)}
                    </TableCell>
                  </TableRow>
                ) : (
                  domains.map((dom) => {
                    const cred = dom.credential_id ? credMap.get(dom.credential_id) : null;
                    return (
                      <TableRow key={dom.id}>
                        <TableCell className="font-medium">{dom.domain_name}</TableCell>
                        <TableCell>{cred?.name ?? t(`${tp}.domains.noCredential`)}</TableCell>
                        <TableCell>
                          <Badge variant={dom.sync_status === "synced" ? "default" : "secondary"}>
                            {dom.sync_status === "synced"
                              ? t(`${tp}.domains.syncSynced`)
                              : t(`${tp}.domains.syncPending`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {dom.last_sync_at
                            ? formatTime(dom.last_sync_at)
                            : t(`${tp}.domains.neverSynced`)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setRecordsDomain(dom)}
                                >
                                  <List className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t(`${tp}.records.title`)}</TooltipContent>
                            </Tooltip>
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
        </section>

        {/* ── DDNS Tasks Section ──────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t(`${tp}.ddns.title`)}</h2>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateDdnsOpen(true)}>
              <Plus className="h-4 w-4" />
              {t(`${tp}.ddns.add`)}
            </Button>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(`${tp}.ddns.table.record`)}</TableHead>
                  <TableHead>{t(`${tp}.ddns.table.server`)}</TableHead>
                  <TableHead>{t(`${tp}.ddns.table.ipVersion`)}</TableHead>
                  <TableHead>{t(`${tp}.ddns.table.lastIp`)}</TableHead>
                  <TableHead>{t(`${tp}.ddns.table.active`)}</TableHead>
                  <TableHead>{t(`${tp}.ddns.table.lastUpdated`)}</TableHead>
                  <TableHead>{t(`${tp}.ddns.table.lastError`)}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : ddnsTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      {t(`${tp}.ddns.empty`)}
                    </TableCell>
                  </TableRow>
                ) : (
                  ddnsTasks.map((task) => {
                    const server = serverMap.get(task.server_uuid);
                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-mono text-xs">#{task.record_id}</TableCell>
                        <TableCell>{server?.name ?? task.server_uuid}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.ip_version.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {task.last_ip ?? t(`${tp}.ddns.noIp`)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.is_active ? "default" : "secondary"}>
                            {task.is_active
                              ? t(`${tp}.ddns.activeBadge`)
                              : t(`${tp}.ddns.inactiveBadge`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatTime(task.last_updated)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-50 truncate">
                          {task.last_error ?? t(`${tp}.ddns.noError`)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditDdnsTask(task)}
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
                                  onClick={() => setDeleteDdnsTask(task)}
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
        </section>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <CreateCredentialDialog open={createCredOpen} onOpenChange={setCreateCredOpen} />
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

      <CreateDomainDialog open={createDomainOpen} onOpenChange={setCreateDomainOpen} />
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
      <RecordsDialog
        domain={recordsDomain}
        open={!!recordsDomain}
        onOpenChange={(v) => { if (!v) setRecordsDomain(null); }}
      />

      <CreateDdnsTaskDialog open={createDdnsOpen} onOpenChange={setCreateDdnsOpen} />
      <EditDdnsTaskDialog
        task={editDdnsTask}
        open={!!editDdnsTask}
        onOpenChange={(v) => { if (!v) setEditDdnsTask(null); }}
      />
      <DeleteDdnsTaskDialog
        task={deleteDdnsTask}
        open={!!deleteDdnsTask}
        onOpenChange={(v) => { if (!v) setDeleteDdnsTask(null); }}
      />
    </TooltipProvider>
  );
}
