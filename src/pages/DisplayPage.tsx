import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List, WifiOff, Wifi } from "lucide-react";
import { DisplayHeader } from "@/components/display/DisplayHeader";
import { ServerCard } from "@/components/display/ServerCard";
import { ServerTable } from "@/components/display/ServerTable";
import { GroupFilter } from "@/components/display/GroupFilter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDisplayServers, usePublicGroups } from "@/services/display";
import { cn } from "@/lib/utils";
import type { DisplayServer, PublicGroup } from "@/types/server";

declare const __BUILD_TIME__: string;

type ViewMode = "card" | "list";

export default function DisplayPage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const { servers, isLoading, error, wsConnected } = useDisplayServers();
  const { data: groups = [] } = usePublicGroups();

  // 按分组筛选服务器，并排序：top 升序，离线服务器排最后
  const filteredServers = useMemo(() => {
    let list = servers;
    if (activeGroupId) {
      const group = groups.find((g: PublicGroup) => g.id === activeGroupId);
      if (group) {
        const uuidSet = new Set(group.server_uuids);
        list = servers.filter(
          (s: DisplayServer) =>
            uuidSet.has(s.uuid) ||
            s.groups.some((g) => g.id === activeGroupId)
        );
      }
    }
    return [...list].sort((a, b) => {
      const aOffline = a.status !== 1 ? 1 : 0;
      const bOffline = b.status !== 1 ? 1 : 0;
      if (aOffline !== bOffline) return aOffline - bOffline;
      return a.top - b.top;
    });
  }, [servers, activeGroupId, groups]);

  const onlineCount = servers.filter((s) => s.status === 1).length;

  const formatBuildTime = (isoTime: string) => {
    try {
      const date = new Date(isoTime);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoTime;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <DisplayHeader />
        <main className="flex-1 container mx-auto px-4 py-6 space-y-4">
          {/* 工具栏：分组筛选 + 统计 + 视图切换 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {groups.length > 0 && (
                <GroupFilter
                  groups={groups}
                  activeGroupId={activeGroupId}
                  onGroupChange={setActiveGroupId}
                />
              )}
              {!isLoading && (
                <span className="text-xs text-muted-foreground">
                  {t("display.stats.online", { count: onlineCount })} / {t("display.stats.total", { count: servers.length })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* WS 连接状态 */}
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  wsConnected ? "text-emerald-500" : "text-muted-foreground"
                )}
              >
                {wsConnected ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                {wsConnected ? t("display.ws.connected") : t("display.ws.disconnected")}
              </span>

              {/* 视图切换 */}
              <div className="flex items-center rounded-md border p-0.5">
                <Button
                  variant={viewMode === "card" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("card")}
                  aria-label={t("display.view.card")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("list")}
                  aria-label={t("display.view.list")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          {isLoading ? (
            <LoadingSkeleton viewMode={viewMode} />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-destructive">{t("display.error")}</p>
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {t("display.empty")}
              </p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredServers.map((server) => (
                <ServerCard key={server.uuid} server={server} />
              ))}
            </div>
          ) : (
            <ServerTable servers={filteredServers} />
          )}
        </main>

        {/* Footer: Build Time */}
        <footer className="border-t bg-muted/30 py-3 px-4">
          <div className="container mx-auto text-center">
            <p className="text-xs text-muted-foreground">
              {t("display.buildTime", {
                time: formatBuildTime(__BUILD_TIME__),
              })}
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-45 w-full rounded-lg" />
      ))}
    </div>
  );
}
