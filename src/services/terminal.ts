/**
 * Web Terminal (ConPTY) API 服务
 */

import { api } from "@/lib/api";
import type {
  CreateTerminalSessionPayload,
  CreateTerminalSessionResponse,
  TerminalSessionsResponse,
} from "@/types/terminal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// ── REST API ──────────────────────────────────────────────────────────────────

export async function createTerminalSession(
  uuid: string,
  payload: CreateTerminalSessionPayload = {}
): Promise<CreateTerminalSessionResponse> {
  const { status, data } = await api.post(
    `/clients/servers/${uuid}/terminal/sessions`,
    payload
  );
  if (status !== 201) {
    throw new Error(data.detail || "Failed to create terminal session");
  }
  return data as CreateTerminalSessionResponse;
}

export async function getTerminalSessions(
  uuid: string
): Promise<TerminalSessionsResponse> {
  const { status, data } = await api.get(
    `/clients/servers/${uuid}/terminal/sessions`
  );
  if (status !== 200) {
    throw new Error(data.detail || "Failed to fetch terminal sessions");
  }
  return data as TerminalSessionsResponse;
}

export async function terminateTerminalSession(
  uuid: string,
  sessionId: string
): Promise<void> {
  const { status, data } = await api.delete(
    `/clients/servers/${uuid}/terminal/sessions/${sessionId}`
  );
  if (status !== 200) {
    throw new Error(data.detail || "Failed to terminate terminal session");
  }
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

export function buildTerminalWebSocketURL(sessionId: string): string {
  const base = API_BASE_URL.replace(/^\//, "");
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/${base}/ws/terminal?session_id=${encodeURIComponent(sessionId)}`;
}
