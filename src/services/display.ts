/**
 * 公开展示页 API 服务
 * WebSocket 实时数据（nodes + status 新格式）
 * /clients/public/servers 与 /clients/public/groups 已弃用，数据改由 WS 推送
 */

import { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import { useAuthStore } from "@/store/auth";
import type {
  PublicGroup,
  DisplayServer,
  WsMessage,
  WsNodeServer,
  WsStatusServer,
  ServerLoad,
} from "@/types/server";
import { ServerStatus } from "@/types/server";

// ── WebSocket Hook ────────────────────────────────────────────────────────────

const WS_RECONNECT_DELAY = 3000;
const WS_PING_INTERVAL = 30000;

interface WebSocketState {
  connected: boolean;
  wsNodes: WsNodeServer[];
  groups: PublicGroup[];
  snapshots: Map<string, WsStatusServer>;
  /** 首次同时收到 nodes 与 status 消息（或超时兜底）后变为 true */
  wsReady: boolean;
}

/** WebSocket 状态 Context，由 WebSocketProvider 提供 */
export const WebSocketContext = createContext<WebSocketState | null>(null);

/** WS 就绪等待超时（ms），超时后不再阻塞页面展示 */
const WS_READY_TIMEOUT = 8000;

/** 内部 Hook：包含完整的 WS 连接逻辑，仅供 WebSocketProvider 使用 */
export function useWebSocketState(): WebSocketState {
  const [connected, setConnected] = useState(false);
  const [wsNodes, setWsNodes] = useState<WsNodeServer[]>([]);
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [snapshots, setSnapshots] = useState<Map<string, WsStatusServer>>(new Map());
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const readyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pingTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  // 用 ref 追踪两帧是否都已到达，避免 state 闭包问题
  const nodesReceivedRef = useRef(false);
  const statusReceivedRef = useRef(false);
  const wsToken = useAuthStore((s) => s.user?.ws_token);

  useEffect(() => {
    let disposed = false;

    // 超时兜底：WS 迟迟未同时返回 nodes+status 时，仍放行页面展示
    readyTimer.current = setTimeout(() => {
      if (!disposed) setWsReady(true);
    }, WS_READY_TIMEOUT);

    function checkReady() {
      if (nodesReceivedRef.current && statusReceivedRef.current) {
        clearTimeout(readyTimer.current);
        setWsReady(true);
      }
    }

    function connect() {
      if (disposed) return;

      // 每次重连时重置就绪标记
      nodesReceivedRef.current = false;
      statusReceivedRef.current = false;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = wsToken
        ? `${protocol}//${window.location.host}/api/v1/ws?token=${encodeURIComponent(wsToken)}`
        : `${protocol}//${window.location.host}/api/v1/ws`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed) {
          setConnected(true);
          // 启动心跳
          pingTimer.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ action: "ping" }));
            }
          }, WS_PING_INTERVAL);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data as string);
          if (message.type === "nodes") {
            if (!disposed) {
              setWsNodes(message.servers);
              setGroups(message.groups);
              nodesReceivedRef.current = true;
              checkReady();
            }
          } else if (message.type === "status") {
            if (!disposed) {
              setSnapshots(new Map(Object.entries(message.servers)));
              statusReceivedRef.current = true;
              checkReady();
            }
          }
          // "pong" 消息不需要处理
        } catch {
          /* ignore parse errors */
        }
      };

      ws.onclose = () => {
        if (!disposed) {
          setConnected(false);
          wsRef.current = null;
          clearInterval(pingTimer.current);
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
      clearInterval(pingTimer.current);
      wsRef.current?.close();
    };
  }, [wsToken]);

  return { connected, wsNodes, groups, snapshots, wsReady };
}

/** 从 WebSocketContext 读取 WS 状态，需在 WebSocketProvider 内部使用 */
export function useServerWebSocket(): WebSocketState {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useServerWebSocket must be used within WebSocketProvider");
  return ctx;
}

// ── 合并 Hook ─────────────────────────────────────────────────────────────────

/** 获取展示用的服务器列表（WebSocket nodes + status 合并） */
export function useDisplayServers() {
  const { connected, wsNodes, snapshots, wsReady } = useServerWebSocket();

  const servers = useMemo<DisplayServer[]>(() => {
    const nodeUuids = new Set(wsNodes.map((s) => s.uuid));

    const result = wsNodes.map((node): DisplayServer => {
      const snap = snapshots.get(node.uuid);
      if (snap) {
        return {
          uuid: node.uuid,
          name: snap.name || node.name,
          cpu_name: snap.cpu_name,
          arch: snap.arch,
          os: snap.os,
          region: snap.region,
          top: snap.top,
          status: snap.status.status,
          last_online: snap.status.last_online,
          boot_time: snap.status.boot_time,
          groups: node.groups,
          load: snap.load,
          cpu_cores: snap.cpu_cores,
          mem_total: snap.mem_total,
          swap_total: snap.swap_total,
          disk_total: snap.disk_total,
          virtualization: snap.virtualization,
          enable_statistics_mode: snap.enable_statistics_mode,
          total_flow_out: snap.status.total_flow_out,
          total_flow_in: snap.status.total_flow_in,
          billing: node.billing,
        };
      }
      // 有节点信息但无快照，WS 已连接则标记为离线
      return {
        uuid: node.uuid,
        name: node.name,
        cpu_name: node.cpu_name,
        arch: node.arch,
        os: node.os,
        region: node.region,
        top: node.top,
        status: connected ? ServerStatus.OFFLINE : node.status,
        last_online: node.last_online,
        boot_time: node.boot_time,
        groups: node.groups,
        billing: node.billing,
      };
    });

    // 快照中有但 nodes 列表中没有的服务器（节点变更前的快照残留），也加入
    for (const [uuid, snap] of snapshots.entries()) {
      if (!nodeUuids.has(uuid)) {
        result.push({
          uuid,
          name: snap.name,
          cpu_name: snap.cpu_name,
          arch: snap.arch,
          os: snap.os,
          region: snap.region,
          top: snap.top,
          status: snap.status.status,
          last_online: snap.status.last_online,
          boot_time: snap.status.boot_time,
          groups: [],
          load: snap.load,
          cpu_cores: snap.cpu_cores,
          mem_total: snap.mem_total,
          swap_total: snap.swap_total,
          disk_total: snap.disk_total,
          virtualization: snap.virtualization,
          enable_statistics_mode: snap.enable_statistics_mode,
          total_flow_out: snap.status.total_flow_out,
          total_flow_in: snap.status.total_flow_in,
          billing: null,
        });
      }
    }

    // 按 top 降序，再按名称排序
    return result.sort((a, b) => b.top - a.top || a.name.localeCompare(b.name));
  }, [wsNodes, snapshots, connected]);

  const isLoading = !wsReady;

  return { servers, isLoading, error: null, wsConnected: connected };
}

/** 从 WS Context 获取分组列表 */
export function useDisplayGroups(): PublicGroup[] {
  const { groups } = useServerWebSocket();
  return groups;
}

// ── 导出类型便捷引用 ─────────────────────────────────────────────────────────

export type { ServerLoad, DisplayServer, PublicGroup };
