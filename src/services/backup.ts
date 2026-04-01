/**
 * 系统备份与恢复 API 服务
 * 封装 /api/v1/system 接口
 * 提供 TanStack Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BackupMeta {
  version: number;
  created_at: number;
  collei_version: string;
  exclude_monitoring: boolean;
  files: string[];
}

export interface RestoreStatus {
  pending: boolean;
  backup_meta: BackupMeta | null;
}

export interface RestoreUploadResult {
  message: string;
  backup_meta: BackupMeta;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const backupKeys = {
  all: ["backup"] as const,
  restoreStatus: () => [...backupKeys.all, "restore-status"] as const,
};

// ── Raw API ───────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const backupApi = {
  /** 下载加密备份文件 */
  async download(password: string, excludeMonitoring = false): Promise<Blob> {
    const params = new URLSearchParams({ password });
    if (excludeMonitoring) params.append("exclude_monitoring", "true");

    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_BASE_URL}/system/backup?${params.toString()}`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const msg = (data as { detail?: string })?.detail || "Backup failed";
      throw Object.assign(new Error(msg), { status: response.status });
    }

    return response.blob();
  },

  /** 上传备份文件进行恢复 */
  async restore(file: File, password: string): Promise<RestoreUploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);

    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/system/restore`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = (data as { detail?: string })?.detail || "Restore failed";
      throw Object.assign(new Error(msg), { status: response.status });
    }
    return data as RestoreUploadResult;
  },

  /** 查询待恢复状态 */
  async restoreStatus(): Promise<RestoreStatus> {
    const { status, data } = await api.get("/system/restore/status");
    if (status !== 200) {
      throw new Error(
        (data as { detail?: string })?.detail ||
          "Failed to fetch restore status",
      );
    }
    return data as RestoreStatus;
  },

  /** 取消待恢复 */
  async cancelRestore(): Promise<void> {
    const { status, data } = await api.delete("/system/restore");
    if (status !== 200) {
      const msg =
        (data as { detail?: string })?.detail || "Failed to cancel restore";
      throw Object.assign(new Error(msg), { status });
    }
  },
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** 查询待恢复状态 */
export function useRestoreStatus() {
  return useQuery({
    queryKey: backupKeys.restoreStatus(),
    queryFn: backupApi.restoreStatus,
    refetchInterval: 10_000,
  });
}

/** 下载备份 */
export function useDownloadBackup() {
  return useMutation({
    mutationFn: ({
      password,
      excludeMonitoring,
    }: {
      password: string;
      excludeMonitoring?: boolean;
    }) => backupApi.download(password, excludeMonitoring),
  });
}

/** 上传恢复文件 */
export function useUploadRestore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, password }: { file: File; password: string }) =>
      backupApi.restore(file, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.restoreStatus() });
    },
  });
}

/** 取消待恢复 */
export function useCancelRestore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => backupApi.cancelRestore(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.restoreStatus() });
    },
  });
}
