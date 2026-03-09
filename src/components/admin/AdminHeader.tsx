import { useTranslation } from "react-i18next";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { House, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitch } from "@/components/language-switch";
import { useAuthStore } from "@/store/auth";

export function AdminHeader() {
  const { t } = useTranslation();

  function handleLogout() {
    useAuthStore.getState().logout();
  }

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b bg-background px-4 gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm ml-2.5">
            {t("common.appTitle")}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => (window.location.href = "/")}
              >
                <House />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.backHome")}</TooltipContent>
          </Tooltip>

          <ModeToggle />
          <LanguageSwitch />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="text-red-600 hover:text-red-700" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.logout")}</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
