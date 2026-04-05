import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { House, LogOut, ArrowUpCircle, ExternalLink } from "lucide-react";
import { ModeToggle } from "@/components/common/ModeToggle";
import { LanguageSwitch } from "@/components/common/LanguageSwitch";
import { useAuthStore } from "@/store/auth";
import { useIsMobile } from "@/hooks/use-mobile";

export function AdminHeader() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const user = useAuthStore((state) => state.user);
  const version = user?.version;
  const [changelogOpen, setChangelogOpen] = useState(false);

  async function handleLogout() {
    await useAuthStore.getState().logout();
  }

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b bg-background px-4 gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2 ml-2">
          <span className="font-semibold text-xl">{t("common.appTitle")}</span>
          {!isMobile && version?.current_version && (
            <span className="text-xs text-muted-foreground font-mono self-end">
              {t("common.version.badge", {
                version: version.current_version,
                commit: version.current_commit ?? "dev",
              })}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          {version?.has_update && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size={isMobile ? "icon" : "sm"}
                  className="text-amber-600 border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 gap-1.5"
                  onClick={() => setChangelogOpen(true)}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  {!isMobile && (
                    <span>{t("common.version.updateAvailable")}</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t("common.version.updateAvailable")}
              </TooltipContent>
            </Tooltip>
          )}

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
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="text-red-600 hover:text-red-700" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.logout")}</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <Dialog open={changelogOpen} onOpenChange={setChangelogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("common.version.updateDialogTitle", {
                version: version?.latest_version ?? "",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("common.version.updateDialogDesc", {
                current: version?.current_version
                  ? `v${version.current_version}`
                  : "—",
                latest: version?.latest_version
                  ? `v${version.latest_version}`
                  : "—",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm font-medium mb-2">
              {t("common.version.changelog")}
            </p>
            <div className="max-h-72 overflow-y-auto rounded-md bg-muted px-4 py-3 text-sm font-mono whitespace-pre-wrap text-muted-foreground">
              {version?.changelog ?? t("common.version.noChangelog")}
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button asChild variant="default" className="gap-1.5">
              <a
                href="https://github.com/collei-monitor/collei/releases"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                {t("common.version.viewReleases")}
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
