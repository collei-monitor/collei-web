/**
 * Web SFTP API 服务
 */

import { api } from "@/lib/api";
import type {
  CreateSFTPSessionPayload,
  CreateSFTPSessionResponse,
  SFTPSessionsResponse,
} from "@/types/sftp";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// ── REST API ──────────────────────────────────────────────────────────────────

export async function createSFTPSession(
  uuid: string,
  payload: CreateSFTPSessionPayload = {}
): Promise<CreateSFTPSessionResponse> {
  const { status, data } = await api.post(
    `/clients/servers/${uuid}/sftp/sessions`,
    payload
  );
  if (status !== 201) {
    throw new Error(data.detail || "Failed to create SFTP session");
  }
  return data as CreateSFTPSessionResponse;
}

export async function getSFTPSessions(
  uuid: string
): Promise<SFTPSessionsResponse> {
  const { status, data } = await api.get(
    `/clients/servers/${uuid}/sftp/sessions`
  );
  if (status !== 200) {
    throw new Error(data.detail || "Failed to fetch SFTP sessions");
  }
  return data as SFTPSessionsResponse;
}

export async function terminateSFTPSession(
  uuid: string,
  sessionId: string
): Promise<void> {
  const { status, data } = await api.delete(
    `/clients/servers/${uuid}/sftp/sessions/${sessionId}`
  );
  if (status !== 200) {
    throw new Error(data.detail || "Failed to terminate SFTP session");
  }
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

export function buildSFTPWebSocketURL(
  sessionId: string,
  wsToken: string
): string {
  const base = API_BASE_URL.replace(/^\//, "");
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/${base}/ws/sftp?token=${encodeURIComponent(wsToken)}&session_id=${encodeURIComponent(sessionId)}`;
}
