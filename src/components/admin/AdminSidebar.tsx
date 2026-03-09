import { useTranslation } from "react-i18next";
import { NavLink, useMatch } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Server, LayoutDashboard, Bell, Users, Settings, Activity, Layers } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  end: boolean;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

function SidebarNavItem({ item }: { item: NavItem }) {
  const match = useMatch({ path: item.url, end: item.end });
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match} className="h-9">
        <NavLink to={item.url} end={item.end}>
          <item.icon className="h-6 w-6" />
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AdminSidebar() {
  const { t } = useTranslation();

  const navGroups: NavGroup[] = [
    {
      labelKey: "admin.sidebar.overview",
      items: [
        {
          title: t("admin.sidebar.dashboard"),
          url: "/admin",
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
    {
      labelKey: "admin.sidebar.monitoring",
      items: [
        {
          title: t("admin.sidebar.nodes"),
          url: "/admin/nodes",
          icon: Server,
          end: false,
        },
        {
          title: t("admin.sidebar.groups"),
          url: "/admin/groups",
          icon: Layers,
          end: false,
        },
        {
          title: t("admin.sidebar.metrics"),
          url: "/admin/metrics",
          icon: Activity,
          end: false,
        },
        {
          title: t("admin.sidebar.alerts"),
          url: "/admin/alerts",
          icon: Bell,
          end: false,
        },
      ],
    },
    {
      labelKey: "admin.sidebar.system",
      items: [
        {
          title: t("admin.sidebar.users"),
          url: "/admin/users",
          icon: Users,
          end: false,
        },
        {
          title: t("admin.sidebar.settings"),
          url: "/admin/settings",
          icon: Settings,
          end: false,
        },
      ],
    },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Server className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-sm">{t("common.appTitle")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.labelKey}>
            <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarNavItem key={item.url} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
