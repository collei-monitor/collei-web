import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth";

/**
 * 后台路由守卫：未登录时重定向到 /login，并记录来源路径。
 *
 * 用法：将此组件作为需要登录才能访问的路由的 element，子路由通过 children 配置。
 */
export function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (status === "logout") {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // authenticated（idle/loading 由 AuthInitializer 拦截，此处不会出现）
  return <Outlet />;
}

/**
 * 访客路由守卫：已登录时重定向到 /admin。
 *
 * 用法：将此组件作为登录页等仅限未登录用户访问的路由的 element。
 */
export function RequireGuest() {
  const status = useAuthStore((s) => s.status);

  if (status === "authenticated") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
