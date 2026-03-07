import type { ReactNode } from "react";
import { WebSocketContext, useWebSocketState } from "@/services/display";

/**
 * 为公开展示页面提供持久的 WebSocket 连接上下文。
 * 包裹 DisplayPage 和 ServerDetailPage，使导航时 WS 不会重连。
 */
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const value = useWebSocketState();
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
