import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { Shield } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/api";

const totpSchema = z.object({
  totp_code: z.string().length(6).regex(/^\d+$/),
});
type TotpValues = z.infer<typeof totpSchema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

export function EnableTwoFactorDialog({ open, onOpenChange, onSuccess }: Props) {
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

  useEffect(() => {
    if (!open) return;
    setStep("setup");
    setSecret("");
    setOtpauthUrl("");
    setSetupError("");
    totpForm.reset();
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
