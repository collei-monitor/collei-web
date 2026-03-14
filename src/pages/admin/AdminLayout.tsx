import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout() {
  return (
    <SidebarProvider
      className="flex-col min-h-0 h-svh"
      style={{ "--header-height": "3.5rem" } as React.CSSProperties}
    >
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <SidebarInset className="min-w-0 overflow-x-hidden">
          <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
