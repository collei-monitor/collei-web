import { createBrowserRouter, Outlet } from "react-router";
import DisplayPage from "@/pages/DisplayPage";
import ServerDetailPage from "@/pages/ServerDetailPage";
import LoginPage from "@/pages/LoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import DashboardPage from "@/pages/admin/DashboardPage";
import NodesPage from "@/pages/admin/nodes/NodesPage";
import GroupsPage from "@/pages/admin/groups/GroupsPage";
import MetricsPage from "@/pages/admin/MetricsPage";
import AlertRulesPage from "@/pages/admin/alerts/AlertRulesPage";
import NotificationChannelsPage from "@/pages/admin/alerts/NotificationChannelsPage";
import EventCenterPage from "@/pages/admin/alerts/EventCenterPage";
import AlertEnginePage from "@/pages/admin/alerts/AlertEnginePage";
import UsersPage from "@/pages/admin/UsersPage";
import SettingsPage from "@/pages/admin/settings/SettingsPage";
import NetworkPage from "@/pages/admin/services/network/NetworkPage";
import RemotePage from "@/pages/admin/services/remote/RemotePage";
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
          { path: "groups", element: <GroupsPage /> },
          { path: "metrics", element: <MetricsPage /> },
          { path: "alerts/rules", element: <AlertRulesPage /> },
          { path: "alerts/channels", element: <NotificationChannelsPage /> },
          { path: "alerts/events", element: <EventCenterPage /> },
          { path: "alerts/engine", element: <AlertEnginePage /> },
          { path: "users", element: <UsersPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "services/network", element: <NetworkPage /> },
          { path: "services/remote", element: <RemotePage /> },
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
