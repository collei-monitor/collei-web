/**
 * OIDC 提供商管理 API 服务
 * 封装 /api/v1/auth/oidc 接口
 * 提供 TanStack Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OIDCProviderCreate {
  name: string;
  provider_type: string;
  client_id: string;
  client_secret?: string | null;
  enabled: number;
  display_order: number;
  scope?: string | null;
  addition?: string | null;
}

export interface OIDCProviderRead {
  name: string;
  provider_type: string;
  client_id: string;
  has_secret: boolean;
  enabled: number;
  display_order: number;
  scope: string | null;
  addition: string | null;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const oidcKeys = {
  all: ["oidc"] as const,
  list: () => [...oidcKeys.all, "list"] as const,
  supportedTypes: () => [...oidcKeys.all, "supportedTypes"] as const,
};

// ── Raw API ───────────────────────────────────────────────────────────────────

export const oidcApi = {
  /** 获取所有 OIDC 提供商 */
  async list(): Promise<OIDCProviderRead[]> {
    const { status, data } = await api.get("/auth/oidc");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch OIDC providers");
    return data as OIDCProviderRead[];
  },

  /** 创建或更新 OIDC 提供商 */
  async upsert(payload: OIDCProviderCreate): Promise<OIDCProviderRead> {
    const { status, data } = await api.post("/auth/oidc", payload);
    if (status !== 201 && status !== 200) {
      throw new Error(data?.detail || "Failed to save OIDC provider");
    }
    return data as OIDCProviderRead;
  },

  /** 删除 OIDC 提供商 */
  async remove(name: string): Promise<void> {
    const { status, data } = await api.delete(`/auth/oidc/${encodeURIComponent(name)}`);
    if (status !== 200) {
      throw new Error(data?.detail || "Failed to delete OIDC provider");
    }
  },
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** 获取所有 OIDC 提供商列表 */
export function useOIDCProviders() {
  return useQuery({
    queryKey: oidcKeys.list(),
    queryFn: oidcApi.list,
    staleTime: 30_000,
  });
}

/** 创建或更新 OIDC 提供商 */
export function useUpsertOIDC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OIDCProviderCreate) => oidcApi.upsert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oidcKeys.list() });
    },
  });
}

/** 删除 OIDC 提供商 */
export function useDeleteOIDC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => oidcApi.remove(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oidcKeys.list() });
    },
  });
}
