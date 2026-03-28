/**
 * Web Terminal (ConPTY) 相关类型定义
 */

// ── REST API ──────────────────────────────────────────────────────────────────

export interface CreateTerminalSessionPayload {
  cols?: number;
  rows?: number;
  shell?: string;
}

export interface CreateTerminalSessionResponse {
  session_id: string;
  ws_url: string;
}

export interface TerminalSessionInfo {
  session_id: string;
  connected_at: number;
  client_ip: string;
}

export interface TerminalSessionsResponse {
  sessions: TerminalSessionInfo[];
}

// ── WebSocket 消息 ────────────────────────────────────────────────────────────

/** 下行消息（服务端 → 前端） */
export type TerminalDownMessage =
  | { type: "connected"; cols: number; rows: number }
  | { type: "error"; message: string }
  | { type: "closed"; reason: string; exit_code?: number }
  | { type: "pong"; timestamp: number };

/** 上行消息（前端 → 服务端） */
export type TerminalUpMessage =
  | { action: "resize"; cols: number; rows: number }
  | { action: "close" }
  | { action: "ping" };

// ── 连接状态 ──────────────────────────────────────────────────────────────────

export type TerminalConnectionStatus =
  | "idle"
  | "creating"       // POST 创建会话中
  | "waiting"         // 等待 Agent 终端就绪
  | "connected"       // 已连接
  | "error"           // 错误
  | "closed";         // 已断开
