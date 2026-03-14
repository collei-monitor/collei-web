import { useTranslation } from "react-i18next";
import { NavLink, useMatch, useLocation } from "react-router";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar-context";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bell,
  Users,
  Settings,
  Activity,
  Layers,
  ChevronRight,
  Server,
  Network,
} from "lucide-react";

interface NavSubItem {
  title: string;
  url: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  end: boolean;
  children?: NavSubItem[];
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

function SidebarNavItem({ item }: { item: NavItem }) {
  const match = useMatch({ path: item.url, end: item.end });
  const location = useLocation();
  const { state, isMobile } = useSidebar();

  if (item.children && item.children.length > 0) {
    const isAnyChildActive = item.children.some((child) =>
      location.pathname.startsWith(child.url),
    );

    // Desktop collapsed: hover popup submenu
    if (state === "collapsed" && !isMobile) {
      return (
        <SidebarMenuItem>
          <HoverCard openDelay={80} closeDelay={100}>
            <HoverCardTrigger asChild>
              <SidebarMenuButton isActive={isAnyChildActive} className="h-9">
                <item.icon className="h-6 w-6" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </HoverCardTrigger>
            <HoverCardContent
              side="right"
              align="start"
              sideOffset={8}
              className="w-auto min-w-40 p-1"
            >
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {item.title}
              </div>
              {item.children.map((child) => {
                const childMatch = location.pathname.startsWith(child.url);
                return (
                  <NavLink
                    key={child.url}
                    to={child.url}
                    className={cn(
                      "flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      childMatch &&
                        "bg-accent text-accent-foreground font-medium",
                    )}
                  >
                    {child.title}
                  </NavLink>
                );
              })}
            </HoverCardContent>
          </HoverCard>
        </SidebarMenuItem>
      );
    }

    // Expanded or mobile: collapsible submenu
    return (
      <SidebarMenuItem>
        <Collapsible
          defaultOpen={isAnyChildActive}
          className="group/collapsible"
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="h-9">
              <item.icon className="h-6 w-6" />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => {
                const childMatch = location.pathname.startsWith(child.url);
                return (
                  <SidebarMenuSubItem key={child.url}>
                    <SidebarMenuSubButton asChild isActive={childMatch}>
                      <NavLink to={child.url}>{child.title}</NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  // No children: direct link with tooltip when collapsed
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={!!match}
        className="h-9"
        tooltip={item.title}
      >
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
          children: [
            {
              title: t("admin.sidebar.alertRules"),
              url: "/admin/alerts/rules",
            },
            {
              title: t("admin.sidebar.notificationChannels"),
              url: "/admin/alerts/channels",
            },
            {
              title: t("admin.sidebar.eventCenter"),
              url: "/admin/alerts/events",
            },
            {
              title: t("admin.sidebar.alertEngine"),
              url: "/admin/alerts/engine",
            },
          ],
        },
        {
          title: t("admin.sidebar.servicesGroup"),
          url: "/admin/services",
          icon: Network,
          end: false,
          children: [
            {
              title: t("admin.sidebar.networkMonitor"),
              url: "/admin/services/network",
            },
            {
              title: t("admin.sidebar.remoteExec"),
              url: "/admin/services/remote",
            },
          ],
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
    // {
    //   labelKey: "admin.sidebar.services",
    //   items: [],
    // },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* Mobile-only: close button header */}
      <SidebarHeader className="md:hidden h-14 px-3 py-0 border-b flex-row items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <span className="text-sm font-semibold">{t("common.appTitle")}</span>
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
