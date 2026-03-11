import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateProvider } from "@/services/notifications";
import type { CreateProviderPayload } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PROVIDER_TYPES = ["webhook", "telegram", "email"] as const;
type ProviderType = (typeof PROVIDER_TYPES)[number];

interface WebhookConfig {
  url: string;
  method: string;
}

interface TelegramConfig {
  bot_token: string;
}

interface EmailConfig {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  from_address: string;
}

const DEFAULT_WEBHOOK: WebhookConfig = { url: "", method: "POST" };
const DEFAULT_TELEGRAM: TelegramConfig = { bot_token: "" };
const DEFAULT_EMAIL: EmailConfig = {
  smtp_host: "",
  smtp_port: "587",
  smtp_username: "",
  smtp_password: "",
  from_address: "",
};

function getDefaultConfig(type: ProviderType) {
  switch (type) {
    case "webhook":
      return { ...DEFAULT_WEBHOOK };
    case "telegram":
      return { ...DEFAULT_TELEGRAM };
    case "email":
      return { ...DEFAULT_EMAIL };
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProviderDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const createProvider = useCreateProvider();

  const [name, setName] = useState("");
  const [providerType, setProviderType] = useState<ProviderType | "">("");
  const [config, setConfig] = useState<Record<string, string>>({});

  const handleTypeChange = (type: string) => {
    const t = type as ProviderType;
    setProviderType(t);
    setConfig(getDefaultConfig(t));
  };

  const updateField = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerType) return;
    const payload: CreateProviderPayload = {
      name: name.trim() || null,
      type: providerType,
      addition: JSON.stringify(config),
    };
    const toastId = toast.loading(t("admin.alerts.channels.providers.toast.creating"));
    createProvider.mutate(payload, {
      onSuccess: () => {
        toast.success(t("admin.alerts.channels.providers.toast.createSuccess"), { id: toastId });
        resetForm();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.alerts.channels.providers.toast.createFailed"), { id: toastId });
      },
    });
  };

  const resetForm = () => {
    setName("");
    setProviderType("");
    setConfig({});
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const canSubmit = providerType !== "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.alerts.channels.providers.create.title")}</DialogTitle>
          <DialogDescription>{t("admin.alerts.channels.providers.create.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.alerts.channels.providers.create.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.alerts.channels.providers.create.namePlaceholder")}
              maxLength={64}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.alerts.channels.providers.create.type")}</Label>
            <Select value={providerType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.alerts.channels.providers.create.typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((pt) => (
                  <SelectItem key={pt} value={pt}>
                    {t(`admin.alerts.channels.providers.types.${pt}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic config form */}
          {providerType === "webhook" && (
            <WebhookForm config={config as unknown as WebhookConfig} onChange={updateField} />
          )}
          {providerType === "telegram" && (
            <TelegramForm config={config as unknown as TelegramConfig} onChange={updateField} />
          )}
          {providerType === "email" && (
            <EmailForm config={config as unknown as EmailConfig} onChange={updateField} />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t("admin.alerts.channels.providers.create.cancel")}
            </Button>
            <Button type="submit" disabled={createProvider.isPending || !canSubmit}>
              {createProvider.isPending ? t("common.loading") : t("admin.alerts.channels.providers.create.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Sub-forms ─────────────────────────────────────────────────────────────── */

function WebhookForm({
  config,
  onChange,
}: {
  config: WebhookConfig;
  onChange: (key: string, value: string) => void;
}) {
  const { t } = useTranslation();
  const prefix = "admin.alerts.channels.providers.fields.webhook";
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {t(`${prefix}.title`)}
      </p>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.url`)}</Label>
        <Input
          value={config.url}
          onChange={(e) => onChange("url", e.target.value)}
          placeholder="https://example.com/webhook"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.method`)}</Label>
        <Select value={config.method} onValueChange={(v) => onChange("method", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function TelegramForm({
  config,
  onChange,
}: {
  config: TelegramConfig;
  onChange: (key: string, value: string) => void;
}) {
  const { t } = useTranslation();
  const prefix = "admin.alerts.channels.providers.fields.telegram";
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {t(`${prefix}.title`)}
      </p>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.botToken`)}</Label>
        <Input
          value={config.bot_token}
          onChange={(e) => onChange("bot_token", e.target.value)}
          placeholder="123456:ABC-DEF1234..."
          required
        />
      </div>
    </div>
  );
}

function EmailForm({
  config,
  onChange,
}: {
  config: EmailConfig;
  onChange: (key: string, value: string) => void;
}) {
  const { t } = useTranslation();
  const prefix = "admin.alerts.channels.providers.fields.email";
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {t(`${prefix}.title`)}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">{t(`${prefix}.smtpHost`)}</Label>
          <Input
            value={config.smtp_host}
            onChange={(e) => onChange("smtp_host", e.target.value)}
            placeholder="smtp.example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t(`${prefix}.smtpPort`)}</Label>
          <Input
            type="number"
            value={config.smtp_port}
            onChange={(e) => onChange("smtp_port", e.target.value)}
            placeholder="587"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.smtpUser`)}</Label>
        <Input
          value={config.smtp_username}
          onChange={(e) => onChange("smtp_username", e.target.value)}
          placeholder="user@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.smtpPassword`)}</Label>
        <Input
          type="password"
          value={config.smtp_password}
          onChange={(e) => onChange("smtp_password", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.fromAddress`)}</Label>
        <Input
          type="email"
          value={config.from_address}
          onChange={(e) => onChange("from_address", e.target.value)}
          placeholder="alert@example.com"
          required
        />
      </div>
    </div>
  );
}
