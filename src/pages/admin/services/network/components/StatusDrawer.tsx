import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNetworkStatusLatest } from "@/services/network";
import type { NetworkTarget } from "@/types/network";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusDrawerProps {
  target: NetworkTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatLatency(ms: number | null): string {
  if (ms == null) return "—";
  return `${ms.toFixed(1)} ms`;
}

function formatPacketLoss(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function PacketLossBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs">
        {formatPacketLoss(value)}
      </Badge>
    );
  }
  if (value < 10) {
    return (
      <Badge className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 text-xs">
        {formatPacketLoss(value)}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="text-xs">
      {formatPacketLoss(value)}
    </Badge>
  );
}

export function StatusDrawer({ target, open, onOpenChange }: StatusDrawerProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { data: statuses = [], isLoading, refetch } = useNetworkStatusLatest(
    open && target ? target.id : null,
  );

  if (!target) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent className={isMobile ? "" : "sm:max-w-xl"}>
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>{t("admin.services.network.status.title")}</DrawerTitle>
              <DrawerDescription className="mt-1">
                {target.name} — {target.host}
              </DrawerDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 mr-2"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6">
          {isLoading ? (
            <div className="space-y-2 mt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : statuses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("admin.services.network.status.empty")}
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.services.network.status.serverName")}</TableHead>
                    <TableHead className="text-right">
                      {t("admin.services.network.status.medianLatency")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.services.network.status.maxLatency")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.services.network.status.minLatency")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.services.network.status.packetLoss")}
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      {t("admin.services.network.status.time")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map((s) => (
                    <TableRow key={s.server_uuid}>
                      <TableCell className="font-medium text-sm">{s.server_name}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatLatency(s.median_latency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatLatency(s.max_latency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatLatency(s.min_latency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <PacketLossBadge value={s.packet_loss} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatTime(s.time)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
