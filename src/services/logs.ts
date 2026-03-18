/**
 * 审计日志 API 服务
 * 封装 GET /api/v1/logs 接口
 */

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { LogListResponse, LogQueryParams } from "@/types/log";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const logKeys = {
  all: ["logs"] as const,
  list: (params: LogQueryParams) => [...logKeys.all, "list", params] as const,
};

// ── Raw API ───────────────────────────────────────────────────────────────────

export const logApi = {
  async list(params: LogQueryParams = {}): Promise<LogListResponse> {
    const { status, data } = await api.get("/logs", params);
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch logs");
    return data as LogListResponse;
  },
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useLogs(params: LogQueryParams) {
  return useQuery({
    queryKey: logKeys.list(params),
    queryFn: () => logApi.list(params),
  });
}
