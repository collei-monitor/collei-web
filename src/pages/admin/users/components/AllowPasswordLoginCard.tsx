import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export function AllowPasswordLoginCard() {
  const { t } = useTranslation();
  const { allowPasswordLogin, ssoProviders } = useAuthStore();
  const [loading, setLoading] = useState(false);

  async function handleToggle(checked: boolean) {
    if (!checked && ssoProviders.length === 0) {
      toast.error(t("users.passwordLogin.noProviders"));
      return;
    }

    setLoading(true);
    try {
      const { status, data } = await api.put(
        "/config/allow_password_login",
        { value: checked ? "true" : "false" },
      );
      if (status === 422) {
        toast.error(data?.detail || t("users.passwordLogin.errors.validation"));
        return;
      }
      if (status !== 200) {
        toast.error(t("users.passwordLogin.errors.failed"));
        return;
      }
      useAuthStore.setState({ allowPasswordLogin: checked });
      toast.success(t("users.passwordLogin.success"));
    } catch {
      toast.error(t("users.passwordLogin.errors.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LogIn className="h-4 w-4" />
          {t("users.passwordLogin.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow-password-login">
              {t("users.passwordLogin.label")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("users.passwordLogin.description")}
            </p>
          </div>
          <Switch
            id="allow-password-login"
            checked={allowPasswordLogin}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
        {!allowPasswordLogin && ssoProviders.length === 0 && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>
              {t("users.passwordLogin.noProviders")}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
