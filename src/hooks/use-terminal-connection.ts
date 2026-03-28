/**
 * Terminal (ConPTY) WebSocket 连接管理 hook
 * 处理会话创建、WS 连接、消息收发和生命周期
 * 与 SSH 不同：无密码认证流程，直连 Agent 本机终端
 */

import { useRef, useCallback, useState, useEffect } from "react";
import { createTerminalSession, buildTerminalWebSocketURL } from "@/services/terminal";
import type {
  TerminalConnectionStatus,
  TerminalDownMessage,
  CreateTerminalSessionPayload,
} from "@/types/terminal";

export interface UseTerminalConnectionOptions {
  serverUuid: string;
  /** xterm 写入入口 */
  onOutput?: (data: Uint8Array) => void;
  /** 连接成功 */
  onConnected?: (cols: number, rows: number) => void;
  /** 错误 */
  onError?: (message: string) => void;
  /** 连接关闭 */
  onClosed?: (reason: string, exitCode?: number) => void;
}

export function useTerminalConnection(options: UseTerminalConnectionOptions) {
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; });

  const [status, setStatus] = useState<TerminalConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }
    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
          ws.send(JSON.stringify({ action: "close" }));
        } catch {
          // ignore
        }
        ws.close();
      }
    }
  }, []);

  const connect = useCallback(async (payload: CreateTerminalSessionPayload = {}) => {
    cleanup();
    setErrorMessage("");
    setStatus("creating");

    try {
      // 1. 创建终端会话
      const { session_id } = await createTerminalSession(optionsRef.current.serverUuid, payload);
      setSessionId(session_id);

      // 2. 建立 WebSocket 连接
      setStatus("waiting");
      const wsUrl = buildTerminalWebSocketURL(session_id);
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        // 启动心跳
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: "ping" }));
          }
        }, 30_000);
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // Binary 帧 = 终端输出
          optionsRef.current.onOutput?.(new Uint8Array(event.data));
          return;
        }

        // Text 帧 = JSON 控制消息
        try {
          const msg = JSON.parse(event.data) as TerminalDownMessage;
          switch (msg.type) {
            case "connected":
              setStatus("connected");
              optionsRef.current.onConnected?.(msg.cols, msg.rows);
              break;
            case "error":
              setStatus("error");
              setErrorMessage(msg.message);
              optionsRef.current.onError?.(msg.message);
              break;
            case "closed":
              setStatus("closed");
              optionsRef.current.onClosed?.(msg.reason, msg.exit_code);
              cleanup();
              break;
            case "pong":
              break;
          }
        } catch {
          // ignore parse errors
        }
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
  }, [cleanup]);

  const sendInput = useCallback((data: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      // 终端输入作为 binary 帧发送
      const encoder = new TextEncoder();
      ws.send(encoder.encode(data));
    }
  }, []);

  const sendResize = useCallback((cols: number, rows: number) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "resize", cols, rows }));
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus("closed");
  }, [cleanup]);

  // 组件卸载时清理
  useEffect(() => cleanup, [cleanup]);

  return {
    status,
    errorMessage,
    sessionId,
    connect,
    sendInput,
    sendResize,
    disconnect,
  };
}
