import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useServer } from "@/services/servers";
import type { Server } from "@/types/server";
import { ServerStatus } from "@/types/server";
import { formatBytes } from "@/lib/display-utils";
import { FlagIcon } from "@/components/FlagIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right break-all">{value ?? "—"}</span>
    </div>
  );
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

function ServerDetailContent({ server }: { server: Server }) {
  const { t } = useTranslation();
  const diskIO = server.current_disk_io ?? [];
  const netIO = server.current_net_io ?? [];

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="flex items-center gap-3">
        {server.region && <FlagIcon region={server.region} size="lg" />}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{server.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {server.uuid}
          </p>
        </div>
        <div className="ml-auto">
          {server.status === ServerStatus.ONLINE ? (
            <Badge variant="default" className="bg-emerald-500">
              {t("admin.nodes.status.online")}
            </Badge>
          ) : (
            <Badge variant="secondary">{t("admin.nodes.status.offline")}</Badge>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* 基础信息 */}
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("admin.nodes.detail.basicInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label={t("admin.nodes.detail.region")}
              value={server.region ?? t("admin.nodes.detail.unknown")}
            />
            <DetailRow label={t("admin.nodes.detail.os")} value={server.os} />
            <DetailRow
              label={t("admin.nodes.detail.arch")}
              value={server.arch}
            />
            <DetailRow
              label={t("admin.nodes.detail.kernelVersion")}
              value={server.kernel_version}
            />
            <DetailRow
              label={t("admin.nodes.detail.virtualization")}
              value={server.virtualization}
            />
            <DetailRow
              label={t("admin.nodes.detail.version")}
              value={server.version}
            />
            <DetailRow
              label={t("admin.nodes.detail.remark")}
              value={server.remark}
            />
            <DetailRow
              label={t("admin.nodes.detail.createdAt")}
              value={formatTimestamp(server.created_at)}
            />
            <DetailRow
              label={t("admin.nodes.detail.statisticsMode")}
              value={
                server.enable_statistics_mode
                  ? t("admin.nodes.detail.enabled")
                  : t("admin.nodes.detail.disabled")
              }
            />
          </CardContent>
        </Card>

        {/* 硬件信息 */}
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("admin.nodes.detail.hardwareInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label={t("admin.nodes.detail.cpuName")}
              value={server.cpu_name}
            />
            <DetailRow
              label={t("admin.nodes.detail.cpuCores")}
              value={server.cpu_cores != null ? `${server.cpu_cores}` : null}
            />
            <DetailRow
              label={t("admin.nodes.detail.memTotal")}
              value={
                server.mem_total != null ? formatBytes(server.mem_total) : null
              }
            />
            <DetailRow
              label={t("admin.nodes.detail.swapTotal")}
              value={
                server.swap_total != null
                  ? formatBytes(server.swap_total)
                  : null
              }
            />
            <DetailRow
              label={t("admin.nodes.detail.diskTotaL")}
              value={
                server.disk_total != null
                  ? formatBytes(server.disk_total)
                  : null
              }
            />
          </CardContent>
        </Card>

        {/* 网络信息 */}
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("admin.nodes.detail.networkInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label={t("admin.nodes.detail.ipv4")}
              value={
                server.ipv4 ? (
                  <span className="font-mono text-xs">{server.ipv4}</span>
                ) : null
              }
            />
            <DetailRow
              label={t("admin.nodes.detail.ipv6")}
              value={
                server.ipv6 ? (
                  <span className="font-mono text-xs">{server.ipv6}</span>
                ) : null
              }
            />
            <DetailRow
              label={t("admin.nodes.detail.totalFlowIn")}
              value={
                server.total_flow_in != null
                  ? formatBytes(server.total_flow_in)
                  : null
              }
            />
            <DetailRow
              label={t("admin.nodes.detail.totalFlowOut")}
              value={
                server.total_flow_out != null
                  ? formatBytes(server.total_flow_out)
                  : null
              }
            />
          </CardContent>
        </Card>

        {/* 运行状态 */}
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("admin.nodes.detail.runtimeInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label={t("common.status")}
              value={
                server.status === ServerStatus.ONLINE ? (
                  <Badge variant="default" className="bg-emerald-500">
                    {t("admin.nodes.status.online")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {t("admin.nodes.status.offline")}
                  </Badge>
                )
              }
            />
            <DetailRow
              label={t("admin.nodes.detail.lastOnline")}
              value={formatTimestamp(server.last_online)}
            />
            <DetailRow
              label={t("admin.nodes.detail.bootTime")}
              value={formatTimestamp(server.boot_time)}
            />
            <DetailRow
              label={t("admin.nodes.detail.currentRunId")}
              value={
                server.current_run_id ? (
                  <span className="font-mono text-xs">
                    {server.current_run_id}
                  </span>
                ) : null
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* 分组信息 */}
      {/* <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t("admin.nodes.detail.groupInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(server.groups ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {(server.groups ?? []).map((g) => (
                <Badge key={g.id} variant="secondary">
                  {g.name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("admin.nodes.detail.noGroup")}
            </span>
          )}
        </CardContent>
      </Card> */}

      {/* 磁盘 IO */}
      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("admin.nodes.detail.diskIO")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diskIO.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.nodes.detail.diskMount")}</TableHead>
                    <TableHead>{t("admin.nodes.detail.diskFs")}</TableHead>
                    <TableHead>{t("admin.nodes.detail.diskUsed")}</TableHead>
                    <TableHead>{t("admin.nodes.detail.diskTotaL")}</TableHead>
                    <TableHead className="w-48">
                      {t("admin.nodes.detail.diskUsage")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diskIO.map((d) => {
                    const percent = d.total > 0 ? (d.used / d.total) * 100 : 0;
                    return (
                      <TableRow key={d.mount}>
                        <TableCell className="font-mono text-xs">
                          {d.mount}
                        </TableCell>
                        <TableCell className="text-xs">{d.fs}</TableCell>
                        <TableCell className="text-xs">
                          {formatBytes(d.used)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatBytes(d.total)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={percent} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {percent.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("admin.nodes.detail.noData")}
            </span>
          )}
        </CardContent>
      </Card>

      {/* 网络 IO */}
      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("admin.nodes.detail.netIO")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {netIO.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("admin.nodes.detail.netInterface")}
                    </TableHead>
                    <TableHead>{t("admin.nodes.detail.netRx")}</TableHead>
                    <TableHead>{t("admin.nodes.detail.netTx")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {netIO.map((n) => (
                    <TableRow key={n.name}>
                      <TableCell className="font-mono text-xs">
                        {n.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatBytes(n.rx_bytes)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatBytes(n.tx_bytes)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("admin.nodes.detail.noData")}
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminServerDetailPage() {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const {
    data: server,
    isLoading,
    refetch,
  } = useServer(uuid ?? null, { refetchInterval: 5000 });

  const handleRefresh = () => {
    toast.promise(refetch(), {
      loading: t("common.refreshing"),
      success: t("common.refreshSuccess"),
      error: t("common.refreshFailed"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/admin/nodes")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("admin.nodes.detail.backToList")}
        </Button>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : !server ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t("detail.notFound")}
          </p>
        </div>
      ) : (
        <ServerDetailContent server={server} />
      )}
    </div>
  );
}
