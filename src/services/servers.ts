/**
 * 服务器管理 API 服务
 * 封装 /api/v1/clients/servers 及 /api/v1/clients/groups 接口
 * 提供 TanStack Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Server,
  Group,
  GroupWithServers,
  UpdateServerPayload,
  SetServerGroupsPayload,
  CreateGroupPayload,
  UpdateGroupPayload,
  BatchUpdateGroupTopsResult,
} from "@/types/server";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const serverKeys = {
  all: ["servers"] as const,
  lists: () => [...serverKeys.all, "list"] as const,
  detail: (uuid: string) => [...serverKeys.all, "detail", uuid] as const,
  groups: (uuid: string) => [...serverKeys.all, "groups", uuid] as const,
};

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
};

// ── 服务器 API ────────────────────────────────────────────────────────────────

const serverApi = {
  /** 获取服务器列表 */
  async list(): Promise<Server[]> {
    const { status, data } = await api.get("/clients/servers");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch servers");
    return data as Server[];
  },

  /** 更新服务器 */
  async update(uuid: string, payload: UpdateServerPayload): Promise<Server> {
    const { status, data } = await api.put(`/clients/servers/${uuid}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update server");
    return data as Server;
  },

  /** 删除服务器 */
  async remove(uuid: string): Promise<void> {
    const { status, data } = await api.delete(`/clients/servers/${uuid}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete server");
  },

  /** 批准服务器 */
  async approve(uuid: string): Promise<Server> {
    const { status, data } = await api.post(`/clients/servers/${uuid}/approve`);
    if (status !== 200) throw new Error(data?.detail || "Failed to approve server");
    return data as Server;
  },

  /** 获取服务器所属分组 */
  async getGroups(uuid: string): Promise<Group[]> {
    const { status, data } = await api.get(`/clients/servers/${uuid}/groups`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch server groups");
    return data as Group[];
  },

  /** 设置服务器分组 */
  async setGroups(uuid: string, payload: SetServerGroupsPayload): Promise<Group[]> {
    const { status, data } = await api.put(`/clients/servers/${uuid}/groups`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to set server groups");
    return data as Group[];
  },

  /** 批量更新排序值 */
  async batchUpdateTops(updates: Record<string, number>): Promise<{ total: number; updated: number; failed: number; failed_uuids: string[] }> {
    const { status, data } = await api.post("/clients/servers/batch/update-tops", { updates });
    if (status !== 200) throw new Error(data?.detail || "Failed to batch update tops");
    return data as { total: number; updated: number; failed: number; failed_uuids: string[] };
  },
};

// ── 分组 API ──────────────────────────────────────────────────────────────────

const groupApi = {
  /** 获取分组列表 */
  async list(): Promise<Group[]> {
    const { status, data } = await api.get("/clients/groups");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch groups");
    return data as Group[];
  },

  /** 创建分组 */
  async create(payload: CreateGroupPayload): Promise<Group> {
    const { status, data } = await api.post("/clients/groups", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create group");
    return data as Group;
  },

  /** 更新分组 */
  async update(id: string, payload: UpdateGroupPayload): Promise<Group> {
    const { status, data } = await api.put(`/clients/groups/${id}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update group");
    return data as Group;
  },

  /** 删除分组 */
  async remove(id: string): Promise<void> {
    const { status, data } = await api.delete(`/clients/groups/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete group");
  },

  /** 批量更新分组排序值 */
  async batchUpdateTops(updates: Record<string, number>): Promise<BatchUpdateGroupTopsResult> {
    const { status, data } = await api.post("/clients/groups/batch/update-tops", { updates });
    if (status !== 200) throw new Error(data?.detail || "Failed to batch update group tops");
    return data as BatchUpdateGroupTopsResult;
  },
};

/** 公开分组 API（含 server_uuids） */
const publicGroupApi = {
  async list(): Promise<GroupWithServers[]> {
    const { status, data } = await api.get("/clients/public/groups");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch groups");
    return data as GroupWithServers[];
  },
};

// ── TanStack Query Hooks — 服务器 ─────────────────────────────────────────────

/** 获取服务器列表 */
export function useServers(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: serverKeys.lists(),
    queryFn: serverApi.list,
    refetchInterval: options?.refetchInterval,
  });
}

/** 更新服务器 */
export function useUpdateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateServerPayload }) =>
      serverApi.update(uuid, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serverKeys.lists() });
    },
  });
}

/** 删除服务器 */
export function useDeleteServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => serverApi.remove(uuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serverKeys.lists() });
    },
  });
}

/** 批准服务器 */
export function useApproveServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => serverApi.approve(uuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serverKeys.lists() });
    },
  });
}

/** 设置服务器分组 */
export function useSetServerGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: SetServerGroupsPayload }) =>
      serverApi.setGroups(uuid, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serverKeys.lists() });
    },
  });
}

/** 批量更新排序值 */
export function useBatchUpdateTops() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<string, number>) =>
      serverApi.batchUpdateTops(updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serverKeys.lists() });
    },
  });
}

// ── TanStack Query Hooks — 分组 ───────────────────────────────────────────────

/** 获取分组列表（管理端，不含 server_uuids） */
export function useGroups() {
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: groupApi.list,
  });
}

/** 获取分组列表（公开端点，含 server_uuids，已登录时返回全量） */
export function usePublicGroups(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: [...groupKeys.lists(), "public"] as const,
    queryFn: publicGroupApi.list,
    refetchInterval: options?.refetchInterval,
  });
}

/** 创建分组 */
export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => groupApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

/** 更新分组 */
export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGroupPayload }) =>
      groupApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

/** 删除分组 */
export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.lists() });
      qc.invalidateQueries({ queryKey: serverKeys.lists() });
    },
  });
}

/** 批量更新分组排序值 */
export function useBatchUpdateGroupTops() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<string, number>) =>
      groupApi.batchUpdateTops(updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}
