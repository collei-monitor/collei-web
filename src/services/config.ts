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
