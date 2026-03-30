import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

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

export function ChangePasswordCard() {
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
