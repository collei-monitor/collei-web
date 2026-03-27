import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { KeyRound, Shield, ShieldCheck, ShieldOff, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1),
    password: z.string().min(6),
    confirm_password: z.string().min(1),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ["confirm_password"],
    message: "__mismatch__",
  });
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const totpSchema = z.object({
  totp_code: z.string().length(6).regex(/^\d+$/),
});
type TotpValues = z.infer<typeof totpSchema>;

// ── Change Password Card ─────────────────────────────────────────────────────

function ChangePasswordCard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", password: "", confirm_password: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setLoading(true);
    setServerError("");
    try {
      const { status } = await api.put("/auth/me", {
        current_password: values.current_password,
        password: values.password,
        username: user?.username,
      });
      if (status === 200) {
        form.reset();
        toast.success(t("users.changePassword.success"));
      } else if (status === 401) {
        setServerError(t("users.changePassword.errors.wrongCurrent"));
      } else {
        setServerError(t("users.changePassword.errors.failed"));
      }
    } catch {
      setServerError(t("users.changePassword.errors.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" />
          {t("users.changePassword.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {serverError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("users.changePassword.currentPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.changePassword.newPassword")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("users.changePassword.confirmPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.confirm_password?.message ===
                    "__mismatch__"
                      ? t("users.changePassword.errors.mismatch")
                      : form.formState.errors.confirm_password?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Enable 2FA Dialog ─────────────────────────────────────────────────────────

function EnableTwoFactorDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  const totpForm = useForm<TotpValues>({
    resolver: zodResolver(totpSchema),
    defaultValues: { totp_code: "" },
  });

  // 当 dialog 打开时拉取配置
  useEffect(() => {
    if (!open) return;
    // reset state
    setStep("setup");
    setSecret("");
    setOtpauthUrl("");
    setSetupError("");
    totpForm.reset();
    // fetch
    setSetupLoading(true);
    api
      .post("/auth/2fa/setup")
      .then(({ status, data }) => {
        if (status === 200) {
          setSecret(data.secret);
          setOtpauthUrl(data.otpauth_url);
        } else {
          setSetupError(t("users.setup.errors.setupFailed"));
        }
      })
      .catch(() => setSetupError(t("users.setup.errors.networkError")))
      .finally(() => setSetupLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onVerify(values: TotpValues) {
    setSetupLoading(true);
    setSetupError("");
    try {
      const { status } = await api.post("/auth/2fa/verify", {
        totp_code: values.totp_code,
      });
      if (status === 200) {
        onOpenChange(false);
        onSuccess();
      } else if (status === 401) {
        setSetupError(t("users.setup.errors.verifyFailed"));
        totpForm.reset();
      } else {
        setSetupError(t("users.setup.errors.verifyFailed"));
      }
    } catch {
      setSetupError(t("users.setup.errors.networkError"));
    } finally {
      setSetupLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("users.setup.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === "setup"
              ? t("users.setup.step1Desc")
              : t("users.setup.step2Desc")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === "setup" && (
          <div className="space-y-4">
            {setupError && (
              <Alert variant="destructive">
                <AlertDescription>{setupError}</AlertDescription>
              </Alert>
            )}
            {setupLoading ? (
              <div className="flex justify-center py-4 text-sm text-muted-foreground">
                {t("users.setup.loading")}
              </div>
            ) : otpauthUrl ? (
              <>
                <div className="flex justify-center">
                  <div className="rounded-lg border bg-white p-3">
                    <QRCodeSVG value={otpauthUrl} size={160} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("users.setup.secret")}
                  </p>
                  <code className="block w-full rounded border bg-muted px-3 py-2 text-xs font-mono break-all select-all">
                    {secret}
                  </code>
                </div>
              </>
            ) : null}
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            {setupError && (
              <Alert variant="destructive">
                <AlertDescription>{setupError}</AlertDescription>
              </Alert>
            )}
            <Form {...totpForm}>
              <form
                id="totp-verify-form"
                onSubmit={totpForm.handleSubmit(onVerify)}
              >
                <FormField
                  control={totpForm.control}
                  name="totp_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("users.setup.totpCode")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000000"
                          maxLength={6}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          className="text-center tracking-[0.4em] text-lg font-mono"
                          disabled={setupLoading}
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={setupLoading}>
            {step === "verify" ? (
              <span
                onClick={(e) => {
                  e.preventDefault();
                  setStep("setup");
                  setSetupError("");
                  totpForm.reset();
                }}
              >
                {t("users.setup.back")}
              </span>
            ) : (
              t("common.cancel")
            )}
          </AlertDialogCancel>
          {step === "setup" ? (
            <AlertDialogAction
              disabled={setupLoading || !otpauthUrl}
              onClick={(e) => {
                e.preventDefault();
                setStep("verify");
                setSetupError("");
              }}
            >
              {t("users.setup.nextStep")}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              disabled={setupLoading}
              onClick={(e) => {
                e.preventDefault();
                totpForm.handleSubmit(onVerify)();
              }}
            >
              {setupLoading
                ? t("users.setup.verifying")
                : t("users.setup.confirmEnable")}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Disable 2FA Dialog ────────────────────────────────────────────────────────

function DisableTwoFactorDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDisable() {
    setLoading(true);
    setError("");
    try {
      const { status } = await api.delete("/auth/2fa");
      if (status === 200) {
        onOpenChange(false);
        onSuccess();
      } else {
        setError(t("users.disable.errors.failed"));
      }
    } catch {
      setError(t("users.disable.errors.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-destructive" />
            {t("users.disable.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("users.disable.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              handleDisable();
            }}
          >
            {loading
              ? t("users.disable.disabling")
              : t("users.disable.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── UsersPage ─────────────────────────────────────────────────────────────────

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
