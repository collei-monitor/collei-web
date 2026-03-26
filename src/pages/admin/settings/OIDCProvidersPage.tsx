import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useOIDCProviders } from "@/services/oidc";
import type { OIDCProviderRead } from "@/services/oidc";
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
import { OIDCProviderDialog } from "./components/OIDCProviderDialog";
import { DeleteOIDCProviderDialog } from "./components/DeleteOIDCProviderDialog";

export default function OIDCProvidersPage() {
  const { t } = useTranslation();
  const tp = "admin.oidc";

  const {
    data: providers = [],
    isLoading,
    isError,
    refetch,
  } = useOIDCProviders();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<OIDCProviderRead | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<OIDCProviderRead | null>(null);

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t(`${tp}.toast.refreshing`),
      success: t(`${tp}.toast.refreshSuccess`),
      error: t(`${tp}.toast.refreshFailed`),
    });
  }, [refetch, t]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t(`${tp}.title`)}</h1>
            <p className="text-muted-foreground mt-1">{t(`${tp}.subtitle`)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t(`${tp}.refresh`)}</TooltipContent>
            </Tooltip>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t(`${tp}.add`)}
            </Button>
          </div>
        </div>

        {isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {t(`${tp}.fetchError`)}
          </div>
        )}

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(`${tp}.table.name`)}</TableHead>
                <TableHead>{t(`${tp}.table.type`)}</TableHead>
                <TableHead>{t(`${tp}.table.clientId`)}</TableHead>
                <TableHead>{t(`${tp}.table.secret`)}</TableHead>
                <TableHead>{t(`${tp}.table.enabled`)}</TableHead>
                <TableHead>{t(`${tp}.table.order`)}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {t(`${tp}.empty`)}
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {p.provider_type.charAt(0).toUpperCase() + p.provider_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">
                      {p.client_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.has_secret ? "default" : "destructive"}>
                        {p.has_secret ? t(`${tp}.table.secretSet`) : t(`${tp}.table.secretMissing`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.enabled === 1 ? "default" : "outline"}>
                        {p.enabled === 1 ? t(`${tp}.table.on`) : t(`${tp}.table.off`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.display_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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
                          <TooltipContent>{t("common.edit")}</TooltipContent>
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

      {/* Dialogs */}
      <OIDCProviderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <OIDCProviderDialog
        open={!!editProvider}
        onOpenChange={(v) => { if (!v) setEditProvider(null); }}
        editing={editProvider}
      />
      <DeleteOIDCProviderDialog
        provider={deleteProvider}
        open={!!deleteProvider}
        onOpenChange={(v) => { if (!v) setDeleteProvider(null); }}
      />
    </TooltipProvider>
  );
}
