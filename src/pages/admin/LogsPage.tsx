/**
 * 审计日志管理页面
 * 支持按类型、级别、来源、时间段筛选
 */

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLogs } from "@/services/logs";
import { useServers } from "@/services/servers";
import type { LogQueryParams, LogRead } from "@/types/log";
import { LOG_MSG_TYPES, LOG_LEVELS } from "@/types/log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  RefreshCw,
  Search,
  X,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { FlagIcon } from "@/components/FlagIcon";

const ALL_VALUE = "__all__";
const PAGE_SIZE = 50;

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function getLevelVariant(
  level: string,
): "default" | "secondary" | "destructive" {
  switch (level) {
    case "error":
      return "destructive";
    case "warning":
      return "secondary";
    default:
      return "default";
  }
}

export default function LogsPage() {
  const { t } = useTranslation();

  // ── 筛选状态 ─────────────────────────────
  const [msgType, setMsgType] = useState<string>(ALL_VALUE);
  const [level, setLevel] = useState<string>(ALL_VALUE);
  const [serverUuid, setServerUuid] = useState("");
  const [source, setSource] = useState<string>(ALL_VALUE);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(0);

  // ── 详情弹窗 ─────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogRead | null>(null);

  // ── 构建查询参数 ─────────────────────────
  const buildParams = useCallback((): LogQueryParams => {
    const p: LogQueryParams = {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    };
    if (msgType !== ALL_VALUE) p.msg_type = msgType;
    if (level !== ALL_VALUE) p.level = level;
    if (serverUuid.trim()) p.server_uuid = serverUuid.trim();
    if (source !== ALL_VALUE) p.source = source;
    if (startDate) p.start_time = Math.floor(startDate.getTime() / 1000);
    if (endDate) p.end_time = Math.floor(endDate.getTime() / 1000);
    return p;
  }, [msgType, level, serverUuid, source, startDate, endDate, page]);

  const params = buildParams();
  const { data, isLoading, isError, refetch } = useLogs(params);
  const { data: servers } = useServers();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleRefresh = useCallback(() => {
    toast.promise(refetch(), {
      loading: t("common.refreshing"),
      success: t("admin.logs.toast.refreshSuccess"),
      error: t("common.refreshFailed"),
    });
  }, [refetch, t]);

  const handleReset = () => {
    setMsgType(ALL_VALUE);
    setLevel(ALL_VALUE);
    setServerUuid("");
    setSource(ALL_VALUE);
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.logs.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.logs.subtitle")}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.refresh")}</TooltipContent>
        </Tooltip>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* 日志类型 */}
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.logs.filter.msgType")}</Label>
          <Select value={msgType} onValueChange={setMsgType}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>
                {t("admin.logs.filter.all")}
              </SelectItem>
              {LOG_MSG_TYPES.map((mt) => (
                <SelectItem key={mt} value={mt}>
                  {t(`admin.logs.msgTypes.${mt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 日志级别 */}
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.logs.filter.level")}</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>
                {t("admin.logs.filter.all")}
              </SelectItem>
              {LOG_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {t(`admin.logs.levels.${l}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 来源 */}
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.logs.filter.source")}</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>
                {t("admin.logs.filter.all")}
              </SelectItem>
              <SelectItem value="tasks">tasks</SelectItem>
              <SelectItem value="offline_check">offline_check</SelectItem>
              <SelectItem value="broadcast">broadcast</SelectItem>
              <SelectItem value="purge_load_now">purge_load_now</SelectItem>
              <SelectItem value="purge_load_minute">
                purge_load_minute
              </SelectItem>
              <SelectItem value="purge_load_hour">purge_load_hour</SelectItem>
              <SelectItem value="purge_network">purge_network</SelectItem>
              <SelectItem value="purge_logs">purge_logs</SelectItem>
              <SelectItem value="downsample_minute">
                downsample_minute
              </SelectItem>
              <SelectItem value="downsample_hour">downsample_hour</SelectItem>
              <SelectItem value="billing_check">billing_check</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 服务器 UUID */}
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.logs.filter.serverUuid")}</Label>
          <Input
            className="w-52"
            value={serverUuid}
            onChange={(e) => setServerUuid(e.target.value)}
            placeholder={t("admin.logs.filter.serverUuidPlaceholder")}
          />
        </div>

        {/* 起始时间 */}
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.logs.filter.startTime")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-40 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "yyyy-MM-dd") : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 结束时间 */}
        <div className="space-y-1">
          <Label className="text-xs">{t("admin.logs.filter.endTime")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-40 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "yyyy-MM-dd") : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={handleSearch} size="sm">
          <Search className="h-4 w-4 mr-1" />
          {t("admin.logs.filter.search")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="h-4 w-4 mr-1" />
          {t("admin.logs.filter.reset")}
        </Button>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.logs.fetchError")}
        </div>
      )}

      {/* Logs table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead className="w-20">
                {t("admin.logs.table.level")}
              </TableHead>
              <TableHead className="w-24">
                {t("common.type")}
              </TableHead>
              <TableHead>{t("admin.logs.table.message")}</TableHead>
              <TableHead className="w-32">
                {t("admin.logs.table.source")}
              </TableHead>
              <TableHead className="w-44">
                {t("admin.logs.table.time")}
              </TableHead>
              <TableHead className="w-16">
                {t("admin.logs.table.detail")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("admin.logs.empty")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>
                    <Badge variant={getLevelVariant(item.level)}>
                      {t(`admin.logs.levels.${item.level}`, item.level)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {t(`admin.logs.msgTypes.${item.msg_type}`, item.msg_type)}
                  </TableCell>
                  <TableCell
                    className="text-sm max-w-md truncate"
                    title={item.message}
                  >
                    {item.message}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.source ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatTimestamp(item.time)}
                  </TableCell>
                  <TableCell>
                    {item.detail && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setSelectedLog(item);
                              setDetailOpen(true);
                            }}
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("admin.logs.table.viewDetail")}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("admin.logs.pagination.total", { count: total })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("admin.logs.detail.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLog?.server_uuid && (() => {
              const server = servers?.find((s) => s.uuid === selectedLog.server_uuid);
              return (
                <div className="rounded-md border p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("admin.logs.detail.serverInfo")}
                  </p>
                  {server ? (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">{t("admin.logs.detail.serverName")}</dt>
                      <dd className="font-medium break-all">{server.name}</dd>
                      <dt className="text-muted-foreground">UUID</dt>
                      <dd className="font-mono text-xs break-all">{server.uuid}</dd>
                      {server.ipv4 && (
                        <>
                          <dt className="text-muted-foreground">IPv4</dt>
                          <dd className="font-mono text-xs">{server.ipv4}</dd>
                        </>
                      )}
                      {server.ipv6 && (
                        <>
                          <dt className="text-muted-foreground">IPv6</dt>
                          <dd className="font-mono text-xs break-all">{server.ipv6}</dd>
                        </>
                      )}
                      {server.os && (
                        <>
                          <dt className="text-muted-foreground">{t("admin.logs.detail.serverOs")}</dt>
                          <dd className="text-xs">{server.os}</dd>
                        </>
                      )}
                      {server.region && (
                        <>
                          <dt className="text-muted-foreground">{t("admin.logs.detail.serverRegion")}</dt>
                          <dd className="text-xs"><FlagIcon region={server.region} /></dd>
                        </>
                      )}
                      {server.version && (
                        <>
                          <dt className="text-muted-foreground">{t("admin.logs.detail.serverVersion")}</dt>
                          <dd className="font-mono text-xs">{server.version}</dd>
                        </>
                      )}
                    </dl>
                  ) : (
                    <p className="text-xs text-muted-foreground font-mono">
                      {t("admin.logs.detail.serverNotFound")}
                      <span className="ml-1 break-all">{selectedLog.server_uuid}</span>
                    </p>
                  )}
                </div>
              );
            })()}
            {/* offline_check：解析 detail 中逗号分隔的 UUID 关联服务器 */}
            {selectedLog?.source === "offline_check" && selectedLog?.detail && (() => {
              const uuids = selectedLog.detail.split(",").map((u) => u.trim()).filter(Boolean);
              if (uuids.length === 0) return null;
              return (
                <div className="rounded-md border p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("admin.logs.detail.offlineServers")}
                  </p>
                  <div className="space-y-2">
                    {uuids.map((uuid) => {
                      const server = servers?.find((s) => s.uuid === uuid);
                      return (
                        <div key={uuid} className="rounded border p-2">
                          {server ? (
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              <dt className="text-muted-foreground">{t("admin.logs.detail.serverName")}</dt>
                              <dd className="font-medium break-all">{server.name}</dd>
                              <dt className="text-muted-foreground">UUID</dt>
                              <dd className="font-mono text-xs break-all">{server.uuid}</dd>
                              {server.ipv4 && (
                                <>
                                  <dt className="text-muted-foreground">IPv4</dt>
                                  <dd className="font-mono text-xs">{server.ipv4}</dd>
                                </>
                              )}
                              {server.ipv6 && (
                                <>
                                  <dt className="text-muted-foreground">IPv6</dt>
                                  <dd className="font-mono text-xs break-all">{server.ipv6}</dd>
                                </>
                              )}
                              {server.os && (
                                <>
                                  <dt className="text-muted-foreground">{t("admin.logs.detail.serverOs")}</dt>
                                  <dd className="text-xs">{server.os}</dd>
                                </>
                              )}
                              {server.region && (
                                <>
                                  <dt className="text-muted-foreground">{t("admin.logs.detail.serverRegion")}</dt>
                                  <dd className="text-xs"><FlagIcon region={server.region} /></dd>
                                </>
                              )}
                              {server.version && (
                                <>
                                  <dt className="text-muted-foreground">{t("admin.logs.detail.serverVersion")}</dt>
                                  <dd className="font-mono text-xs">{server.version}</dd>
                                </>
                              )}
                            </dl>
                          ) : (
                            <p className="text-xs text-muted-foreground font-mono">
                              {t("admin.logs.detail.serverNotFound")}
                              <span className="ml-1 break-all">{uuid}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {selectedLog?.detail && selectedLog?.source !== "offline_check" && (
              <pre className="overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-4 text-sm font-mono max-h-72">
                {selectedLog.detail}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
