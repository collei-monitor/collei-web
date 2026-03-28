/**
 * SSH 快捷脚本库 API 服务
 * 封装 /api/v1/clients/ssh-scripts 接口
 * 提供 TanStack Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  SshScript,
  CreateSshScriptPayload,
  UpdateSshScriptPayload,
  BatchUpdateSshScriptTopsResult,
} from "@/types/sshScript";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const sshScriptKeys = {
  all: ["ssh-scripts"] as const,
  lists: () => [...sshScriptKeys.all, "list"] as const,
  detail: (id: number) => [...sshScriptKeys.all, "detail", id] as const,
};

// ── Raw API ───────────────────────────────────────────────────────────────────

const sshScriptApi = {
  /** 获取脚本列表（按 top desc, created_at desc） */
  async list(): Promise<SshScript[]> {
    const { status, data } = await api.get("/clients/ssh-scripts");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch SSH scripts");
    return data as SshScript[];
  },

  /** 创建脚本 */
  async create(payload: CreateSshScriptPayload): Promise<SshScript> {
    const { status, data } = await api.post("/clients/ssh-scripts", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create SSH script");
    return data as SshScript;
  },

  /** 获取单个脚本 */
  async getOne(id: number): Promise<SshScript> {
    const { status, data } = await api.get(`/clients/ssh-scripts/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch SSH script");
    return data as SshScript;
  },

  /** 更新脚本 */
  async update(id: number, payload: UpdateSshScriptPayload): Promise<SshScript> {
    const { status, data } = await api.put(`/clients/ssh-scripts/${id}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update SSH script");
    return data as SshScript;
  },

  /** 删除脚本 */
  async remove(id: number): Promise<void> {
    const { status, data } = await api.delete(`/clients/ssh-scripts/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete SSH script");
  },

  /** 批量更新排序值 */
  async batchUpdateTops(updates: Record<number, number>): Promise<BatchUpdateSshScriptTopsResult> {
    const { status, data } = await api.post("/clients/ssh-scripts/batch/update-tops", { updates });
    if (status !== 200)
      throw new Error(data?.detail || "Failed to batch update SSH script tops");
    return data as BatchUpdateSshScriptTopsResult;
  },
};

// ── TanStack Query Hooks ──────────────────────────────────────────────────────

/** 获取脚本列表 */
export function useSshScripts() {
  return useQuery({
    queryKey: sshScriptKeys.lists(),
    queryFn: sshScriptApi.list,
  });
}

/** 创建脚本 */
export function useCreateSshScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSshScriptPayload) => sshScriptApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sshScriptKeys.lists() });
    },
  });
}

/** 更新脚本 */
export function useUpdateSshScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSshScriptPayload }) =>
      sshScriptApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sshScriptKeys.lists() });
    },
  });
}

/** 删除脚本 */
export function useDeleteSshScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sshScriptApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sshScriptKeys.lists() });
    },
  });
}

/** 批量更新排序值 */
export function useBatchUpdateSshScriptTops() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<number, number>) => sshScriptApi.batchUpdateTops(updates),
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: sshScriptKeys.lists() });
      const previous = qc.getQueryData<SshScript[]>(sshScriptKeys.lists());
      if (previous) {
        qc.setQueryData<SshScript[]>(
          sshScriptKeys.lists(),
          previous.map((s) =>
            updates[s.id] !== undefined ? { ...s, top: updates[s.id] } : s,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) {
        qc.setQueryData(sshScriptKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: sshScriptKeys.lists() });
    },
  });
}
