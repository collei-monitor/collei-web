/**
 * 告警与通知系统类型定义
 * 基于 /api/v1/notifications 接口
 */

// ── 消息发送提供商 ────────────────────────────────────────────────────────────

export interface ProviderRead {
  id: number;
  name: string | null;
  type: string | null;
  addition: string | null;
}

export interface CreateProviderPayload {
  name?: string | null;
  type?: string | null;
  addition?: string | null;
}

export interface UpdateProviderPayload {
  addition?: string | null;
  name?: string | null;
  type?: string | null;
}

// ── 通知渠道 ──────────────────────────────────────────────────────────────────

export interface AlertChannelRead {
  id: number;
  name: string;
  provider_id: number;
  target: string | null;
}

export interface CreateChannelPayload {
  name: string;
  provider_id: number;
  target?: string | null;
}

export interface UpdateChannelPayload {
  name?: string | null;
  provider_id?: number | null;
  target?: string | null;
}

// ── 告警规则 ──────────────────────────────────────────────────────────────────

export type AlertMetric =
  | "cpu"
  | "ram"
  | "swap"
  | "disk"
  | "load"
  | "net_in"
  | "traffic_in"
  | "net_out"
  | "traffic_out"
  | "tcp"
  | "udp"
  | "process"
  | "offline";

export type AlertCondition = ">" | "<" | ">=" | "<=" | "==" | "!=";

export interface AlertRuleRead {
  id: number;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  duration: number;
  enabled: number;
  created_at: number | null;
}

export interface CreateRulePayload {
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  duration?: number;
  enabled?: number;
}

export interface UpdateRulePayload {
  name?: string | null;
  metric?: string | null;
  condition?: string | null;
  threshold?: number | null;
  duration?: number | null;
  enabled?: number | null;
}

// ── 告警规则映射 ──────────────────────────────────────────────────────────────

export type TargetType = "server" | "group" | "global";

export interface AlertRuleMappingRead {
  rule_id: number;
  target_type: string;
  target_id: string;
  channel_id: number;
}

export interface CreateMappingPayload {
  target_type: string;
  target_id: string;
  channel_id: number;
}

// ── 告警历史 ──────────────────────────────────────────────────────────────────

export interface AlertHistoryRead {
  id: number;
  server_uuid: string;
  rule_id: number;
  status: string;
  value: number | null;
  created_at: number | null;
  updated_at: number | null;
}

export interface AlertHistoryParams {
  server_uuid?: string;
  rule_id?: number;
  limit?: number;
}

// ── 告警引擎 ──────────────────────────────────────────────────────────────────

export interface AlertEngineStatus {
  running: boolean;
  rules_count: number;
  mappings_count: number;
  channels_count: number;
  states_count: number;
  firing_count: number;
  pending_count: number;
}

export interface AlertStateItem {
  server_uuid: string;
  server_name: string | null;
  rule_id: number;
  rule_name: string | null;
  metric: string | null;
  status: string;
  value: number;
  pending_since: number;
  last_notified_at: number;
}

// ── 通用响应 ──────────────────────────────────────────────────────────────────

export interface MessageResponse {
  message: string;
}
