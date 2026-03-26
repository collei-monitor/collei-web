import { createBrowserRouter, Outlet } from "react-router";
import DisplayPage from "@/pages/display/DisplayPage";
import ServerDetailPage from "@/pages/display/ServerDetailPage";
import LoginPage from "@/pages/LoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import NodesPage from "@/pages/admin/nodes/NodesPage";
import GroupsPage from "@/pages/admin/groups/GroupsPage";
import AlertRulesPage from "@/pages/admin/alerts/AlertRulesPage";
import NotificationChannelsPage from "@/pages/admin/alerts/NotificationChannelsPage";
import EventCenterPage from "@/pages/admin/alerts/EventCenterPage";
import AlertEnginePage from "@/pages/admin/alerts/AlertEnginePage";
import UsersPage from "@/pages/admin/UsersPage";
import SettingsPage from "@/pages/admin/settings/SettingsPage";
import OIDCProvidersPage from "@/pages/admin/settings/OIDCProvidersPage";
import LogsPage from "@/pages/admin/LogsPage";
import NetworkPage from "@/pages/admin/services/network/NetworkPage";
import RemotePage from "@/pages/admin/services/remote/RemotePage";
import DomainsPage from "@/pages/admin/dns/DomainsPage";
import DomainDetailPage from "@/pages/admin/dns/DomainDetailPage";
import CredentialsPage from "@/pages/admin/dns/CredentialsPage";
import DdnsTasksPage from "@/pages/admin/dns/DdnsTasksPage";
import SSHTerminalPage from "@/pages/admin/nodes/SSHTerminalPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { RequireAuth, RequireGuest } from "./guards";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { CustomCodeInjector } from "@/components/CustomCodeInjector";

const router = createBrowserRouter([
  {
    // 公开展示路由共享同一个 WebSocket 连接，页面切换时不重连
    element: <WebSocketProvider><CustomCodeInjector /><Outlet /></WebSocketProvider>,
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
          { index: true, element: <NodesPage /> },
          { path: "nodes", element: <NodesPage /> },
          { path: "groups", element: <GroupsPage /> },
          { path: "alerts/rules", element: <AlertRulesPage /> },
          { path: "alerts/channels", element: <NotificationChannelsPage /> },
          { path: "alerts/events", element: <EventCenterPage /> },
          { path: "alerts/engine", element: <AlertEnginePage /> },
          { path: "users", element: <UsersPage /> },
          { path: "logs", element: <LogsPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "settings/oidc", element: <OIDCProvidersPage /> },
          { path: "services/network", element: <NetworkPage /> },
          { path: "services/remote", element: <RemotePage /> },
          { path: "dns/domains", element: <DomainsPage /> },
          { path: "dns/domains/:id", element: <DomainDetailPage /> },
          { path: "dns/credentials", element: <CredentialsPage /> },
          { path: "dns/ddns", element: <DdnsTasksPage /> },
        ],
      },
      // 独立全屏页面（不套 AdminLayout）
      { path: "terminal", element: <SSHTerminalPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
