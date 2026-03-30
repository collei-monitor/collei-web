/**
 * Web File API (原生文件操作) 相关类型定义
 */

// ── REST API ──────────────────────────────────────────────────────────────────

export interface CreateFileSessionResponse {
  session_id: string;
  ws_url: string;
}

export interface FileSessionInfo {
  session_id: string;
  connected_at: number;
  client_ip: string;
}

export interface FileSessionsResponse {
  sessions: FileSessionInfo[];
}

// ── 文件条目 ──────────────────────────────────────────────────────────────────

export interface FileEntry {
  name: string;
  type: "file" | "dir" | "link" | "drive";
  size: number;
  permissions: string;
  owner: string;
  group: string;
  mtime: number;
  link_target?: string;
}

// ── WebSocket 消息 ────────────────────────────────────────────────────────────

/** 下行消息（服务端 → 前端） */
export type FileAPIDownMessage =
  | { type: "ready" }
  | { type: "readdir_resp"; request_id: string; path: string; entries: FileEntry[] }
  | { type: "stat_resp"; request_id: string; entry: FileEntry }
  | { type: "read_resp"; request_id: string; path: string; content: string; size?: number }
  | { type: "read_resp"; request_id: string; path: string; size: number }
  | { type: "write_resp"; request_id: string; path: string; size: number }
  | { type: "remove_resp"; request_id: string }
  | { type: "rename_resp"; request_id: string }
  | { type: "mkdir_resp"; request_id: string }
  | { type: "rmdir_resp"; request_id: string }
  | { type: "error"; request_id?: string; message: string }
  | { type: "closed"; reason: string }
  | { type: "pong"; timestamp: number };

/** 上行消息（前端 → 服务端） */
export type FileAPIUpMessage =
  | { action: "readdir"; request_id: string; path: string }
  | { action: "stat"; request_id: string; path: string }
  | { action: "read"; request_id: string; path: string; encoding?: string }
  | { action: "write"; request_id: string; path: string; encoding?: string }
  | { action: "remove"; request_id: string; path: string }
  | { action: "rename"; request_id: string; old: string; new: string }
  | { action: "mkdir"; request_id: string; path: string }
  | { action: "rmdir"; request_id: string; path: string }
  | { action: "close" }
  | { action: "ping" };

// ── 连接状态 ──────────────────────────────────────────────────────────────────

export type FileAPIConnectionStatus =
  | "idle"
  | "creating"        // POST 创建会话中
  | "waiting"          // 等待 Agent 就绪
  | "connected"        // 已连接
  | "error"            // 错误
  | "closed";          // 已断开

// ── 上传任务 ──────────────────────────────────────────────────────────────────

export interface FileUploadTask {
  requestId: string;
  fileName: string;
  total: number;
  received: number;
  status: "uploading" | "done" | "error";
}
