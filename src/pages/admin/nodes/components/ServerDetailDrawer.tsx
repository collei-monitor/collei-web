import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Server } from "@/types/server";
import { ServerStatus } from "@/types/server";
import { formatBytes } from "@/lib/display-utils";
import { FlagIcon } from "@/components/FlagIcon";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface ServerDetailDrawerProps {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function ServerDetailDrawer({
  server,
  open,
  onOpenChange,
}: ServerDetailDrawerProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (!server) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent className={isMobile ? "" : "sm:max-w-md"}>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {server.region && <FlagIcon region={server.region} size="md" />}
            {server.name}
          </DrawerTitle>
          <DrawerDescription>{t("admin.nodes.detail.title")}</DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {/* 基础信息 */}
          <section>
            <h4 className="text-sm font-medium mb-1">
              {t("admin.nodes.detail.basicInfo")}
            </h4>
            <Separator className="mb-2" />
            <DetailRow
              label={t("admin.nodes.detail.uuid")}
              value={<span className="font-mono text-xs">{server.uuid}</span>}
            />
            <DetailRow label={t("common.name")} value={server.name} />
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
          </section>

          {/* 硬件信息 */}
          <section>
            <h4 className="text-sm font-medium mb-1">
              {t("admin.nodes.detail.hardwareInfo")}
            </h4>
            <Separator className="mb-2" />
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
              label={t("admin.nodes.detail.diskTotal")}
              value={
                server.disk_total != null
                  ? formatBytes(server.disk_total)
                  : null
              }
            />
          </section>

          {/* 网络信息 */}
          <section>
            <h4 className="text-sm font-medium mb-1">
              {t("admin.nodes.detail.networkInfo")}
            </h4>
            <Separator className="mb-2" />
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
          </section>

          {/* 运行状态 */}
          <section>
            <h4 className="text-sm font-medium mb-1">
              {t("admin.nodes.detail.runtimeInfo")}
            </h4>
            <Separator className="mb-2" />
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
          </section>

          {/* 分组信息 */}
          <section>
            <h4 className="text-sm font-medium mb-1">
              {t("admin.nodes.detail.groupInfo")}
            </h4>
            <Separator className="mb-2" />
            {server.groups.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {server.groups.map((g) => (
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
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
