import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

/**
 * 应用根级认证初始化器。
 * - 挂载时执行 GET /me，将 auth 状态置为 authenticated / unauthenticated
 * - 监听 api.ts 广播的 "auth:unauthorized" 事件，处理会话中途过期
 * - 不阻塞渲染：公开展示页无需等待认证完成即可直接显示
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

  // 初始化：拉取当前用户信息
  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  // 监听 api.ts 在收到 401 时派发的自定义事件，仅在已认证状态下触发登出（mid-session 过期）
  useEffect(() => {
    const handler = () => {
      if (useAuthStore.getState().status === "authenticated") {
        logout();
      }
    };
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [logout]);

  return <>{children}</>;
}
