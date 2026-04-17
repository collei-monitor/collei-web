import { useTranslation } from "react-i18next";
import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  const navigate = useNavigate();

  let status = 500;
  let message = "";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    message = error.statusText || error.data?.message || "";
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-6 p-8 text-center max-w-lg">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">{status}</h1>
          <p className="text-2xl font-semibold text-foreground">
            {t("errorPage.title")}
          </p>
          <p className="text-muted-foreground">
            {t("errorPage.description")}
          </p>
          {message && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                {t("errorPage.details")}
              </summary>
              <pre className="mt-2 rounded-md bg-muted p-3 text-xs overflow-auto max-h-40 whitespace-pre-wrap break-all">
                {message}
              </pre>
            </details>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            {t("errorPage.goBack")}
          </Button>
          <Button onClick={() => navigate("/")}>
            {t("common.backHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
