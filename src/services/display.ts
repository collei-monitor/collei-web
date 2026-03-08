/**
 * 公开展示页 API 服务
 * 封装 /clients/public/* 接口 + WebSocket 实时数据
 */

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import api from "@/lib/api";
import type {
  PublicServer,
  PublicGroup,
  DisplayServer,
  ServerSnapshot,
  WsMessage,
  ServerLoad,
} from "@/types/server";
import { ServerStatus } from "@/types/server";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const displayKeys = {
  servers: ["public", "servers"] as const,
  groups: ["public", "groups"] as const,
};

// ── Public API ────────────────────────────────────────────────────────────────

const displayApi = {
  async getServers(): Promise<PublicServer[]> {
    const { status, data } = await api.get("/clients/public/servers");
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch servers");
    return data as PublicServer[];
  },

  async getGroups(): Promise<PublicGroup[]> {
    const { status, data } = await api.get("/clients/public/groups");
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch groups");
    return data as PublicGroup[];
  },
};

/** 获取公开服务器列表 */
export function usePublicServers() {
  return useQuery({
    queryKey: displayKeys.servers,
    queryFn: displayApi.getServers,
  });
}

/** 获取公开分组列表 */
export function usePublicGroups() {
  return useQuery({
    queryKey: displayKeys.groups,
    queryFn: displayApi.getGroups,
  });
}

// ── WebSocket Hook ────────────────────────────────────────────────────────────

const WS_RECONNECT_DELAY = 3000;

interface WebSocketState {
  connected: boolean;
  snapshots: Map<string, ServerSnapshot>;
  /** 首次收到 WS 快照（或超时兜底）后变为 true */
  wsReady: boolean;
}

/** WebSocket 状态 Context，由 WebSocketProvider 提供 */
export const WebSocketContext = createContext<WebSocketState | null>(null);

/** WS 就绪等待超时（ms），超时后不再阻塞页面展示 */
const WS_READY_TIMEOUT = 8000;

/** 内部 Hook：包含完整的 WS 连接逻辑，仅供 WebSocketProvider 使用 */
export function useWebSocketState(): WebSocketState {
  const [connected, setConnected] = useState(false);
  const [snapshots, setSnapshots] = useState<Map<string, ServerSnapshot>>(
    new Map()
  );
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const readyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let disposed = false;

    // 超时兜底：WS 迟迟未返回数据时，仍放行页面展示
    readyTimer.current = setTimeout(() => {
      if (!disposed) setWsReady(true);
    }, WS_READY_TIMEOUT);

    function connect() {
      if (disposed) return;

      const protocol =
        window.location.protocol === "https:" ? "wss:" : "ws:";
    //   const ws = new WebSocket(
    //     `${protocol}//${window.location.host}/api/v1/ws`
    //   );
        const ws = new WebSocket(
        `${protocol}//127.0.0.1:8000/api/v1/ws`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed) setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);
          if (message.type === "snapshot") {
            setSnapshots(
              new Map(message.servers.map((s) => [s.uuid, s]))
            );
            // 首次收到快照，取消兜底计时器并标记就绪
            if (!disposed) {
              clearTimeout(readyTimer.current);
              setWsReady(true);
            }
          }
        } catch {
          /* ignore parse errors */
        }
      };

      ws.onclose = () => {
        if (!disposed) {
          setConnected(false);
          wsRef.current = null;
          reconnectTimer.current = setTimeout(connect, WS_RECONNECT_DELAY);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer.current);
      clearTimeout(readyTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return { connected, snapshots, wsReady };
}

/** 从 WebSocketContext 读取 WS 状态，需在 WebSocketProvider 内部使用 */
export function useServerWebSocket(): WebSocketState {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useServerWebSocket must be used within WebSocketProvider");
  return ctx;
}

// ── 合并 Hook ─────────────────────────────────────────────────────────────────

/** 获取展示用的服务器列表（HTTP + WebSocket 合并） */
export function useDisplayServers() {
  const { data: httpServers, isLoading: httpLoading, error } = usePublicServers();
  const { connected, snapshots, wsReady } = useServerWebSocket();

  const servers = useMemo<DisplayServer[]>(() => {
    if (!httpServers) return [];

    const result = httpServers.map((server): DisplayServer => {
      const snapshot = snapshots.get(server.uuid);
      if (snapshot) {
        return {
          ...server,
          status: ServerStatus.ONLINE,
          load: snapshot.load,
          cpu_cores: snapshot.cpu_cores,
          mem_total: snapshot.mem_total,
          swap_total: snapshot.swap_total,
          disk_total: snapshot.disk_total,
          last_online: snapshot.last_online,
            ...(snapshot.boot_time !== undefined ? { boot_time: snapshot.boot_time } : {}),
        };
      }
      // WS 已连接但该服务器不在快照中，标记为离线
      if (connected) {
        return { ...server, status: ServerStatus.OFFLINE, load: undefined };
      }
      // WS 未连接，使用 HTTP 状态
      return { ...server };
    });

    // 按 top 降序，再按名称排序
    return result.sort(
      (a, b) => b.top - a.top || a.name.localeCompare(b.name)
    );
  }, [httpServers, snapshots, connected]);

  // HTTP 加载完成且 WS 首帧到达（或超时兜底）后才放行
  const isLoading = httpLoading || !wsReady;

  return { servers, isLoading, error, wsConnected: connected };
}

// ── 导出类型便捷引用 ─────────────────────────────────────────────────────────

export type { ServerLoad, DisplayServer, PublicGroup };
