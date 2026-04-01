import { useTranslation } from "react-i18next";
import { Palette } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeManageSection } from "./components/ThemeManageSection";

export default function ThemeSettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.themes.pageTitle")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("settings.themes.pageSubtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            {t("settings.themes.title")}
          </CardTitle>
          <CardDescription>{t("settings.themes.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeManageSection />
        </CardContent>
      </Card>
    </div>
  );
}
