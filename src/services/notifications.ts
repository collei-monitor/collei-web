/**
 * 告警与通知系统 API 服务
 * 封装 /api/v1/notifications 接口
 * 提供 TanStack Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  ProviderRead,
  CreateProviderPayload,
  UpdateProviderPayload,
  AlertChannelRead,
  CreateChannelPayload,
  UpdateChannelPayload,
  AlertRuleRead,
  CreateRulePayload,
  UpdateRulePayload,
  AlertRuleMappingRead,
  CreateMappingPayload,
  AlertHistoryRead,
  AlertHistoryParams,
  AlertEngineStatus,
  AlertStateItem,
  MessageResponse,
} from "@/types/notification";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const providerKeys = {
  all: ["providers"] as const,
  lists: () => [...providerKeys.all, "list"] as const,
  detail: (id: number) => [...providerKeys.all, "detail", id] as const,
};

export const channelKeys = {
  all: ["channels"] as const,
  lists: () => [...channelKeys.all, "list"] as const,
  detail: (id: number) => [...channelKeys.all, "detail", id] as const,
};

export const ruleKeys = {
  all: ["rules"] as const,
  lists: () => [...ruleKeys.all, "list"] as const,
  detail: (id: number) => [...ruleKeys.all, "detail", id] as const,
  mappings: (id: number) => [...ruleKeys.all, "mappings", id] as const,
};

export const historyKeys = {
  all: ["alertHistory"] as const,
  lists: (params?: AlertHistoryParams) =>
    [...historyKeys.all, "list", params] as const,
};

export const engineKeys = {
  all: ["alertEngine"] as const,
  status: () => [...engineKeys.all, "status"] as const,
  states: () => [...engineKeys.all, "states"] as const,
  firing: () => [...engineKeys.all, "firing"] as const,
  pending: () => [...engineKeys.all, "pending"] as const,
};

// ── Provider API ──────────────────────────────────────────────────────────────

const providerApi = {
  async list(): Promise<ProviderRead[]> {
    const { status, data } = await api.get("/notifications/providers");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch providers");
    return data as ProviderRead[];
  },

  async get(id: number): Promise<ProviderRead> {
    const { status, data } = await api.get(`/notifications/providers/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch provider");
    return data as ProviderRead;
  },

  async create(payload: CreateProviderPayload): Promise<ProviderRead> {
    const { status, data } = await api.post("/notifications/providers", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create provider");
    return data as ProviderRead;
  },

  async update(id: number, payload: UpdateProviderPayload): Promise<ProviderRead> {
    const { status, data } = await api.put(`/notifications/providers/${id}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update provider");
    return data as ProviderRead;
  },

  async remove(id: number): Promise<MessageResponse> {
    const { status, data } = await api.delete(`/notifications/providers/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete provider");
    return data as MessageResponse;
  },
};

// ── Channel API ───────────────────────────────────────────────────────────────

const channelApi = {
  async list(): Promise<AlertChannelRead[]> {
    const { status, data } = await api.get("/notifications/channels");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch channels");
    return data as AlertChannelRead[];
  },

  async get(id: number): Promise<AlertChannelRead> {
    const { status, data } = await api.get(`/notifications/channels/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch channel");
    return data as AlertChannelRead;
  },

  async create(payload: CreateChannelPayload): Promise<AlertChannelRead> {
    const { status, data } = await api.post("/notifications/channels", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create channel");
    return data as AlertChannelRead;
  },

  async update(id: number, payload: UpdateChannelPayload): Promise<AlertChannelRead> {
    const { status, data } = await api.put(`/notifications/channels/${id}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update channel");
    return data as AlertChannelRead;
  },

  async remove(id: number): Promise<MessageResponse> {
    const { status, data } = await api.delete(`/notifications/channels/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete channel");
    return data as MessageResponse;
  },

  async test(id: number): Promise<MessageResponse> {
    const { status, data } = await api.post(`/notifications/channels/${id}/test`);
    if (status !== 200) throw new Error(data?.detail || "Failed to test channel");
    return data as MessageResponse;
  },
};

// ── Rule API ──────────────────────────────────────────────────────────────────

const ruleApi = {
  async list(): Promise<AlertRuleRead[]> {
    const { status, data } = await api.get("/notifications/rules");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch rules");
    return data as AlertRuleRead[];
  },

  async get(id: number): Promise<AlertRuleRead> {
    const { status, data } = await api.get(`/notifications/rules/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch rule");
    return data as AlertRuleRead;
  },

  async create(payload: CreateRulePayload): Promise<AlertRuleRead> {
    const { status, data } = await api.post("/notifications/rules", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create rule");
    return data as AlertRuleRead;
  },

  async update(id: number, payload: UpdateRulePayload): Promise<AlertRuleRead> {
    const { status, data } = await api.put(`/notifications/rules/${id}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update rule");
    return data as AlertRuleRead;
  },

  async remove(id: number): Promise<MessageResponse> {
    const { status, data } = await api.delete(`/notifications/rules/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete rule");
    return data as MessageResponse;
  },
};

// ── Mapping API ───────────────────────────────────────────────────────────────

const mappingApi = {
  async list(ruleId: number): Promise<AlertRuleMappingRead[]> {
    const { status, data } = await api.get(`/notifications/rules/${ruleId}/mappings`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch mappings");
    return data as AlertRuleMappingRead[];
  },

  async create(ruleId: number, payload: CreateMappingPayload): Promise<AlertRuleMappingRead> {
    const { status, data } = await api.post(
      `/notifications/rules/${ruleId}/mappings`,
      payload,
    );
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create mapping");
    return data as AlertRuleMappingRead;
  },

  async remove(
    ruleId: number,
    targetType: string,
    targetId: string,
    channelId: number,
  ): Promise<MessageResponse> {
    const { status, data } = await api.delete(
      `/notifications/rules/${ruleId}/mappings`,
      { target_type: targetType, target_id: targetId, channel_id: channelId },
    );
    if (status !== 200) throw new Error(data?.detail || "Failed to delete mapping");
    return data as MessageResponse;
  },

  async removeAll(ruleId: number): Promise<MessageResponse> {
    const { status, data } = await api.delete(
      `/notifications/rules/${ruleId}/mappings/all`,
    );
    if (status !== 200) throw new Error(data?.detail || "Failed to delete mappings");
    return data as MessageResponse;
  },
};

// ── History API ───────────────────────────────────────────────────────────────

const historyApi = {
  async list(params?: AlertHistoryParams): Promise<AlertHistoryRead[]> {
    const { status, data } = await api.get("/notifications/history", params);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch history");
    return data as AlertHistoryRead[];
  },
};

// ── Engine API ────────────────────────────────────────────────────────────────

const engineApi = {
  async status(): Promise<AlertEngineStatus> {
    const { status, data } = await api.get("/notifications/engine/status");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch engine status");
    return data as AlertEngineStatus;
  },

  async states(): Promise<AlertStateItem[]> {
    const { status, data } = await api.get("/notifications/engine/states");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch engine states");
    return data as AlertStateItem[];
  },

  async firing(): Promise<AlertStateItem[]> {
    const { status, data } = await api.get("/notifications/engine/states/firing");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch firing states");
    return data as AlertStateItem[];
  },

  async pending(): Promise<AlertStateItem[]> {
    const { status, data } = await api.get("/notifications/engine/states/pending");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch pending states");
    return data as AlertStateItem[];
  },

  async reload(): Promise<MessageResponse> {
    const { status, data } = await api.post("/notifications/engine/reload");
    if (status !== 200) throw new Error(data?.detail || "Failed to reload engine");
    return data as MessageResponse;
  },
};

// ── TanStack Query Hooks — Provider ───────────────────────────────────────────

export function useProviders() {
  return useQuery({
    queryKey: providerKeys.lists(),
    queryFn: providerApi.list,
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProviderPayload) => providerApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProviderPayload }) =>
      providerApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => providerApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
      qc.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
}

// ── TanStack Query Hooks — Channel ────────────────────────────────────────────

export function useChannels() {
  return useQuery({
    queryKey: channelKeys.lists(),
    queryFn: channelApi.list,
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => channelApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
}

export function useUpdateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateChannelPayload }) =>
      channelApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => channelApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
}

export function useTestChannel() {
  return useMutation({
    mutationFn: (id: number) => channelApi.test(id),
  });
}

// ── TanStack Query Hooks — Rule ───────────────────────────────────────────────

export function useRules() {
  return useQuery({
    queryKey: ruleKeys.lists(),
    queryFn: ruleApi.list,
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRulePayload) => ruleApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRulePayload }) =>
      ruleApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ruleApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ruleKeys.lists() });
      qc.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}

// ── TanStack Query Hooks — Mapping ────────────────────────────────────────────

export function useRuleMappings(ruleId: number) {
  return useQuery({
    queryKey: ruleKeys.mappings(ruleId),
    queryFn: () => mappingApi.list(ruleId),
    enabled: ruleId > 0,
  });
}

export function useCreateMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ruleId,
      payload,
    }: {
      ruleId: number;
      payload: CreateMappingPayload;
    }) => mappingApi.create(ruleId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ruleKeys.mappings(variables.ruleId) });
    },
  });
}

export function useDeleteMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ruleId,
      targetType,
      targetId,
      channelId,
    }: {
      ruleId: number;
      targetType: string;
      targetId: string;
      channelId: number;
    }) => mappingApi.remove(ruleId, targetType, targetId, channelId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ruleKeys.mappings(variables.ruleId) });
    },
  });
}

export function useDeleteAllMappings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: number) => mappingApi.removeAll(ruleId),
    onSuccess: (_data, ruleId) => {
      qc.invalidateQueries({ queryKey: ruleKeys.mappings(ruleId) });
    },
  });
}

// ── TanStack Query Hooks — History ────────────────────────────────────────────

export function useAlertHistory(params?: AlertHistoryParams) {
  return useQuery({
    queryKey: historyKeys.lists(params),
    queryFn: () => historyApi.list(params),
  });
}

// ── TanStack Query Hooks — Engine ─────────────────────────────────────────────

export function useEngineStatus(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: engineKeys.status(),
    queryFn: engineApi.status,
    refetchInterval: options?.refetchInterval,
  });
}

export function useEngineStates(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: engineKeys.states(),
    queryFn: engineApi.states,
    refetchInterval: options?.refetchInterval,
  });
}

export function useEngineFiring(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: engineKeys.firing(),
    queryFn: engineApi.firing,
    refetchInterval: options?.refetchInterval,
  });
}

export function useEnginePending(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: engineKeys.pending(),
    queryFn: engineApi.pending,
    refetchInterval: options?.refetchInterval,
  });
}

export function useReloadEngine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => engineApi.reload(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: engineKeys.all });
    },
  });
}
