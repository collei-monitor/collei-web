import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateProvider } from "@/services/notifications";
import type { ProviderRead, UpdateProviderPayload } from "@/types/notification";
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

const KNOWN_TYPES = ["webhook", "telegram", "email"] as const;
type ProviderType = (typeof KNOWN_TYPES)[number];

function parseAddition(addition: string | null): Record<string, string> {
  if (!addition) return {};
  try {
    const obj = JSON.parse(addition);
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = String(v ?? "");
    }
    return result;
  } catch {
    return {};
  }
}

interface Props {
  provider: ProviderRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProviderDialog({ provider, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const updateProvider = useUpdateProvider();

  const [name, setName] = useState(provider?.name ?? "");
  const [providerType, setProviderType] = useState<ProviderType | "">(
    (provider?.type as ProviderType) ?? "",
  );
  const [config, setConfig] = useState<Record<string, string>>({});

  const [prevProvider, setPrevProvider] = useState<ProviderRead | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  if (provider !== prevProvider || open !== prevOpen) {
    setPrevProvider(provider);
    setPrevOpen(open);
    if (provider) {
      setName(provider.name ?? "");
      setProviderType((provider.type as ProviderType) ?? "");
      setConfig(parseAddition(provider.addition));
    }
  }

  const updateField = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (type: string) => {
    const pt = type as ProviderType;
    setProviderType(pt);
    setConfig(parseAddition(null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;

    const newAddition = JSON.stringify(config);
    const oldAddition = provider.addition ?? "{}";
    const newName = name.trim() || null;
    const newType = providerType || null;

    const payload: UpdateProviderPayload = {};
    if (newAddition !== oldAddition) payload.addition = newAddition;
    if (newName !== (provider.name ?? null)) payload.name = newName;
    if (newType !== (provider.type ?? null)) payload.type = newType;

    if (Object.keys(payload).length === 0) {
      toast.info(t("admin.alerts.channels.providers.toast.noChanges"));
      return;
    }

    const toastId = toast.loading(t("admin.alerts.channels.providers.toast.editSaving"));
    updateProvider.mutate(
      { id: provider.id, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.alerts.channels.providers.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.alerts.channels.providers.toast.editFailed"), { id: toastId });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.alerts.channels.providers.edit.title")}</DialogTitle>
          <DialogDescription>{t("admin.alerts.channels.providers.edit.description")}</DialogDescription>
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
                {KNOWN_TYPES.map((tp) => (
                  <SelectItem key={tp} value={tp}>
                    {t(`admin.alerts.channels.providers.types.${tp}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {providerType === "webhook" && (
            <WebhookForm config={config} onChange={updateField} />
          )}
          {providerType === "telegram" && (
            <TelegramForm config={config} onChange={updateField} />
          )}
          {providerType === "email" && (
            <EmailForm config={config} onChange={updateField} />
          )}
          {!providerType && (
            <div className="space-y-2">
              <Label>{t("admin.alerts.channels.providers.edit.addition")}</Label>
              <Input
                value={JSON.stringify(config)}
                onChange={(e) => {
                  try {
                    setConfig(JSON.parse(e.target.value));
                  } catch { /* keep current */ }
                }}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("admin.alerts.channels.providers.edit.cancel")}
            </Button>
            <Button type="submit" disabled={updateProvider.isPending}>
              {updateProvider.isPending ? t("common.loading") : t("admin.alerts.channels.providers.edit.save")}
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
  config: Record<string, string>;
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
          value={config.url ?? ""}
          onChange={(e) => onChange("url", e.target.value)}
          placeholder="https://example.com/webhook"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.method`)}</Label>
        <Select value={config.method ?? "POST"} onValueChange={(v) => onChange("method", v)}>
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
  config: Record<string, string>;
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
          value={config.bot_token ?? ""}
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
  config: Record<string, string>;
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
            value={config.smtp_host ?? ""}
            onChange={(e) => onChange("smtp_host", e.target.value)}
            placeholder="smtp.example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t(`${prefix}.smtpPort`)}</Label>
          <Input
            type="number"
            value={config.smtp_port ?? "587"}
            onChange={(e) => onChange("smtp_port", e.target.value)}
            placeholder="587"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.smtpUser`)}</Label>
        <Input
          value={config.smtp_username ?? ""}
          onChange={(e) => onChange("smtp_username", e.target.value)}
          placeholder="user@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.smtpPassword`)}</Label>
        <Input
          type="password"
          value={config.smtp_password ?? ""}
          onChange={(e) => onChange("smtp_password", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">{t(`${prefix}.fromAddress`)}</Label>
        <Input
          type="email"
          value={config.from_address ?? ""}
          onChange={(e) => onChange("from_address", e.target.value)}
          placeholder="alert@example.com"
          required
        />
      </div>
    </div>
  );
}
