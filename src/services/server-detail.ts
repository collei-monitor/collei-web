/**
 * 服务器详情页服务
 * 提供历史数据获取（HTTP）+ WS 实时数据累积（仅保留最近 1 分钟）
 * 支持多种时间范围查询：实时、固定时间段、自定义时间段
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useDisplayServers } from "@/services/display";
import type { DisplayServer, ServerNodeRecord, ServerLoad } from "@/types/server";

// ── 常量 ──────────────────────────────────────────────────────────────────────

// ── 时间范围类型 ──────────────────────────────────────────────────────────────

export type LoadTimeRange = "realtime" | "1h" | "4h" | "1d" | "3d" | "custom";

export interface LoadTimeRangeParams {
  range: LoadTimeRange;
  startTime?: number;
  endTime?: number;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const serverDetailKeys = {
  load: (uuid: string) => ["public", "server", uuid, "load"] as const,
  loadRange: (uuid: string, params: LoadTimeRangeParams) =>
    ["public", "server", uuid, "load", params] as const,
};

// ── API 响应类型 ──────────────────────────────────────────────────────────────

interface LoadDataResponse {
  load_retain_seconds: number | null;
  data: ServerNodeRecord[];
}

// ── API ───────────────────────────────────────────────────────────────────────

const RANGE_HOURS: Record<string, number> = {
  "1h": 1,
  "4h": 4,
  "1d": 24,
  "3d": 72,
};

const serverDetailApi = {
  /** 获取服务器历史负载数据（实时模式） */
  async getLoad(uuid: string): Promise<LoadDataResponse> {
    const { status, data } = await api.get(`/clients/public/servers/${uuid}/load`);
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch server load");
    return data as LoadDataResponse;
  },

  /** 获取服务器历史负载数据（指定时间范围） */
  async getLoadRange(
    uuid: string,
    params: LoadTimeRangeParams,
  ): Promise<ServerNodeRecord[]> {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params.range === "custom" && params.startTime && params.endTime) {
      queryParams.start_time = params.startTime;
      queryParams.end_time = params.endTime;
    } else if (params.range !== "realtime" && RANGE_HOURS[params.range]) {
      queryParams.range = RANGE_HOURS[params.range];
    }

    const { status, data } = await api.get(
      `/clients/public/servers/${uuid}/load`,
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
    );
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch server load");
    const resp = data as LoadDataResponse;
    return resp.data;
  },
};

/** 获取服务器历史负载（实时） */
export function useServerLoad(uuid: string) {
  return useQuery({
    queryKey: serverDetailKeys.load(uuid),
    queryFn: () => serverDetailApi.getLoad(uuid),
    enabled: !!uuid,
  });
}

/** 获取服务器负载（指定时间范围） */
export function useServerLoadRange(uuid: string, params: LoadTimeRangeParams) {
  const isRealtime = params.range === "realtime";
  return useQuery({
    queryKey: serverDetailKeys.loadRange(uuid, params),
    queryFn: () => serverDetailApi.getLoadRange(uuid, params),
    enabled: !!uuid && !isRealtime,
  });
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

/** 将 ServerLoad（WS 快照）转换为 ServerNodeRecord 格式 */
function snapshotToRecord(
  uuid: string,
  load: ServerLoad,
  timestamp: number,
): ServerNodeRecord {
  return {
    server_uuid: uuid,
    time: timestamp,
    cpu: load.cpu,
    ram: load.ram,
    ram_total: load.ram_total,
    swap: load.swap,
    swap_total: load.swap_total,
    load: load.load,
    disk: load.disk,
    disk_total: load.disk_total,
    net_in: load.net_in,
    net_out: load.net_out,
    tcp: load.tcp,
    udp: load.udp,
    process: load.process,
  };
}

/** 裁剪超出时间窗口的记录 */
function trimRecords(records: ServerNodeRecord[], window: number): ServerNodeRecord[] {
  if (records.length === 0) return records;
  const cutoff = Math.floor(Date.now() / 1000) - window;
  return records.filter((r) => r.time >= cutoff);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseServerDetailResult {
  server: DisplayServer | undefined;
  history: ServerNodeRecord[];
  isLoading: boolean;
  /** API 返回的数据保留窗口（秒），null 时表示不限制 */
  loadRetainSeconds: number | null;
}

/**
 * 获取指定服务器的详情 + 历史数据
 * 进入页面时通过 HTTP 获取历史负载，之后 WS 实时数据持续追加
 */
export function useServerDetail(uuid: string): UseServerDetailResult {
  const { servers, isLoading: serversLoading } = useDisplayServers();
  const { data: loadResp, isLoading: loadLoading } = useServerLoad(uuid);
  const initialLoad = loadResp?.data;
  const retainSeconds = loadResp?.load_retain_seconds ?? null;
  const [wsRecords, setWsRecords] = useState<ServerNodeRecord[]>([]);

  const server = useMemo(
    () => servers.find((s) => s.uuid === uuid),
    [servers, uuid],
  );

  // 合并 HTTP 历史数据 + WS 实时数据，去重、裁剪
  const history = useMemo(() => {
    const httpRecords = initialLoad ?? [];
    if (httpRecords.length === 0 && wsRecords.length === 0) return [];
    // WS 记录按时间追加，只需与 HTTP 记录合并后去重排序一次
    // 由于 wsRecords 按时间顺序追加，利用 Map 去重即可保持有序
    const map = new Map<number, ServerNodeRecord>();
    for (const r of httpRecords) map.set(r.time, r);
    for (const r of wsRecords) map.set(r.time, r);
    return Array.from(map.values()).sort((a, b) => a.time - b.time);
  }, [initialLoad, wsRecords]);

  // 当 WS 推送新数据时，累积到 wsRecords
  const loadRef = useRef<ServerLoad | undefined>(undefined);

  useEffect(() => {
    if (!server?.load) return;
    const load = server.load;
    if (loadRef.current === load) return;
    loadRef.current = load;

    queueMicrotask(() => {
      const record = snapshotToRecord(uuid, load, Math.floor(Date.now() / 1000));
      setWsRecords((prev) => [...prev, record]);
    });
  }, [server?.load, uuid]);

  // 定期清理 wsRecords 中超出窗口的旧数据（仅当 retainSeconds 有值时裁剪）
  useEffect(() => {
    if (retainSeconds == null) return;
    const timer = setInterval(() => {
      setWsRecords((prev) => trimRecords(prev, retainSeconds));
    }, 10000);
    return () => clearInterval(timer);
  }, [retainSeconds]);

  // uuid 变化时重置 WS 累积数据
  const prevUuidRef = useRef(uuid);
  useEffect(() => {
    if (prevUuidRef.current !== uuid) {
      prevUuidRef.current = uuid;
      queueMicrotask(() => setWsRecords([]));
    }
  }, [uuid]);

  return {
    server,
    history,
    isLoading: serversLoading || loadLoading,
    loadRetainSeconds: retainSeconds,
  };
}

// ── 带时间范围切换的 Hook ──────────────────────────────────────────────────────

interface UseServerDetailWithRangeResult {
  server: DisplayServer | undefined;
  history: ServerNodeRecord[];
  /** 服务器基础信息尚未加载（仅首次进入页面时为 true） */
  isServerLoading: boolean;
  /** 图表数据正在加载（切换时间范围时为 true） */
  isChartLoading: boolean;
  /** API 返回的实时数据保留窗口（秒），null 时表示不限制 */
  loadRetainSeconds: number | null;
}

/**
 * 服务器详情 + 负载数据（支持时间范围切换）
 * - 实时模式：复用 useServerDetail 的 WS + HTTP 行为
 * - 历史模式：纯 HTTP 查询，不走 WS
 */
export function useServerDetailWithRange(
  uuid: string,
  rangeParams: LoadTimeRangeParams,
): UseServerDetailWithRangeResult {
  const realtimeResult = useServerDetail(uuid);
  const { data: rangeData, isLoading: rangeLoading } = useServerLoadRange(
    uuid,
    rangeParams,
  );

  const isRealtime = rangeParams.range === "realtime";

  return {
    server: realtimeResult.server,
    history: isRealtime ? realtimeResult.history : (rangeData ?? []),
    // 仅当服务器信息尚未获取时才为 true，不受图表数据加载影响
    isServerLoading: !realtimeResult.server && realtimeResult.isLoading,
    isChartLoading: isRealtime ? false : rangeLoading,
    loadRetainSeconds: realtimeResult.loadRetainSeconds,
  };
}
