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

interface PendingRequest<T = any> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
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
  }, []);

  // ── 请求发送辅助 ────────────────────────────────────────────────────────────

  const sendRequest = useCallback(<T = any>(action: string, params: Record<string, any> = {}): Promise<T> => {
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
      // 标记上传失败
      setUploadTasks(prev =>
        prev.map(t => t.requestId === rid ? { ...t, status: "error" as const } : t)
      );
    } else if (msg.type === "write_resp") {
      pending.resolve(msg);
      // 如果是上传任务，标记完成
      setUploadTasks(prev =>
        prev.map(t => t.requestId === rid ? { ...t, status: "done" as const, received: t.total } : t)
      );
    } else {
      pending.resolve(msg);
    }
    pendingRef.current.delete(rid);
  }, [cleanup]);

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
          // Binary 帧 — read_resp 的文件内容数据（当前忽略，read 使用 JSON content）
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
  }, [cleanup, handleJsonFrame]);

  // ── 文件操作 ────────────────────────────────────────────────────────────────

  const readdir = useCallback(async (path: string): Promise<FileEntry[]> => {
    const res = await sendRequest<{ entries: FileEntry[] }>("readdir", { path });
    return res.entries;
  }, [sendRequest]);

  const stat = useCallback(async (path: string): Promise<FileEntry> => {
    const res = await sendRequest<{ entry: FileEntry }>("stat", { path });
    return res.entry;
  }, [sendRequest]);

  const read = useCallback(async (path: string) => {
    const res = await sendRequest<{ path: string; content: string }>("read", { path });
    return res;
  }, [sendRequest]);

  const write = useCallback(async (path: string, content: string) => {
    const res = await sendRequest<{ path: string; size: number }>("write", { path, content });
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
    write,
    upload,
    remove,
    rename,
    mkdir,
    rmdir,
    clearUploadTask,
  };
}
