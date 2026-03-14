import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { DisplayHeader } from "@/components/display/DisplayHeader";
import { ServerInfoCard } from "@/components/display/ServerInfoCard";
import { ServerCharts } from "@/components/display/ServerCharts";
import { NetworkProbeChart } from "@/components/display/NetworkProbeChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServerDetail } from "@/services/server-detail";

export default function ServerDetailPage() {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { server, history, isLoading } = useServerDetail(uuid ?? "");

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <DisplayHeader />
        <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
          {/* 返回按钮 */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.backHome")}
          </Button>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-60 w-full rounded-lg" />
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : !server ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {t("detail.notFound")}
              </p>
            </div>
          ) : (
            <>
              {/* 服务器信息 */}
              <ServerInfoCard server={server} />

              {/* Tabs: 状态 / 网络 */}
              <Tabs defaultValue="status">
                <TabsList>
                  <TabsTrigger value="status">
                    {t("detail.tabs.status")}
                  </TabsTrigger>
                  <TabsTrigger value="network">
                    {t("detail.tabs.network")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="status">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t("detail.chart.title")}
                    </h3>
                    <ServerCharts history={history} />
                  </div>
                </TabsContent>

                <TabsContent value="network">
                  <NetworkProbeChart uuid={uuid!} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
