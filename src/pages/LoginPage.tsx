import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Server, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const totpSchema = z.object({
  totp_code: z
    .string()
    .length(6)
    .regex(/^\d+$/),
});

type LoginValues = z.infer<typeof loginSchema>;
type TotpValues = z.infer<typeof totpSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const [phase, setPhase] = useState<"login" | "2fa">("login");
  const [loginChallenge, setLoginChallenge] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const totpForm = useForm<TotpValues>({
    resolver: zodResolver(totpSchema),
    defaultValues: { totp_code: "" },
  });

  // ── Phase 1: username + password ───────────────────────────────────────────

  async function onLoginSubmit(values: LoginValues) {
    setError("");
    setIsLoading(true);
    try {
      const { status, data } = await api.post("/auth/login", values);

      if (status === 429) {
        setError(t("login.errors.tooManyAttempts"));
        return;
      }
      if (status === 401) {
        setError(t("login.errors.invalidCredentials"));
        return;
      }
      if (status !== 200) {
        setError(t("login.errors.generalError"));
        return;
      }

      if (data.requires_2fa) {
        setLoginChallenge(data.login_challenge);
        setPhase("2fa");
      } else {
        await setToken(data.access_token);
        navigate("/admin");
      }
    } catch {
      setError(t("login.errors.networkError"));
    } finally {
      setIsLoading(false);
    }
  }

  // ── Phase 2: TOTP ──────────────────────────────────────────────────────────

  async function onTotpSubmit(values: TotpValues) {
    setError("");
    setIsLoading(true);
    try {
      const { status, data } = await api.post("/auth/login/2fa", {
        login_challenge: loginChallenge,
        totp_code: values.totp_code,
      });

      if (status === 429) {
        setError(t("login.errors.tooManyTotpAttempts"));
        return;
      }
      if (status === 401) {
        setError(t("login.errors.invalidTotp"));
        totpForm.reset();
        return;
      }
      if (status !== 200) {
        setError(t("login.errors.generalError"));
        return;
      }

      await setToken(data.access_token);
      navigate("/admin");
    } catch {
      setError(t("login.errors.networkError"));
    } finally {
      setIsLoading(false);
    }
  }

  function backToLogin() {
    setPhase("login");
    setError("");
    totpForm.reset();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      {/* 顶部栏 */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-14 items-center px-4 gap-2">
          <Button variant="ghost" size="icon" asChild className="mr-1 shrink-0">
            <Link to="/" aria-label={t("common.backHome")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Server className="h-4 w-4 text-primary ml-2" />
          <span className="font-semibold text-sm">{t("common.appTitle")}</span>
        </div>
      </header>

      {/* 登录卡片 */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          {/* Phase 1 — 用户名密码 */}
          {phase === "login" && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">{t("login.title")}</CardTitle>
                <CardDescription>{t("login.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("login.username")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="admin"
                              autoComplete="username"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("login.password")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              autoComplete="current-password"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? t("login.loggingIn") : t("login.loginButton")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Phase 2 — TOTP 两步验证 */}
          {phase === "2fa" && (
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">{t("login.twoFactorTitle")}</CardTitle>
                </div>
                <CardDescription>
                  {t("login.twoFactorDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Form {...totpForm}>
                  <form
                    onSubmit={totpForm.handleSubmit(onTotpSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={totpForm.control}
                      name="totp_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("login.totpCode")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000000"
                              maxLength={6}
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              className="text-center tracking-[0.4em] text-lg font-mono"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? t("login.verifying") : t("login.verifyButton")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={backToLogin}
                      disabled={isLoading}
                    >
                      {t("login.backToPassword")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
