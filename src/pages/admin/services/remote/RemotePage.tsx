import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { Terminal } from "lucide-react";

export default function RemotePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.services.remote.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.services.remote.subtitle")}
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <Terminal className="h-12 w-12 opacity-30" />
        <p className="text-sm">{t("admin.services.remote.comingSoon")}</p>
      </div>
    </div>
  );
}
