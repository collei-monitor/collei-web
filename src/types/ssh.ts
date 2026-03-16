/**
 * Web SSH 相关类型定义
 */

// ── REST API ──────────────────────────────────────────────────────────────────

export interface CreateSSHSessionPayload {
  username?: string;
  cols?: number;
  rows?: number;
}

export interface CreateSSHSessionResponse {
  session_id: string;
  ws_url: string;
}

export interface SSHSessionInfo {
  session_id: string;
  username: string;
  connected_at: number;
  client_ip: string;
}

export interface SSHSessionsResponse {
  sessions: SSHSessionInfo[];
}

// ── WebSocket 消息 ────────────────────────────────────────────────────────────

/** 下行消息（服务端 → 前端） */
export type SSHDownMessage =
  | { type: "connected"; cols: number; rows: number }
  | { type: "auth_required"; methods: string[] }
  | { type: "error"; message: string }
  | { type: "closed"; reason: string }
  | { type: "pong"; timestamp: number };

/** 上行消息（前端 → 服务端） */
export type SSHUpMessage =
  | { action: "auth"; username: string; password: string }
  | { action: "resize"; cols: number; rows: number }
  | { action: "close" }
  | { action: "ping" };

// ── 连接状态 ──────────────────────────────────────────────────────────────────

export type SSHConnectionStatus =
  | "idle"
  | "creating"       // POST 创建会话中
  | "waiting"         // 等待 Agent 连接
  | "auth_required"   // 需要密码认证
  | "authenticating"  // 密码认证中
  | "connected"       // 已连接
  | "error"           // 错误
  | "closed";         // 已断开
