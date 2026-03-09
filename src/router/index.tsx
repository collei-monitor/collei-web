import { createBrowserRouter, Outlet } from "react-router";
import DisplayPage from "@/pages/DisplayPage";
import ServerDetailPage from "@/pages/ServerDetailPage";
import LoginPage from "@/pages/LoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import DashboardPage from "@/pages/admin/DashboardPage";
import NodesPage from "@/pages/admin/nodes/NodesPage";
import MetricsPage from "@/pages/admin/MetricsPage";
import AlertsPage from "@/pages/admin/AlertsPage";
import UsersPage from "@/pages/admin/UsersPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { RequireAuth, RequireGuest } from "./guards";
import { WebSocketProvider } from "@/components/WebSocketProvider";

const router = createBrowserRouter([
  {
    // 公开展示路由共享同一个 WebSocket 连接，页面切换时不重连
    element: <WebSocketProvider><Outlet /></WebSocketProvider>,
    children: [
      {
        path: "/",
        element: <DisplayPage />,
      },
      {
        path: "/server/:uuid",
        element: <ServerDetailPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <RequireGuest />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: "/admin",
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "nodes", element: <NodesPage /> },
          { path: "metrics", element: <MetricsPage /> },
          { path: "alerts", element: <AlertsPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
