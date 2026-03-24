import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

/**
 * 应用根级认证初始化器。
 * - 挂载时执行 GET /me，将 auth 状态置为 authenticated / unauthenticated
 * - 监听 api.ts 广播的 "auth:unauthorized" 事件，处理会话中途过期
 * - 在 idle / loading 阶段展示全屏加载动画，避免路由守卫误判
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);
  const status = useAuthStore((s) => s.status);

  // 初始化：拉取当前用户信息
  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  // 监听 api.ts 在收到 401 时派发的自定义事件，mid-session 过期时登出
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [logout]);

  // 等待 fetchMe 完成，避免路由守卫在状态确定前就跳转
  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
