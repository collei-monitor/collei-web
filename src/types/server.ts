/**
 * 服务器与分组相关类型定义
 * 基于 Collei API /api/v1/clients 接口
 */

// ── 分组 ──────────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  top: number;
  created_at: number;
}

/** 带服务器 UUID 列表的分组（来自公开接口） */
export interface GroupWithServers extends Group {
  server_uuids: string[];
}

export interface CreateGroupPayload {
  name: string;
  top?: number;
  server_uuids?: string[];
}

export interface UpdateGroupPayload {
  name?: string;
  top?: number;
  server_uuids?: string[];
}

export interface BatchUpdateGroupTopsResult {
  total: number;
  updated: number;
  failed: number;
  failed_ids: string[];
}

// ── 服务器 ────────────────────────────────────────────────────────────────────

export interface Server {
  uuid: string;
  name: string;
  cpu_name: string | null;
  virtualization: string | null;
  arch: string | null;
  cpu_cores: number | null;
  os: string | null;
  kernel_version: string | null;
  ipv4: string | null;
  ipv6: string | null;
  region: string | null;
  mem_total: number | null;
  swap_total: number | null;
  disk_total: number | null;
  version: string | null;
  remark: string | null;
  top: number;
  hidden: number;
  is_approved: number;
  enable_statistics_mode: number;
  created_at: number | null;
  status: number;
  last_online: number | null;
  boot_time: number | null;
  current_run_id: string | null;
  total_flow_out: number | null;
  total_flow_in: number | null;
  groups: Group[];
}

export interface UpdateServerPayload {
  name?: string;
  remark?: string;
  top?: number;
  hidden?: number;
  region?: string;
}

export interface SetServerGroupsPayload {
  group_ids: string[];
}

// ── 公开接口类型 ──────────────────────────────────────────────────────────────

/** 公开服务器列表 (GET /clients/public/servers) */
export interface PublicServer {
  uuid: string;
  name: string;
  cpu_name: string | null;
  arch: string | null;
  os: string | null;
  region: string | null;
  top: number;
  status: number;
  last_online: number | null;
  boot_time: number | null;
  groups: Group[];
}

/** 服务器实时负载 (WebSocket) */
export interface ServerLoad {
  cpu: number;
  ram: number;
  ram_total: number;
  swap: number;
  swap_total: number;
  load: number;
  disk: number;
  disk_total: number;
  net_in: number;
  net_out: number;
  tcp: number;
  udp: number;
  process: number;
}

/** WebSocket 推送的服务器快照 */
export interface ServerSnapshot {
  uuid: string;
  name: string;
  top: number;
  cpu_name: string | null;
  cpu_cores: number;
  arch: string | null;
  os: string | null;
  region: string | null;
  mem_total: number;
  swap_total: number;
  disk_total: number;
  virtualization: string | null;
  status: number;
  last_online: number;
  boot_time: number | null;
  load: ServerLoad;
}

/** WebSocket 消息 */
export interface WsMessage {
  type: "snapshot";
  timestamp: number;
  servers: ServerSnapshot[];
}

/** 公开分组 (GET /clients/public/groups) */
export interface PublicGroup {
  id: string;
  name: string;
  top: number;
  created_at: number;
  server_uuids: string[];
}

/** 合并后的展示用服务器类型 */
export interface DisplayServer {
  uuid: string;
  name: string;
  cpu_name: string | null;
  arch: string | null;
  os: string | null;
  region: string | null;
  top: number;
  status: number;
  last_online: number | null;
  boot_time: number | null;
  groups: Group[];
  load?: ServerLoad;
  cpu_cores?: number;
  mem_total?: number;
  swap_total?: number;
  disk_total?: number;
}

/** 服务器节点历史记录 (GET /clients/public/servers/:uuid/stats) */
export interface ServerNodeRecord {
  server_uuid: string;
  time: number;
  cpu: number;
  ram: number;
  ram_total: number;
  swap: number;
  swap_total: number;
  load: number;
  disk: number;
  disk_total: number;
  net_in: number;
  net_out: number;
  tcp: number;
  udp: number;
  process: number;
}

// ── 服务器状态枚举 ────────────────────────────────────────────────────────────

export const ServerStatus = {
  OFFLINE: 0,
  ONLINE: 1,
} as const;

export const ServerApproval = {
  PENDING: 0,
  APPROVED: 1,
} as const;

export const ServerVisibility = {
  VISIBLE: 0,
  HIDDEN: 1,
} as const;
