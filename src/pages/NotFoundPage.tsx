import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">404</h1>
          <p className="text-2xl font-semibold text-foreground">
            {t("notFound.title")}
          </p>
          <p className="text-muted-foreground max-w-md">
            {t("notFound.description")}
          </p>
        </div>
        <Link to="/">
          <Button>{t("common.backHome")}</Button>
        </Link>
      </div>
    </div>
  );
}
