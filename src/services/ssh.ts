/**
 * Web SSH API 服务
 */

import { api } from "@/lib/api";
import type {
  CreateSSHSessionPayload,
  CreateSSHSessionResponse,
  SSHSessionsResponse,
} from "@/types/ssh";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// ── REST API ──────────────────────────────────────────────────────────────────

export async function createSSHSession(
  uuid: string,
  payload: CreateSSHSessionPayload = {}
): Promise<CreateSSHSessionResponse> {
  const { status, data } = await api.post(
    `/clients/servers/${uuid}/ssh/sessions`,
    payload
  );
  if (status !== 201) {
    throw new Error(data.detail || "Failed to create SSH session");
  }
  return data as CreateSSHSessionResponse;
}

export async function getSSHSessions(
  uuid: string
): Promise<SSHSessionsResponse> {
  const { status, data } = await api.get(
    `/clients/servers/${uuid}/ssh/sessions`
  );
  if (status !== 200) {
    throw new Error(data.detail || "Failed to fetch SSH sessions");
  }
  return data as SSHSessionsResponse;
}

export async function terminateSSHSession(
  uuid: string,
  sessionId: string
): Promise<void> {
  const { status, data } = await api.delete(
    `/clients/servers/${uuid}/ssh/sessions/${sessionId}`
  );
  if (status !== 200) {
    throw new Error(data.detail || "Failed to terminate SSH session");
  }
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

export function buildSSHWebSocketURL(sessionId: string): string {
  const base = API_BASE_URL.replace(/^\//, "");
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/${base}/ws/ssh?session_id=${encodeURIComponent(sessionId)}`;
}
