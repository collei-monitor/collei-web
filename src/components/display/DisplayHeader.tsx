import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Server, Settings } from "lucide-react";
import { LanguageSwitch } from "@/components/language-switch";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuthStore } from "@/store/auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DisplayHeader() {
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">
              {t("common.appTitle")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <LanguageSwitch />
            {status === "authenticated" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" variant="outline">
                      <Link to="/admin" target="_blank" rel="noopener noreferrer">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("admin.header.admin")}</TooltipContent>
              </Tooltip>
            ) : (
              <Button asChild variant="outline">
                <Link to="/login">{t("common.loginAdmin")}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
