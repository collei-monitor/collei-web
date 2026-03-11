import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useProviders, useChannels, useTestChannel } from "@/services/notifications";
import type { ProviderRead, AlertChannelRead } from "@/types/notification";
import { Button } from "@/components/ui/button";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Plus, Pencil, Trash2, Send } from "lucide-react";
import { CreateProviderDialog } from "./components/dialogs/CreateProviderDialog";
import { EditProviderDialog } from "./components/dialogs/EditProviderDialog";
import { DeleteProviderDialog } from "./components/dialogs/DeleteProviderDialog";
import { CreateChannelDialog } from "./components/dialogs/CreateChannelDialog";
import { EditChannelDialog } from "./components/dialogs/EditChannelDialog";
import { DeleteChannelDialog } from "./components/dialogs/DeleteChannelDialog";

export default function NotificationChannelsPage() {
  const { t } = useTranslation();

  const {
    data: providers = [],
    isLoading: providersLoading,
    isError: providersError,
    refetch: refetchProviders,
  } = useProviders();

  const {
    data: channels = [],
    isLoading: channelsLoading,
    isError: channelsError,
    refetch: refetchChannels,
  } = useChannels();

  // Provider dialogs
  const [createProviderOpen, setCreateProviderOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<ProviderRead | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<ProviderRead | null>(null);

  // Channel dialogs
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [editChannel, setEditChannel] = useState<AlertChannelRead | null>(null);
  const [deleteChannel, setDeleteChannel] = useState<AlertChannelRead | null>(null);
  const [testingChannelId, setTestingChannelId] = useState<number | null>(null);

  const { mutate: testChannel, isPending: isTesting } = useTestChannel();

  const handleTestChannel = useCallback((ch: AlertChannelRead) => {
    setTestingChannelId(ch.id);
    toast.promise(
      new Promise<void>((resolve, reject) => {
        testChannel(ch.id, {
          onSuccess: () => { setTestingChannelId(null); resolve(); },
          onError: (err) => { setTestingChannelId(null); reject(err); },
        });
      }),
      {
        loading: t("admin.alerts.channels.channels.toast.testing"),
        success: t("admin.alerts.channels.channels.toast.testSuccess"),
        error: (err) => err?.message || t("admin.alerts.channels.channels.toast.testFailed"),
      },
    );
  }, [testChannel, t]);

  const handleRefresh = useCallback(() => {
    toast.promise(Promise.all([refetchProviders(), refetchChannels()]), {
      loading: t("admin.alerts.channels.toast.refreshing"),
      success: t("admin.alerts.channels.toast.refreshSuccess"),
      error: t("admin.alerts.channels.toast.refreshFailed"),
    });
  }, [refetchProviders, refetchChannels, t]);

  const isLoading = providersLoading || channelsLoading;
  const isError = providersError || channelsError;

  const providerMap = useMemo(
    () => new Map(providers.map((p) => [p.id, p])),
    [providers],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.alerts.channels.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.alerts.channels.subtitle")}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("admin.alerts.channels.refresh")}</TooltipContent>
        </Tooltip>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.alerts.channels.fetchError")}
        </div>
      )}

      {/* Providers Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("admin.alerts.channels.providers.title")}</h2>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateProviderOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("admin.alerts.channels.providers.add")}
          </Button>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.alerts.channels.providers.table.name")}</TableHead>
                <TableHead>{t("admin.alerts.channels.providers.table.type")}</TableHead>
                <TableHead>{t("admin.alerts.channels.providers.table.config")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    {t("admin.alerts.channels.providers.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name ?? "—"}</TableCell>
                    <TableCell>{p.type ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs max-w-xs truncate">
                      {p.addition || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditProvider(p)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("admin.groups.actions.edit")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteProvider(p)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("admin.groups.actions.delete")}</TooltipContent>
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

      {/* Channels Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("admin.alerts.channels.channels.title")}</h2>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateChannelOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("admin.alerts.channels.channels.add")}
          </Button>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>{t("admin.alerts.channels.channels.table.name")}</TableHead>
                <TableHead>{t("admin.alerts.channels.channels.table.provider")}</TableHead>
                <TableHead>{t("admin.alerts.channels.channels.table.target")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : channels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {t("admin.alerts.channels.channels.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                channels.map((ch) => (
                  <TableRow key={ch.id}>
                    <TableCell className="text-muted-foreground">{ch.id}</TableCell>
                    <TableCell className="font-medium">{ch.name}</TableCell>
                  <TableCell>{(() => {
                    const prov = providerMap.get(ch.provider_id);
                    return prov?.name ?? prov?.type ?? `#${ch.provider_id}`;
                  })()}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs max-w-xs truncate">
                      {ch.target || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleTestChannel(ch)}
                              disabled={isTesting}
                            >
                              {testingChannelId === ch.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("admin.alerts.channels.channels.test")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditChannel(ch)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("admin.groups.actions.edit")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteChannel(ch)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("admin.groups.actions.delete")}</TooltipContent>
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

      {/* Provider Dialogs */}
      <CreateProviderDialog open={createProviderOpen} onOpenChange={setCreateProviderOpen} />
      <EditProviderDialog
        key={editProvider?.id}
        provider={editProvider}
        open={!!editProvider}
        onOpenChange={(v) => !v && setEditProvider(null)}
      />
      <DeleteProviderDialog
        provider={deleteProvider}
        open={!!deleteProvider}
        onOpenChange={(v) => !v && setDeleteProvider(null)}
      />

      {/* Channel Dialogs */}
      <CreateChannelDialog open={createChannelOpen} onOpenChange={setCreateChannelOpen} />
      <EditChannelDialog
        key={editChannel?.id}
        channel={editChannel}
        open={!!editChannel}
        onOpenChange={(v) => !v && setEditChannel(null)}
      />
      <DeleteChannelDialog
        channel={deleteChannel}
        open={!!deleteChannel}
        onOpenChange={(v) => !v && setDeleteChannel(null)}
      />
    </div>
  );
}
