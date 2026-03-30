/**
 * File API WebSocket 连接管理 hook
 * 处理会话创建、WS 连接、request_id 匹配、原生文件操作和生命周期
 * 与 SFTP 不同：无密码认证，直连 Agent 本机文件系统
 */

import { useRef, useCallback, useState, useEffect } from "react";
import { createFileSession, buildFileWebSocketURL } from "@/services/fileapi";
import type {
  FileAPIConnectionStatus,
  FileAPIDownMessage,
  FileEntry,
  FileUploadTask,
} from "@/types/fileapi";

// ── 内部类型 ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PendingRequest<T = any> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

interface BinaryReadState {
  requestId: string;
  expectedSize: number;
  chunks: ArrayBuffer[];
  received: number;
}

// ── Hook 接口 ─────────────────────────────────────────────────────────────────

export interface UseFileAPIConnectionOptions {
  serverUuid: string;
  onReady?: () => void;
  onError?: (message: string) => void;
  onClosed?: (reason: string) => void;
}

const CHUNK_SIZE = 65536; // 64 KB

export function useFileAPIConnection(options: UseFileAPIConnectionOptions) {
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; });

  const [status, setStatus] = useState<FileAPIConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadTasks, setUploadTasks] = useState<FileUploadTask[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef("");
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const binaryReadRef = useRef<BinaryReadState | null>(null);
  const pendingBinaryReadIdRef = useRef<string | null>(null);

  // ── 清理 ────────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try { ws.send(JSON.stringify({ action: "close" })); } catch { /* ignore */ }
        ws.close();
      }
    }
    // reject all pending
    for (const [, p] of pendingRef.current) {
      p.reject(new Error("Connection closed"));
    }
    pendingRef.current.clear();
    binaryReadRef.current = null;
    pendingBinaryReadIdRef.current = null;
  }, []);

  // ── 请求发送辅助 ────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendRequest = useCallback(<T = any>(action: string, params: Record<string, unknown> = {}): Promise<T> => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("WebSocket not connected"));
    }
    const requestId = crypto.randomUUID();
    return new Promise<T>((resolve, reject) => {
      pendingRef.current.set(requestId, { resolve, reject });
      ws.send(JSON.stringify({ action, request_id: requestId, ...params }));
    });
  }, []);

  // ── 消息处理 ────────────────────────────────────────────────────────────────

  const handleJsonFrame = useCallback((msg: FileAPIDownMessage) => {
    if (msg.type === "ready") {
      setStatus("connected");
      optionsRef.current.onReady?.();
      return;
    }
    if (msg.type === "closed") {
      setStatus("closed");
      optionsRef.current.onClosed?.(msg.reason);
      cleanup();
      return;
    }
    if (msg.type === "pong") return;

    // 二进制 read_resp 可能不含 request_id（仅含 session_id），需特殊处理
    if (msg.type === "read_resp" && !("content" in msg)) {
      const rid = ("request_id" in msg ? (msg as { request_id?: string }).request_id : null) || pendingBinaryReadIdRef.current;
      if (!rid) return;
      const pending = pendingRef.current.get(rid);
      if (!pending) return;
      const expectedSize = ("size" in msg ? (msg as { size?: number }).size : 0) ?? 0;
      // 空文件：直接 resolve，无需等待 binary 帧
      if (expectedSize === 0) {
        pending.resolve({ chunks: [], path: ("path" in msg ? (msg as { path?: string }).path : "") ?? "" });
        pendingRef.current.delete(rid);
        pendingBinaryReadIdRef.current = null;
        return;
      }
      binaryReadRef.current = {
        requestId: rid,
        expectedSize,
        chunks: [],
        received: 0,
      };
      pendingBinaryReadIdRef.current = null;
      return;
    }

    // 通用 request_id 响应
    const rid = "request_id" in msg ? msg.request_id : undefined;
    if (!rid) {
      // 全局错误
      if (msg.type === "error") {
        setErrorMessage(msg.message);
        optionsRef.current.onError?.(msg.message);
      }
      return;
    }

    const pending = pendingRef.current.get(rid);
    if (!pending) return;

    if (msg.type === "error") {
      pending.reject(new Error(msg.message));
      // 清理可能的 binary read 状态
      if (binaryReadRef.current?.requestId === rid) {
        binaryReadRef.current = null;
      }
      if (pendingBinaryReadIdRef.current === rid) {
        pendingBinaryReadIdRef.current = null;
      }
      // 标记上传失败
      setUploadTasks(prev =>
        prev.map(t => t.requestId === rid ? { ...t, status: "error" as const } : t)
      );
      pendingRef.current.delete(rid);
    } else if (msg.type === "write_resp") {
      pending.resolve(msg);
      // 如果是上传任务，标记完成
      setUploadTasks(prev =>
        prev.map(t => t.requestId === rid ? { ...t, status: "done" as const, received: t.total } : t)
      );
      pendingRef.current.delete(rid);
    } else {
      pending.resolve(msg);
      pendingRef.current.delete(rid);
    }
  }, [cleanup]);

  const handleBinaryFrame = useCallback((data: ArrayBuffer) => {
    const state = binaryReadRef.current;
    if (!state) return;

    state.chunks.push(data);
    state.received += data.byteLength;

    if (state.received >= state.expectedSize) {
      const pending = pendingRef.current.get(state.requestId);
      if (pending) {
        pending.resolve({ chunks: state.chunks });
        pendingRef.current.delete(state.requestId);
      }
      binaryReadRef.current = null;
    }
  }, []);

  // ── 连接 ────────────────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    cleanup();
    setErrorMessage("");
    setUploadTasks([]);
    setStatus("creating");

    try {
      // 1. 创建文件 API 会话
      const { session_id } = await createFileSession(optionsRef.current.serverUuid);
      sessionIdRef.current = session_id;

      // 2. WebSocket
      setStatus("waiting");
      const wsUrl = buildFileWebSocketURL(session_id);
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: "ping" }));
          }
        }, 30_000);
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          handleBinaryFrame(event.data);
          return;
        }
        try {
          const msg = JSON.parse(event.data) as FileAPIDownMessage;
          handleJsonFrame(msg);
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = () => {
        setStatus("error");
        setErrorMessage("WebSocket connection error");
        optionsRef.current.onError?.("WebSocket connection error");
      };

      ws.onclose = (event) => {
        if (wsRef.current === ws) {
          const reason = event.reason || `Connection closed (code: ${event.code})`;
          setStatus("closed");
          optionsRef.current.onClosed?.(reason);
        }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setStatus("error");
      setErrorMessage(message);
      optionsRef.current.onError?.(message);
    }
  }, [cleanup, handleJsonFrame, handleBinaryFrame]);

  // ── 文件操作 ────────────────────────────────────────────────────────────────

  const readdir = useCallback(async (path: string): Promise<FileEntry[]> => {
    const res = await sendRequest<{ entries: Record<string, unknown>[] }>("readdir", { path });
    return (res.entries || []).map((raw): FileEntry => ({
      name: (raw.name as string) ?? "",
      type: (raw.type as FileEntry["type"]) ?? (raw.is_dir ? "dir" : "file"),
      size: (raw.size as number) ?? 0,
      permissions: (raw.permissions as string) ?? "",
      owner: (raw.owner as string) ?? "",
      group: (raw.group as string) ?? "",
      mtime: (raw.mtime as number) ?? 0,
      link_target: raw.link_target as string | undefined,
    }));
  }, [sendRequest]);

  const stat = useCallback(async (path: string): Promise<FileEntry> => {
    const res = await sendRequest<{ entry: FileEntry }>("stat", { path });
    return res.entry;
  }, [sendRequest]);

  const read = useCallback(async (path: string, encoding = "utf-8") => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    const requestId = crypto.randomUUID();
    // 必须在发送前设置，确保 read_resp 到达时能通过回退逻辑找到此请求
    pendingBinaryReadIdRef.current = requestId;
    return new Promise<{ path: string; content: string }>((resolve, reject) => {
      pendingRef.current.set(requestId, {
        resolve: (res: unknown) => {
          const result = res as { chunks?: ArrayBuffer[]; path?: string };
          const chunks: ArrayBuffer[] = result.chunks ?? [];
          if (chunks.length === 0) {
            resolve({ path, content: "" });
            return;
          }
          const totalSize = chunks.reduce((sum, c) => sum + c.byteLength, 0);
          const buffer = new Uint8Array(totalSize);
          let offset = 0;
          for (const chunk of chunks) {
            buffer.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }
          try {
            const decoder = new TextDecoder(encoding, { fatal: false });
            resolve({ path, content: decoder.decode(buffer) });
          } catch {
            reject(new Error(`无法使用编码 ${encoding} 解码文件`));
          }
        },
        reject,
      });
      ws.send(JSON.stringify({ action: "read", request_id: requestId, path, encoding }));
    });
  }, []);

  const readBlob = useCallback(async (path: string): Promise<Blob> => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    const requestId = crypto.randomUUID();
    // 保存 requestId 以便在 read_resp 不含 request_id 时回退匹配
    pendingBinaryReadIdRef.current = requestId;
    return new Promise<Blob>((resolve, reject) => {
      pendingRef.current.set(requestId, {
        resolve: (res: unknown) => {
          const result = res as { chunks?: ArrayBuffer[]; content?: string };
          if (Array.isArray(result.chunks)) {
            resolve(new Blob(result.chunks));
          } else if (typeof result.content === "string") {
            // 兜底：若服务端以 base64 字符串返回
            try {
              const binary = atob(result.content);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              resolve(new Blob([bytes]));
            } catch {
              resolve(new Blob([result.content]));
            }
          } else {
            reject(new Error("Unexpected read response format"));
          }
        },
        reject,
      });
      ws.send(JSON.stringify({ action: "read", request_id: requestId, path }));
    });
  }, []);

  const write = useCallback(async (path: string, content: string, encoding = "utf-8") => {
    const res = await sendRequest<{ path: string; size: number }>("write", { path, content, encoding });
    return res;
  }, [sendRequest]);

  const upload = useCallback(async (dirPath: string, file: File) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const requestId = crypto.randomUUID();
    const filePath = dirPath.endsWith("/") ? `${dirPath}${file.name}` : `${dirPath}/${file.name}`;

    // 添加上传任务
    setUploadTasks(prev => [...prev, {
      requestId,
      fileName: file.name,
      total: file.size,
      received: 0,
      status: "uploading",
    }]);

    // 发送 write 指令（通知 Agent 准备接收文件写入）
    ws.send(JSON.stringify({
      action: "write",
      request_id: requestId,
      path: filePath,
    }));

    // 完成 Promise
    const done = new Promise<void>((resolve, reject) => {
      pendingRef.current.set(requestId, { resolve, reject });
    });

    // 分块发送 binary
    let offset = 0;
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await chunk.arrayBuffer();
      ws.send(buffer);
      offset += buffer.byteLength;
    }

    return done;
  }, []);

  const remove = useCallback(async (path: string) => {
    await sendRequest("remove", { path });
  }, [sendRequest]);

  const rename = useCallback(async (oldPath: string, newPath: string) => {
    await sendRequest("rename", { old: oldPath, new: newPath });
  }, [sendRequest]);

  const mkdir = useCallback(async (path: string) => {
    await sendRequest("mkdir", { path });
  }, [sendRequest]);

  const rmdir = useCallback(async (path: string) => {
    await sendRequest("rmdir", { path });
  }, [sendRequest]);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus("closed");
  }, [cleanup]);

  const clearUploadTask = useCallback((requestId: string) => {
    setUploadTasks(prev => prev.filter(t => t.requestId !== requestId));
  }, []);

  // 组件卸载时清理
  useEffect(() => cleanup, [cleanup]);

  return {
    status,
    errorMessage,
    uploadTasks,
    connect,
    disconnect,
    readdir,
    stat,
    read,
    readBlob,
    write,
    upload,
    remove,
    rename,
    mkdir,
    rmdir,
    clearUploadTask,
  };
}
