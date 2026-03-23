/**
 * Web SFTP 文件管理相关类型定义
 */

// ── REST API ──────────────────────────────────────────────────────────────────

export interface CreateSFTPSessionPayload {
  username?: string;
  password?: string;
}

export interface CreateSFTPSessionResponse {
  session_id: string;
  ws_url: string;
}

export interface SFTPSessionInfo {
  session_id: string;
  username: string;
  connected_at: number;
  client_ip: string;
}

export interface SFTPSessionsResponse {
  sessions: SFTPSessionInfo[];
}

// ── 文件条目 ──────────────────────────────────────────────────────────────────

export interface SFTPFileEntry {
  name: string;
  type: "file" | "dir" | "link";
  size: number;
  permissions: string;
  owner: string;
  group: string;
  mtime: number;
  link_target?: string;
}

// ── WebSocket 消息 ────────────────────────────────────────────────────────────

/** 下行消息（服务端 → 前端） */
export type SFTPDownMessage =
  | { type: "ready"; home_dir: string }
  | { type: "auth_required"; methods: string[] }
  | { type: "ls"; request_id: string; path: string; entries: SFTPFileEntry[] }
  | { type: "stat"; request_id: string; entry: SFTPFileEntry }
  | { type: "cat"; request_id: string; path: string; content: string; encoding: string; size: number }
  | { type: "download_start"; request_id: string; name: string; size: number }
  | { type: "download_end"; request_id: string }
  | { type: "upload_progress"; request_id: string; received: number; total: number }
  | { type: "ok"; request_id: string; message: string; path?: string; size?: number }
  | { type: "error"; request_id?: string; message: string }
  | { type: "closed"; reason: string }
  | { type: "pong"; timestamp: number };

/** 上行消息（前端 → 服务端） */
export type SFTPUpMessage =
  | { action: "auth"; username: string; password: string }
  | { action: "ls"; request_id: string; path: string }
  | { action: "stat"; request_id: string; path: string }
  | { action: "cat"; request_id: string; path: string; encoding?: string }
  | { action: "write"; request_id: string; path: string; content: string; encoding?: string }
  | { action: "download"; request_id: string; path: string }
  | { action: "upload"; request_id: string; path: string; size: number }
  | { action: "mkdir"; request_id: string; path: string }
  | { action: "rm"; request_id: string; path: string; recursive?: boolean }
  | { action: "rename"; request_id: string; old_path: string; new_path: string }
  | { action: "close" }
  | { action: "ping" };

// ── 连接状态 ──────────────────────────────────────────────────────────────────

export type SFTPConnectionStatus =
  | "idle"
  | "creating"        // POST 创建会话中
  | "waiting"          // 等待 WebSocket 连接
  | "auth_required"    // 需要密码认证
  | "authenticating"   // 密码认证中
  | "connected"        // SFTP 就绪
  | "error"            // 错误
  | "closed";          // 已断开

// ── 上传任务 ──────────────────────────────────────────────────────────────────

export interface UploadTask {
  requestId: string;
  fileName: string;
  total: number;
  received: number;
  status: "uploading" | "done" | "error";
}
