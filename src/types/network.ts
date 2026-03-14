/**
 * 网络监控相关类型定义
 * 基于 /api/v1/clients/network 接口
 */

// ── 监控目标 ──────────────────────────────────────────────────────────────────

export type NetworkProtocol = "icmp" | "tcp" | "http";

export interface NetworkTarget {
  id: number;
  name: string;
  host: string;
  protocol: NetworkProtocol;
  port: number | null;
  interval: number;
  enabled: number;
}

export interface CreateNetworkTargetPayload {
  name: string;
  host: string;
  protocol: NetworkProtocol;
  port?: number | null;
  interval?: number;
  enabled?: number;
}

export interface UpdateNetworkTargetPayload {
  name?: string;
  host?: string;
  protocol?: NetworkProtocol;
  port?: number | null;
  interval?: number;
  enabled?: number;
}

// ── 下发配置 ──────────────────────────────────────────────────────────────────

export type DispatchNodeType = "global" | "server";

export interface NetworkDispatch {
  target_id: number;
  node_type: DispatchNodeType;
  node_id: string;
  is_exclude: number;
}

export interface SetDispatchPayload {
  dispatches: Omit<NetworkDispatch, "target_id">[];
}

// ── 目标详情（含下发配置） ─────────────────────────────────────────────────────

export interface NetworkTargetDetail {
  target: NetworkTarget;
  dispatches: NetworkDispatch[];
}

// ── 探测结果 ──────────────────────────────────────────────────────────────────

export interface NetworkStatus {
  target_id: number;
  server_uuid: string;
  time: number;
  median_latency: number | null;
  max_latency: number | null;
  min_latency: number | null;
  packet_loss: number;
}

export interface NetworkStatusLatest extends NetworkStatus {
  server_name: string;
}

export interface NetworkStatusParams {
  limit?: number;
  start_time?: number;
  end_time?: number;
}

// ── 公开 API 探测结果 ─────────────────────────────────────────────────────────

export interface NetworkProbeRecord {
  target: NetworkTarget;
  records: NetworkStatus[];
}

export interface NetworkProbeParams {
  range?: string;
  start_time?: number;
  end_time?: number;
}
