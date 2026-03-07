import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Server, Activity, Bell, Users } from "lucide-react";

interface StatItem {
  titleKey: string;
  descKey: string;
  valueKey: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();

  const stats: StatItem[] = [
    {
      titleKey: "admin.dashboard.stats.onlineNodes",
      descKey: "admin.dashboard.stats.onlineNodesDesc",
      valueKey: "placeholder",
      icon: Server,
    },
    {
      titleKey: "admin.dashboard.stats.avgCpu",
      descKey: "admin.dashboard.stats.avgCpuDesc",
      valueKey: "placeholder",
      icon: Activity,
    },
    {
      titleKey: "admin.dashboard.stats.alerts",
      descKey: "admin.dashboard.stats.alertsDesc",
      valueKey: "placeholder",
      icon: Bell,
      badgeKey: "admin.dashboard.stats.pending",
    },
    {
      titleKey: "admin.dashboard.stats.users",
      descKey: "admin.dashboard.stats.usersDesc",
      valueKey: "placeholder",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.dashboard.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>

      <Separator />

      {/* 统计卡片 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={t(stat.titleKey)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(stat.titleKey)}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">—</p>
                {stat.badgeKey && (
                  <Badge variant="destructive" className="text-xs">
                    {t(stat.badgeKey)}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t(stat.descKey)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 占位区域 */}
      <Card className="min-h-64">
        <CardHeader>
          <CardTitle className="text-base">{t("admin.dashboard.chart")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">{t("admin.dashboard.noData")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
