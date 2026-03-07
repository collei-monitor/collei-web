/**
 * 服务器详情页服务
 * 提供历史数据获取（HTTP）+ WS 实时数据累积（仅保留最近 1 分钟）
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useDisplayServers } from "@/services/display";
import type { DisplayServer, ServerNodeRecord, ServerLoad } from "@/types/server";

// ── 常量 ──────────────────────────────────────────────────────────────────────

/** 保留的历史数据时间窗口（秒） */
const HISTORY_WINDOW = 80;

// ── Query Keys ────────────────────────────────────────────────────────────────

export const serverDetailKeys = {
  load: (uuid: string) => ["public", "server", uuid, "load"] as const,
};

// ── API ───────────────────────────────────────────────────────────────────────

const serverDetailApi = {
  /** 获取服务器历史负载数据 */
  async getLoad(uuid: string): Promise<ServerNodeRecord[]> {
    const { status, data } = await api.get(`/clients/public/servers/${uuid}/load`);
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch server load");
    return data as ServerNodeRecord[];
  },
};

/** 获取服务器历史负载 */
export function useServerLoad(uuid: string) {
  return useQuery({
    queryKey: serverDetailKeys.load(uuid),
    queryFn: () => serverDetailApi.getLoad(uuid),
    enabled: !!uuid,
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
function trimRecords(records: ServerNodeRecord[]): ServerNodeRecord[] {
  if (records.length === 0) return records;
  const cutoff = Math.floor(Date.now() / 1000) - HISTORY_WINDOW;
  return records.filter((r) => r.time >= cutoff);
}

/** 按时间去重并排序 */
function dedupeAndSort(records: ServerNodeRecord[]): ServerNodeRecord[] {
  const map = new Map<number, ServerNodeRecord>();
  for (const r of records) {
    map.set(r.time, r);
  }
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseServerDetailResult {
  server: DisplayServer | undefined;
  history: ServerNodeRecord[];
  isLoading: boolean;
}

/**
 * 获取指定服务器的详情 + 历史数据
 * 进入页面时通过 HTTP 获取历史负载，之后 WS 实时数据持续追加
 */
export function useServerDetail(uuid: string): UseServerDetailResult {
  const { servers, isLoading: serversLoading } = useDisplayServers();
  const { data: initialLoad, isLoading: loadLoading } = useServerLoad(uuid);
  const [wsRecords, setWsRecords] = useState<ServerNodeRecord[]>([]);

  const server = useMemo(
    () => servers.find((s) => s.uuid === uuid),
    [servers, uuid],
  );

  // 合并 HTTP 历史数据 + WS 实时数据，去重、排序、裁剪
  const history = useMemo(() => {
    const httpRecords = initialLoad ?? [];
    return trimRecords(dedupeAndSort([...httpRecords, ...wsRecords]));
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

  // 定期清理 wsRecords 中超出窗口的旧数据
  useEffect(() => {
    const timer = setInterval(() => {
      setWsRecords((prev) => trimRecords(prev));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

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
  };
}
