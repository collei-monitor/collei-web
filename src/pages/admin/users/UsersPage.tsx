import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { ChangePasswordCard } from "./components/ChangePasswordCard";
import { AllowPasswordLoginCard } from "./components/AllowPasswordLoginCard";
import { EnableTwoFactorDialog } from "./components/EnableTwoFactorDialog";
import { DisableTwoFactorDialog } from "./components/DisableTwoFactorDialog";

export default function UsersPage() {
  const { t } = useTranslation();
  const { user, fetchMe } = useAuthStore();
  const isLocalUser = !user?.sso_type;
  const [enableOpen, setEnableOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);

  async function handleSuccess() {
    await fetchMe();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("users.title")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {t("users.account")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("common.username")}
            </span>
            <span className="text-sm font-medium">{user?.username ?? "—"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user?.two_factor_enabled ? (
                <ShieldCheck className="h-4 w-4 text-green-500" />
              ) : (
                <Shield className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{t("users.twoFactor")}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.two_factor_enabled
                    ? t("users.twoFactorEnabled")
                    : t("users.twoFactorDisabled")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={user?.two_factor_enabled ? "default" : "secondary"}
              >
                {user?.two_factor_enabled
                  ? t("users.twoFactorEnabled")
                  : t("users.twoFactorDisabled")}
              </Badge>
              {user?.two_factor_enabled ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDisableOpen(true)}
                >
                  {t("users.disableTwoFactor")}
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setEnableOpen(true)}
                >
                  {t("users.enableTwoFactor")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLocalUser && <ChangePasswordCard />}

      <AllowPasswordLoginCard />

      <EnableTwoFactorDialog
        open={enableOpen}
        onOpenChange={setEnableOpen}
        onSuccess={handleSuccess}
      />
      <DisableTwoFactorDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
