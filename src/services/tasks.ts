/**
 * 远程命令执行 API 服务
 * 封装 /api/v1/clients/tasks 接口
 * 提供 TanStack Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Task,
  TaskWithExecutions,
  TaskExecution,
  TaskExecutionDetail,
  CreateTaskPayload,
  CreateTaskResponse,
  UpdateExecutionPayload,
} from "@/types/task";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const taskKeys = {
  all: ["tasks"] as const,
  lists: (params?: { limit?: number; offset?: number }) =>
    [...taskKeys.all, "list", params] as const,
  detail: (id: string) => [...taskKeys.all, "detail", id] as const,
  executions: (taskId: string) =>
    [...taskKeys.all, "executions", taskId] as const,
  executionDetail: (execId: string) =>
    [...taskKeys.all, "executionDetail", execId] as const,
};

// ── Raw API ───────────────────────────────────────────────────────────────────

const taskApi = {
  /** 创建任务 */
  async create(payload: CreateTaskPayload): Promise<CreateTaskResponse> {
    const { status, data } = await api.post("/clients/tasks", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create task");
    return data as CreateTaskResponse;
  },

  /** 获取任务列表 */
  async list(
    params: { limit?: number; offset?: number } = {}
  ): Promise<Task[]> {
    const { status, data } = await api.get("/clients/tasks", params);
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch tasks");
    return data as Task[];
  },

  /** 获取任务详情（含执行记录） */
  async detail(taskId: string): Promise<TaskWithExecutions> {
    const { status, data } = await api.get(`/clients/tasks/${taskId}`);
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch task detail");
    return data as TaskWithExecutions;
  },

  /** 删除任务 */
  async remove(taskId: string): Promise<void> {
    const { status, data } = await api.delete(`/clients/tasks/${taskId}`);
    if (status !== 200)
      throw new Error(data?.detail || "Failed to delete task");
  },

  /** 获取任务的执行记录列表 */
  async executions(taskId: string): Promise<TaskExecution[]> {
    const { status, data } = await api.get(
      `/clients/tasks/${taskId}/executions`
    );
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch executions");
    return data as TaskExecution[];
  },

  /** 获取执行记录详情（含日志） */
  async executionDetail(execId: string): Promise<TaskExecutionDetail> {
    const { status, data } = await api.get(
      `/clients/tasks/executions/${execId}`
    );
    if (status !== 200)
      throw new Error(data?.detail || "Failed to fetch execution detail");
    return data as TaskExecutionDetail;
  },

  /** 手动更新执行记录状态 */
  async updateExecution(
    execId: string,
    payload: UpdateExecutionPayload
  ): Promise<TaskExecution> {
    const { status, data } = await api.put(
      `/clients/tasks/executions/${execId}`,
      payload
    );
    if (status !== 200)
      throw new Error(data?.detail || "Failed to update execution");
    return data as TaskExecution;
  },
};

// ── TanStack Query Hooks ──────────────────────────────────────────────────────

/** 获取任务列表 */
export function useTasks(params: { limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: taskKeys.lists(params),
    queryFn: () => taskApi.list(params),
  });
}

/** 获取任务详情（含执行记录） */
export function useTaskDetail(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.detail(taskId ?? ""),
    queryFn: () => taskApi.detail(taskId!),
    enabled: !!taskId,
    refetchInterval: 5000,
  });
}

/** 获取执行记录详情（含日志输出） */
export function useExecutionDetail(execId: string | null) {
  return useQuery({
    queryKey: taskKeys.executionDetail(execId ?? ""),
    queryFn: () => taskApi.executionDetail(execId!),
    enabled: !!execId,
    refetchInterval: 5000,
  });
}

/** 创建任务 */
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => taskApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/** 删除任务 */
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => taskApi.remove(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/** 手动更新执行记录状态 */
export function useUpdateExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      execId,
      payload,
    }: {
      execId: string;
      payload: UpdateExecutionPayload;
    }) => taskApi.updateExecution(execId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
