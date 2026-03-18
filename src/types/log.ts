/**
 * 审计日志类型定义
 * 基于 GET /api/v1/logs 接口
 */

export interface LogRead {
  id: number;
  level: "info" | "warning" | "error";
  msg_type: string;
  message: string;
  detail: string | null;
  source: string | null;
  ip: string | null;
  user_uuid: string | null;
  server_uuid: string | null;
  time: number;
}

export interface LogListResponse {
  items: LogRead[];
  total: number;
}

export interface LogQueryParams {
  msg_type?: string;
  level?: string;
  server_uuid?: string;
  source?: string;
  start_time?: number;
  end_time?: number;
  limit?: number;
  offset?: number;
}

export const LOG_MSG_TYPES = [
  "auth",
  "server",
  "config",
  "alert",
  "task",
  "error",
  "billing",
  "network",
  "system",
] as const;

export const LOG_LEVELS = ["info", "warning", "error"] as const;
