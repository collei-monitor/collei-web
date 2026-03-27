import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { DisplayHeader } from "@/pages/display/components/DisplayHeader";
import { ServerInfoCard } from "@/pages/display/components/ServerInfoCard";
import { ServerCharts } from "@/pages/display/components/ServerCharts";
import { NetworkProbeChart } from "@/pages/display/components/NetworkProbeChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useServerDetailWithRange,
  type LoadTimeRange,
  type LoadTimeRangeParams,
} from "@/services/server-detail";

const RANGE_OPTIONS: LoadTimeRange[] = [
  "realtime",
  "1h",
  "4h",
  "1d",
  "3d",
  "custom",
];

function toTimeString(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function combineDateAndTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

const RANGE_SECONDS: Record<string, number> = {
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
  "3d": 259200,
};

export default function ServerDetailPage() {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  // ── 时间范围状态 ─────────────────────────
  const [selectedRange, setSelectedRange] = useState<LoadTimeRange>("realtime");
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customStartTime, setCustomStartTime] = useState("00:00");
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  const [customEndTime, setCustomEndTime] = useState("23:59");
  const [rangeNow, setRangeNow] = useState(() => Math.floor(Date.now() / 1000));

  const rangeParams: LoadTimeRangeParams = {
    range: selectedRange,
    ...(selectedRange === "custom" &&
      customStart &&
      customEnd && {
        startTime: Math.floor(combineDateAndTime(customStart, customStartTime).getTime() / 1000),
        endTime: Math.floor(combineDateAndTime(customEnd, customEndTime).getTime() / 1000),
      }),
  };

  const { server, history, isServerLoading, isChartLoading } =
    useServerDetailWithRange(uuid ?? "", rangeParams);

  const handleRangeChange = (range: string) => {
    const newRange = range as LoadTimeRange;
    setSelectedRange(newRange);
    setRangeNow(Math.floor(Date.now() / 1000));
    if (newRange === "custom" && !customStart) {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400_000);
      setCustomStart(yesterday);
      setCustomStartTime(toTimeString(yesterday));
      setCustomEnd(now);
      setCustomEndTime(toTimeString(now));
    }
  };

  // 计算 X 轴时间范围（确保始终显示选定范围的完整区间）
  const xDomain = useMemo((): [number, number] | undefined => {
    if (selectedRange === "realtime") return undefined;
    if (selectedRange === "custom") {
      if (customStart && customEnd) {
        return [
          Math.floor(combineDateAndTime(customStart, customStartTime).getTime() / 1000),
          Math.floor(combineDateAndTime(customEnd, customEndTime).getTime() / 1000),
        ];
      }
      return undefined;
    }
    const seconds = RANGE_SECONDS[selectedRange];
    if (!seconds) return undefined;
    return [rangeNow - seconds, rangeNow];
  }, [selectedRange, customStart, customStartTime, customEnd, customEndTime, rangeNow]);

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

          {isServerLoading ? (
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
                    {t("common.status")}
                  </TabsTrigger>
                  <TabsTrigger value="network">
                    {t("detail.tabs.network")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="status">
                  <div className="space-y-4">
                    {/* 标题 + 时间范围选择 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {t("detail.chart.title")}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tabs
                          value={selectedRange}
                          onValueChange={handleRangeChange}
                        >
                          <TabsList className="h-8">
                            {RANGE_OPTIONS.map((r) => (
                              <TabsTrigger
                                key={r}
                                value={r}
                                className="text-xs px-2.5 h-6"
                              >
                                {t(`detail.chart.range.${r}`)}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>

                    {/* 自定义日期选择器 */}
                    {selectedRange === "custom" && (
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 开始日期 */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 font-normal"
                            >
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {customStart
                                ? format(customStart, "yyyy-MM-dd")
                                : t("detail.chart.customRange.startDate")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={customStart}
                              onSelect={setCustomStart}
                              disabled={(date) => date > new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="w-28 h-8 text-sm"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                        />

                        <span className="text-muted-foreground text-sm">—</span>

                        {/* 结束日期 */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 font-normal"
                            >
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {customEnd
                                ? format(customEnd, "yyyy-MM-dd")
                                : t("detail.chart.customRange.endDate")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={customEnd}
                              onSelect={setCustomEnd}
                              disabled={(date) => date > new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="w-28 h-8 text-sm"
                          value={customEndTime}
                          onChange={(e) => setCustomEndTime(e.target.value)}
                        />
                      </div>
                    )}

                    <ServerCharts
                      history={history}
                      timeRange={selectedRange}
                      xDomain={xDomain}
                      isLoading={isChartLoading}
                    />
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
