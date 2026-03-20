/**
 * 远程命令执行 — 类型定义
 */

// ── 任务类型 ──────────────────────────────────────────────────────────────────

export type TaskType = "shell" | "command" | "script" | "upgrade_agent";

export const TASK_TYPES: TaskType[] = ["shell", "command", "script", "upgrade_agent"];

// ── 执行状态 ──────────────────────────────────────────────────────────────────

export type ExecutionStatus = "pending" | "sent" | "running" | "success" | "failed" | "timeout";

export const EXECUTION_STATUSES: ExecutionStatus[] = [
  "pending",
  "sent",
  "running",
  "success",
  "failed",
  "timeout",
];

// ── 数据模型 ──────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  type: TaskType;
  payload: string;
  timeout_sec: number;
  created_at: number;
}

export interface TaskExecution {
  id: string;
  task_id: string;
  agent_id: string;
  status: ExecutionStatus;
  exit_code: number | null;
  dispatched_at: number | null;
  completed_at: number | null;
}

export interface TaskExecutionDetail extends TaskExecution {
  output: string | null;
}

export interface TaskWithExecutions extends Task {
  executions: TaskExecution[];
}

// ── 请求载荷 ──────────────────────────────────────────────────────────────────

export interface CreateTaskPayload {
  type: TaskType;
  payload: string;
  timeout_sec?: number;
  agent_ids: string[];
}

export interface CreateTaskResponse {
  task: Task;
  executions: TaskExecution[];
}

export interface UpdateExecutionPayload {
  status: ExecutionStatus;
  exit_code?: number | null;
  output?: string | null;
}
