/**
 * Web File API (原生文件操作) 服务
 */

import { api } from "@/lib/api";
import type {
  CreateFileSessionResponse,
  FileSessionsResponse,
} from "@/types/fileapi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// ── REST API ──────────────────────────────────────────────────────────────────

export async function createFileSession(
  uuid: string
): Promise<CreateFileSessionResponse> {
  const { status, data } = await api.post(
    `/clients/servers/${uuid}/files/sessions`,
    {}
  );
  if (status !== 201) {
    throw new Error(data.detail || "Failed to create file session");
  }
  return data as CreateFileSessionResponse;
}

export async function getFileSessions(
  uuid: string
): Promise<FileSessionsResponse> {
  const { status, data } = await api.get(
    `/clients/servers/${uuid}/files/sessions`
  );
  if (status !== 200) {
    throw new Error(data.detail || "Failed to fetch file sessions");
  }
  return data as FileSessionsResponse;
}

export async function terminateFileSession(
  uuid: string,
  sessionId: string
): Promise<void> {
  const { status, data } = await api.delete(
    `/clients/servers/${uuid}/files/sessions/${sessionId}`
  );
  if (status !== 200) {
    throw new Error(data.detail || "Failed to terminate file session");
  }
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

export function buildFileWebSocketURL(sessionId: string): string {
  const base = API_BASE_URL.replace(/^\//, "");
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/${base}/ws/files?session_id=${encodeURIComponent(sessionId)}`;
}
