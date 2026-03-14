/**
 * 网络监控 API 服务
 * 封装 /api/v1/clients/network 接口
 * 提供 TanStack Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  NetworkTarget,
  NetworkTargetDetail,
  CreateNetworkTargetPayload,
  UpdateNetworkTargetPayload,
  SetDispatchPayload,
  NetworkStatus,
  NetworkStatusLatest,
  NetworkStatusParams,
  NetworkProbeRecord,
  NetworkProbeParams,
} from "@/types/network";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const networkKeys = {
  all: ["network"] as const,
  targets: () => [...networkKeys.all, "targets"] as const,
  target: (id: number) => [...networkKeys.all, "target", id] as const,
  status: (id: number) => [...networkKeys.all, "status", id] as const,
  statusLatest: (id: number) => [...networkKeys.all, "statusLatest", id] as const,
  publicProbe: (uuid: string) => [...networkKeys.all, "publicProbe", uuid] as const,
};

// ── Raw API ───────────────────────────────────────────────────────────────────

const networkApi = {
  /** 获取所有监控目标 */
  async listTargets(enabledOnly = false): Promise<NetworkTarget[]> {
    const { status, data } = await api.get("/clients/network/targets", {
      enabled_only: enabledOnly,
    });
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch network targets");
    return data as NetworkTarget[];
  },

  /** 获取目标详情（含下发配置） */
  async getTarget(id: number): Promise<NetworkTargetDetail> {
    const { status, data } = await api.get(`/clients/network/targets/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch network target");
    return data as NetworkTargetDetail;
  },

  /** 创建监控目标 */
  async createTarget(payload: CreateNetworkTargetPayload): Promise<NetworkTarget> {
    const { status, data } = await api.post("/clients/network/targets", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create network target");
    return data as NetworkTarget;
  },

  /** 更新监控目标 */
  async updateTarget(id: number, payload: UpdateNetworkTargetPayload): Promise<NetworkTarget> {
    const { status, data } = await api.put(`/clients/network/targets/${id}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update network target");
    return data as NetworkTarget;
  },

  /** 删除监控目标 */
  async deleteTarget(id: number): Promise<void> {
    const { status, data } = await api.delete(`/clients/network/targets/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete network target");
  },

  /** 设置目标下发节点（全量替换） */
  async setDispatch(id: number, payload: SetDispatchPayload): Promise<void> {
    const { status, data } = await api.put(
      `/clients/network/targets/${id}/dispatch`,
      payload,
    );
    if (status !== 200) throw new Error(data?.detail || "Failed to set dispatch");
  },

  /** 查询目标探测历史结果 */
  async getStatus(id: number, params?: NetworkStatusParams): Promise<NetworkStatus[]> {
    const { status, data } = await api.get(`/clients/network/status/${id}`, params);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch network status");
    return data as NetworkStatus[];
  },

  /** 获取目标各节点最新探测结果 */
  async getStatusLatest(id: number): Promise<NetworkStatusLatest[]> {
    const { status, data } = await api.get(`/clients/network/status/${id}/latest`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch latest network status");
    return data as NetworkStatusLatest[];
  },

  /** 公开接口：获取指定服务器的网络探测数据 */
  async getServerNetworkProbes(uuid: string, params?: NetworkProbeParams): Promise<NetworkProbeRecord[]> {
    const { status, data } = await api.get(`/clients/public/servers/${uuid}/network`, params);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch server network probes");
    return data as NetworkProbeRecord[];
  },
};

// ── TanStack Query Hooks ──────────────────────────────────────────────────────

/** 获取所有监控目标列表 */
export function useNetworkTargets(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: networkKeys.targets(),
    queryFn: () => networkApi.listTargets(false),
    refetchInterval: options?.refetchInterval,
  });
}

/** 获取目标详情（含下发配置） */
export function useNetworkTargetDetail(id: number | null) {
  return useQuery({
    queryKey: networkKeys.target(id ?? 0),
    queryFn: () => networkApi.getTarget(id!),
    enabled: id != null && id > 0,
  });
}

/** 创建监控目标 */
export function useCreateNetworkTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNetworkTargetPayload) => networkApi.createTarget(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: networkKeys.targets() });
    },
  });
}

/** 更新监控目标 */
export function useUpdateNetworkTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateNetworkTargetPayload }) =>
      networkApi.updateTarget(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: networkKeys.targets() });
      qc.invalidateQueries({ queryKey: networkKeys.target(id) });
    },
  });
}

/** 删除监控目标 */
export function useDeleteNetworkTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => networkApi.deleteTarget(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: networkKeys.targets() });
    },
  });
}

/** 设置下发节点配置 */
export function useSetNetworkDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SetDispatchPayload }) =>
      networkApi.setDispatch(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: networkKeys.target(id) });
    },
  });
}

/** 查询探测历史结果 */
export function useNetworkStatus(id: number | null, params?: NetworkStatusParams) {
  return useQuery({
    queryKey: [...networkKeys.status(id ?? 0), params],
    queryFn: () => networkApi.getStatus(id!, params),
    enabled: id != null && id > 0,
  });
}

/** 获取各节点最新探测结果 */
export function useNetworkStatusLatest(id: number | null) {
  return useQuery({
    queryKey: networkKeys.statusLatest(id ?? 0),
    queryFn: () => networkApi.getStatusLatest(id!),
    enabled: id != null && id > 0,
    refetchInterval: 30_000,
  });
}

/** 公开接口：获取指定服务器的网络探测数据 */
export function useServerNetworkProbes(
  uuid: string | undefined,
  params?: NetworkProbeParams,
  options?: { refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: [...networkKeys.publicProbe(uuid ?? ""), params],
    queryFn: () => networkApi.getServerNetworkProbes(uuid!, params),
    enabled: !!uuid,
    refetchInterval: options?.refetchInterval,
  });
}
