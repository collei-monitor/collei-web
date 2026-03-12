import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Server } from "@/types/server";
import { ServerStatus } from "@/types/server";
import { formatBytes } from "@/lib/display-utils";
import { FlagIcon } from "@/components/display/FlagIcon";
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
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

export function ServerDetailDrawer({ server, open, onOpenChange }: ServerDetailDrawerProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (!server) return null;

  const d = t("admin.nodes.detail", { returnObjects: true }) as Record<string, string>;

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
          <DrawerDescription>{d.title}</DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {/* 基础信息 */}
          <section>
            <h4 className="text-sm font-medium mb-1">{d.basicInfo}</h4>
            <Separator className="mb-2" />
            <DetailRow label={d.uuid} value={
              <span className="font-mono text-xs">{server.uuid}</span>
            } />
            <DetailRow label={d.name} value={server.name} />
            <DetailRow label={d.region} value={server.region ?? d.unknown} />
            <DetailRow label={d.os} value={server.os} />
            <DetailRow label={d.arch} value={server.arch} />
            <DetailRow label={d.kernelVersion} value={server.kernel_version} />
            <DetailRow label={d.virtualization} value={server.virtualization} />
            <DetailRow label={d.version} value={server.version} />
            <DetailRow label={d.remark} value={server.remark} />
            <DetailRow label={d.createdAt} value={formatTimestamp(server.created_at)} />
            <DetailRow label={d.statisticsMode} value={
              server.enable_statistics_mode ? d.enabled : d.disabled
            } />
          </section>

          {/* 硬件信息 */}
          <section>
            <h4 className="text-sm font-medium mb-1">{d.hardwareInfo}</h4>
            <Separator className="mb-2" />
            <DetailRow label={d.cpuName} value={server.cpu_name} />
            <DetailRow label={d.cpuCores} value={server.cpu_cores != null ? `${server.cpu_cores}` : null} />
            <DetailRow label={d.memTotal} value={server.mem_total != null ? formatBytes(server.mem_total) : null} />
            <DetailRow label={d.swapTotal} value={server.swap_total != null ? formatBytes(server.swap_total) : null} />
            <DetailRow label={d.diskTotal} value={server.disk_total != null ? formatBytes(server.disk_total) : null} />
          </section>

          {/* 网络信息 */}
          <section>
            <h4 className="text-sm font-medium mb-1">{d.networkInfo}</h4>
            <Separator className="mb-2" />
            <DetailRow label={d.ipv4} value={server.ipv4 ? <span className="font-mono text-xs">{server.ipv4}</span> : null} />
            <DetailRow label={d.ipv6} value={server.ipv6 ? <span className="font-mono text-xs">{server.ipv6}</span> : null} />
            <DetailRow label={d.totalFlowIn} value={server.total_flow_in != null ? formatBytes(server.total_flow_in) : null} />
            <DetailRow label={d.totalFlowOut} value={server.total_flow_out != null ? formatBytes(server.total_flow_out) : null} />
          </section>

          {/* 运行状态 */}
          <section>
            <h4 className="text-sm font-medium mb-1">{d.runtimeInfo}</h4>
            <Separator className="mb-2" />
            <DetailRow label={d.status} value={
              server.status === ServerStatus.ONLINE
                ? <Badge variant="default" className="bg-emerald-500">{t("admin.nodes.status.online")}</Badge>
                : <Badge variant="secondary">{t("admin.nodes.status.offline")}</Badge>
            } />
            <DetailRow label={d.lastOnline} value={formatTimestamp(server.last_online)} />
            <DetailRow label={d.bootTime} value={formatTimestamp(server.boot_time)} />
            <DetailRow label={d.currentRunId} value={
              server.current_run_id ? <span className="font-mono text-xs">{server.current_run_id}</span> : null
            } />
          </section>

          {/* 分组信息 */}
          <section>
            <h4 className="text-sm font-medium mb-1">{d.groupInfo}</h4>
            <Separator className="mb-2" />
            {server.groups.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {server.groups.map((g) => (
                  <Badge key={g.id} variant="secondary">{g.name}</Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{d.noGroup}</span>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
