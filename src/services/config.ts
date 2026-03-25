/**
 * 系统配置 API 服务
 * 封装 /api/v1/config 接口
 * 提供 TanStack Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConfigItem {
  key: string;
  value: string | null;
}

export interface ConfigBatchItem {
  key: string;
  value: string;
}

export interface IpDbTestRequest {
  db_name: string;
  ip: string;
}

export interface IpDbTestResult {
  db_name: string;
  ip: string;
  region_code: string | null;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const configKeys = {
  all: ["config"] as const,
  lists: () => [...configKeys.all, "list"] as const,
  detail: (key: string) => [...configKeys.all, "detail", key] as const,
  ipDbAvailable: () => [...configKeys.all, "ip_db", "available"] as const,
};

// ── Raw API ───────────────────────────────────────────────────────────────────

export const configApi = {
  /** 获取所有配置项 */
  async list(): Promise<ConfigItem[]> {
    const { status, data } = await api.get("/config");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch config");
    return data as ConfigItem[];
  },

  /** 获取可用 IP 数据库列表 */
  async availableIpDbs(): Promise<string[]> {
    const { status, data } = await api.get("/config/ip_db/available");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch available IP DBs");
    return data as string[];
  },

  /** 测试 IP 数据库查询 */
  async testIpDb(payload: IpDbTestRequest): Promise<IpDbTestResult> {
    const { status, data } = await api.post("/config/ip_db/test", payload);
    if (status !== 200) {
      const msg = data?.detail || "Test failed";
      throw Object.assign(new Error(msg), { status });
    }
    return data as IpDbTestResult;
  },

  /** 批量设置配置项 */
  async batchSet(items: ConfigBatchItem[]): Promise<ConfigItem[]> {
    const { status, data } = await api.put("/config", items);
    if (status !== 200) {
      const msg = data?.detail || "Failed to batch update config";
      throw Object.assign(new Error(msg), { status });
    }
    return data as ConfigItem[];
  },

  /** 设置配置项（不存在时创建） */
  async set(key: string, value: string): Promise<ConfigItem> {
    const { status, data } = await api.put(`/config/${key}`, { value });
    if (status !== 200) {
      const msg = data?.detail || "Failed to update config";
      throw Object.assign(new Error(msg), { status });
    }
    return data as ConfigItem;
  },

  /** 删除配置项 */
  async remove(key: string): Promise<void> {
    const { status, data } = await api.delete(`/config/${key}`);
    if (status !== 204) {
      const msg = data?.detail || "Failed to delete config";
      throw Object.assign(new Error(msg), { status });
    }
  },
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** 获取所有配置（转换为 Record 方便查找） */
export function useConfigList() {
  return useQuery({
    queryKey: configKeys.lists(),
    queryFn: configApi.list,
    select: (items: ConfigItem[]) =>
      Object.fromEntries(items.map((item) => [item.key, item.value])) as Record<string, string | null>,
    staleTime: 30_000,
  });
}

/** 获取可用 IP 数据库列表 */
export function useAvailableIpDbs() {
  return useQuery({
    queryKey: configKeys.ipDbAvailable(),
    queryFn: configApi.availableIpDbs,
    staleTime: 60_000,
  });
}

/** 设置配置项（乐观更新） */
export function useSetConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      configApi.set(key, value),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: configKeys.lists() });
      const previousItems = queryClient.getQueryData<ConfigItem[]>(configKeys.lists());
      queryClient.setQueryData<ConfigItem[]>(configKeys.lists(), (old) => {
        if (!old) return [{ key, value }];
        const exists = old.some((item) => item.key === key);
        if (exists) return old.map((item) => item.key === key ? { key, value } : item);
        return [...old, { key, value }];
      });
      return { previousItems };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(configKeys.lists(), context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
    },
  });
}

/** 批量设置配置项（乐观更新） */
export function useBatchSetConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ConfigBatchItem[]) => configApi.batchSet(items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: configKeys.lists() });
      const previousItems = queryClient.getQueryData<ConfigItem[]>(configKeys.lists());
      queryClient.setQueryData<ConfigItem[]>(configKeys.lists(), (old) => {
        if (!old) return items;
        const updated = [...old];
        for (const { key, value } of items) {
          const idx = updated.findIndex((item) => item.key === key);
          if (idx >= 0) updated[idx] = { key, value };
          else updated.push({ key, value });
        }
        return updated;
      });
      return { previousItems };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(configKeys.lists(), context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
    },
  });
}

/** 删除配置项（乐观更新） */
export function useDeleteConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => configApi.remove(key),
    onMutate: async (key) => {
      await queryClient.cancelQueries({ queryKey: configKeys.lists() });
      const previousItems = queryClient.getQueryData<ConfigItem[]>(configKeys.lists());
      queryClient.setQueryData<ConfigItem[]>(configKeys.lists(), (old) =>
        old ? old.filter((item) => item.key !== key) : []
      );
      return { previousItems };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(configKeys.lists(), context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
    },
  });
}

/** 测试 IP 数据库 */
export function useTestIpDb() {
  return useMutation({
    mutationFn: (payload: IpDbTestRequest) => configApi.testIpDb(payload),
  });
}

// ── Theme & Favicon Types ─────────────────────────────────────────────────────

export interface ThemeInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  created_at: string;
  file_count: number;
  total_size: number;
  is_active: boolean;
  is_builtin: boolean;
}

// ── Theme & Favicon Query Keys ────────────────────────────────────────────────

export const themeKeys = {
  all: ["themes"] as const,
  list: () => [...themeKeys.all, "list"] as const,
};

// ── Theme & Favicon Raw API ───────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const themeApi = {
  async list(): Promise<ThemeInfo[]> {
    const { status, data } = await api.get("/config/themes");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch themes");
    return data as ThemeInfo[];
  },

  async upload(file: File): Promise<ThemeInfo> {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE_URL}/config/themes`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data?.detail || "Upload failed"), { status: res.status });
    return data as ThemeInfo;
  },

  async activate(themeId: string): Promise<void> {
    const { status, data } = await api.put("/config/themes/active", { theme_id: themeId });
    if (status !== 200) throw new Error(data?.detail || "Failed to activate theme");
  },

  async remove(themeId: string): Promise<void> {
    const { status, data } = await api.delete(`/config/themes/${themeId}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete theme");
  },

  async uploadFavicon(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE_URL}/config/favicon`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data?.detail || "Upload failed"), { status: res.status });
    return data as { url: string };
  },

  async deleteFavicon(): Promise<void> {
    const { status, data } = await api.delete("/config/favicon");
    if (status !== 200) throw new Error(data?.detail || "Failed to delete favicon");
  },
};

// ── Theme & Favicon Hooks ─────────────────────────────────────────────────────

/** 列出所有主题 */
export function useThemeList() {
  return useQuery({
    queryKey: themeKeys.list(),
    queryFn: themeApi.list,
    staleTime: 30_000,
  });
}

/** 上传主题 */
export function useUploadTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => themeApi.upload(file),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: themeKeys.list() });
    },
  });
}

/** 激活主题 */
export function useActivateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (themeId: string) => themeApi.activate(themeId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: themeKeys.list() });
    },
  });
}

/** 删除主题 */
export function useDeleteTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (themeId: string) => themeApi.remove(themeId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: themeKeys.list() });
    },
  });
}

/** 上传 Favicon */
export function useUploadFavicon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => themeApi.uploadFavicon(file),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["publicConfig"] });
    },
  });
}

/** 删除 Favicon */
export function useDeleteFavicon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => themeApi.deleteFavicon(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["publicConfig"] });
    },
  });
}
