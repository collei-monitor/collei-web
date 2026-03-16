/**
 * SFTP WebSocket 连接管理 hook
 * 处理会话创建、WS 连接、request_id 匹配、文件操作和生命周期
 */

import { useRef, useCallback, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { createSFTPSession, buildSFTPWebSocketURL } from "@/services/sftp";
import type {
  SFTPConnectionStatus,
  SFTPDownMessage,
  SFTPFileEntry,
  CreateSFTPSessionPayload,
  UploadTask,
} from "@/types/sftp";

// ── 内部类型 ──────────────────────────────────────────────────────────────────

interface PendingRequest<T = any> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

interface DownloadState {
  requestId: string;
  name: string;
  size: number;
  chunks: ArrayBuffer[];
}

// ── Hook 接口 ─────────────────────────────────────────────────────────────────

export interface UseSFTPConnectionOptions {
  serverUuid: string;
  onReady?: (homeDir: string) => void;
  onAuthRequired?: (methods: string[]) => void;
  onError?: (message: string) => void;
  onClosed?: (reason: string) => void;
}

const CHUNK_SIZE = 65536; // 64 KB

export function useSFTPConnection(options: UseSFTPConnectionOptions) {
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; });

  const [status, setStatus] = useState<SFTPConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef("");
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const downloadRef = useRef<DownloadState | null>(null);

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
    downloadRef.current = null;
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

  const handleJsonFrame = useCallback((msg: SFTPDownMessage) => {
    if (msg.type === "ready") {
      setStatus("connected");
      optionsRef.current.onReady?.(msg.home_dir);
      return;
    }
    if (msg.type === "auth_required") {
      setStatus("auth_required");
      optionsRef.current.onAuthRequired?.(msg.methods);
      return;
    }
    if (msg.type === "closed") {
      setStatus("closed");
      optionsRef.current.onClosed?.(msg.reason);
      cleanup();
      return;
    }
    if (msg.type === "pong") return;

    // upload_progress — 更新上传进度
    if (msg.type === "upload_progress") {
      setUploadTasks(prev =>
        prev.map(t => t.requestId === msg.request_id
          ? { ...t, received: msg.received }
          : t
        )
      );
      return;
    }

    // download_start — 开始收集 binary 块
    if (msg.type === "download_start") {
      downloadRef.current = {
        requestId: msg.request_id,
        name: msg.name,
        size: msg.size,
        chunks: [],
      };
      return;
    }

    // download_end — 组装 blob 并 resolve
    if (msg.type === "download_end") {
      const dl = downloadRef.current;
      if (dl) {
        const pending = pendingRef.current.get(dl.requestId);
        if (pending) {
          pending.resolve({
            name: dl.name,
            size: dl.size,
            chunks: dl.chunks,
          });
          pendingRef.current.delete(dl.requestId);
        }
      }
      downloadRef.current = null;
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
      // 标记上传失败
      setUploadTasks(prev =>
        prev.map(t => t.requestId === rid ? { ...t, status: "error" as const } : t)
      );
    } else if (msg.type === "ok") {
      pending.resolve(msg);
      // 标记上传完成
      setUploadTasks(prev =>
        prev.map(t => t.requestId === rid ? { ...t, status: "done" as const, received: t.total } : t)
      );
    } else {
      pending.resolve(msg);
    }
    pendingRef.current.delete(rid);
  }, [cleanup]);

  const handleBinaryFrame = useCallback((data: ArrayBuffer) => {
    if (downloadRef.current) {
      downloadRef.current.chunks.push(data);
    }
  }, []);

  // ── 连接 ────────────────────────────────────────────────────────────────────

  const connect = useCallback(async (payload: CreateSFTPSessionPayload = {}) => {
    cleanup();
    setErrorMessage("");
    setUploadTasks([]);
    setStatus("creating");

    try {
      // 1. 获取 ws_token
      const { status: meStatus, data: meData } = await api.get("/auth/me");
      const wsToken = meStatus === 200 ? (meData as { ws_token?: string }).ws_token : undefined;
      if (!wsToken) throw new Error("Failed to get WebSocket token");

      // 2. 创建 SFTP 会话
      const { session_id } = await createSFTPSession(optionsRef.current.serverUuid, payload);
      sessionIdRef.current = session_id;

      // 3. WebSocket
      setStatus("waiting");
      const wsUrl = buildSFTPWebSocketURL(session_id, wsToken);
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
          const msg = JSON.parse(event.data) as SFTPDownMessage;
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

  const ls = useCallback(async (path: string): Promise<SFTPFileEntry[]> => {
    const res = await sendRequest<{ entries: SFTPFileEntry[] }>("ls", { path });
    return res.entries;
  }, [sendRequest]);

  const stat = useCallback(async (path: string): Promise<SFTPFileEntry> => {
    const res = await sendRequest<{ entry: SFTPFileEntry }>("stat", { path });
    return res.entry;
  }, [sendRequest]);

  const download = useCallback(async (path: string) => {
    const result = await sendRequest<{ name: string; size: number; chunks: ArrayBuffer[] }>("download", { path });
    const blob = new Blob(result.chunks);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.name;
    a.click();
    URL.revokeObjectURL(url);
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

    // 发送 upload 指令
    ws.send(JSON.stringify({
      action: "upload",
      request_id: requestId,
      path: filePath,
      size: file.size,
    }));

    // 完成 Promise
    const done = new Promise<void>((resolve, reject) => {
      pendingRef.current.set(requestId, { resolve, reject });
    });

    // 分块发送
    let offset = 0;
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await chunk.arrayBuffer();
      ws.send(buffer);
      offset += buffer.byteLength;
    }

    return done;
  }, []);

  const mkdir = useCallback(async (path: string) => {
    await sendRequest("mkdir", { path });
  }, [sendRequest]);

  const rm = useCallback(async (path: string, recursive = false) => {
    await sendRequest("rm", { path, recursive });
  }, [sendRequest]);

  const rename = useCallback(async (oldPath: string, newPath: string) => {
    await sendRequest("rename", { old_path: oldPath, new_path: newPath });
  }, [sendRequest]);

  const sendAuth = useCallback((username: string, password: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      setStatus("authenticating");
      ws.send(JSON.stringify({ action: "auth", username, password }));
    }
  }, []);

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
    sendAuth,
    ls,
    stat,
    download,
    upload,
    mkdir,
    rm,
    rename,
    clearUploadTask,
  };
}
