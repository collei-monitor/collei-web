import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateDnsCredential } from "@/services/dns";
import type { CreateCredentialPayload } from "@/types/dns";
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

const KNOWN_PROVIDERS = ["cloudflare", "aliyun", "dnspod", "route53", "other"] as const;
type ProviderKey = (typeof KNOWN_PROVIDERS)[number];

function getDefaultCreds(provider: ProviderKey): Record<string, string> {
  switch (provider) {
    case "cloudflare":
      return { auth_token: "" };
    case "aliyun":
      return { auth_key_id: "", auth_secret: "" };
    case "dnspod":
      return { auth_token: "" };
    case "route53":
      return { auth_access_key: "", auth_access_secret: "" };
    default:
      return {};
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCredentialDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const createCredential = useCreateDnsCredential();

  const [name, setName] = useState("");
  const [providerKey, setProviderKey] = useState<ProviderKey | "">("");
  const [customProvider, setCustomProvider] = useState("");
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [credsJson, setCredsJson] = useState("");

  const handleProviderChange = (val: string) => {
    const pk = val as ProviderKey;
    setProviderKey(pk);
    if (pk !== "other") {
      setCreds(getDefaultCreds(pk));
      setCredsJson("");
    } else {
      setCreds({});
      setCredsJson("");
    }
  };

  const updateField = (key: string, value: string) => {
    setCreds((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setName("");
    setProviderKey("");
    setCustomProvider("");
    setCreds({});
    setCredsJson("");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerKey) return;

    let finalProvider = providerKey === "other" ? customProvider.trim() : providerKey;
    if (!finalProvider) return;

    let finalCreds: Record<string, string>;
    if (providerKey === "other") {
      try {
        finalCreds = JSON.parse(credsJson);
      } catch {
        toast.error("Invalid JSON");
        return;
      }
    } else {
      finalCreds = { ...creds };
    }

    const payload: CreateCredentialPayload = {
      name: name.trim(),
      provider: finalProvider,
      credentials: finalCreds,
    };

    const toastId = toast.loading(t("admin.services.dns.credentials.toast.creating"));
    createCredential.mutate(payload, {
      onSuccess: () => {
        toast.success(t("admin.services.dns.credentials.toast.createSuccess"), { id: toastId });
        resetForm();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.services.dns.credentials.toast.createFailed"), { id: toastId });
      },
    });
  };

  const tp = "admin.services.dns.credentials";
  const canSubmit = providerKey !== "" && name.trim() !== "" && (providerKey !== "other" || customProvider.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(`${tp}.create.title`)}</DialogTitle>
          <DialogDescription>{t(`${tp}.create.description`)}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t(`${tp}.create.name`)}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(`${tp}.create.namePlaceholder`)}
              maxLength={128}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t(`${tp}.create.provider`)}</Label>
            <Select value={providerKey} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder={t(`${tp}.create.providerPlaceholder`)} />
              </SelectTrigger>
              <SelectContent>
                {KNOWN_PROVIDERS.map((pk) => (
                  <SelectItem key={pk} value={pk}>
                    {t(`${tp}.providers.${pk}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {providerKey === "other" && (
            <div className="space-y-2">
              <Label>{t(`${tp}.create.providerOther`)}</Label>
              <Input
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                placeholder={t(`${tp}.create.providerOtherPlaceholder`)}
                required
              />
            </div>
          )}

          {providerKey === "cloudflare" && (
            <ProviderFields title={t(`${tp}.fields.cloudflare.title`)}>
              <div className="space-y-2">
                <Label className="text-xs">{t(`${tp}.fields.cloudflare.authToken`)}</Label>
                <Input
                  type="password"
                  value={creds.auth_token ?? ""}
                  onChange={(e) => updateField("auth_token", e.target.value)}
                  placeholder={t(`${tp}.fields.cloudflare.authTokenPlaceholder`)}
                  required
                />
              </div>
            </ProviderFields>
          )}

          {providerKey === "aliyun" && (
            <ProviderFields title={t(`${tp}.fields.aliyun.title`)}>
              <div className="space-y-2">
                <Label className="text-xs">{t(`${tp}.fields.aliyun.authKeyId`)}</Label>
                <Input
                  value={creds.auth_key_id ?? ""}
                  onChange={(e) => updateField("auth_key_id", e.target.value)}
                  placeholder={t(`${tp}.fields.aliyun.authKeyIdPlaceholder`)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t(`${tp}.fields.aliyun.authSecret`)}</Label>
                <Input
                  type="password"
                  value={creds.auth_secret ?? ""}
                  onChange={(e) => updateField("auth_secret", e.target.value)}
                  placeholder={t(`${tp}.fields.aliyun.authSecretPlaceholder`)}
                  required
                />
              </div>
            </ProviderFields>
          )}

          {providerKey === "dnspod" && (
            <ProviderFields title={t(`${tp}.fields.dnspod.title`)}>
              <div className="space-y-2">
                <Label className="text-xs">{t(`${tp}.fields.dnspod.authToken`)}</Label>
                <Input
                  type="password"
                  value={creds.auth_token ?? ""}
                  onChange={(e) => updateField("auth_token", e.target.value)}
                  placeholder={t(`${tp}.fields.dnspod.authTokenPlaceholder`)}
                  required
                />
              </div>
            </ProviderFields>
          )}

          {providerKey === "route53" && (
            <ProviderFields title={t(`${tp}.fields.route53.title`)}>
              <div className="space-y-2">
                <Label className="text-xs">{t(`${tp}.fields.route53.authAccessKey`)}</Label>
                <Input
                  value={creds.auth_access_key ?? ""}
                  onChange={(e) => updateField("auth_access_key", e.target.value)}
                  placeholder={t(`${tp}.fields.route53.authAccessKeyPlaceholder`)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t(`${tp}.fields.route53.authAccessSecret`)}</Label>
                <Input
                  type="password"
                  value={creds.auth_access_secret ?? ""}
                  onChange={(e) => updateField("auth_access_secret", e.target.value)}
                  placeholder={t(`${tp}.fields.route53.authAccessSecretPlaceholder`)}
                  required
                />
              </div>
            </ProviderFields>
          )}

          {providerKey === "other" && (
            <div className="space-y-2">
              <Label>{t(`${tp}.create.credentialsJson`)}</Label>
              <textarea
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={credsJson}
                onChange={(e) => setCredsJson(e.target.value)}
                placeholder={t(`${tp}.create.credentialsJsonPlaceholder`)}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t(`${tp}.create.cancel`)}
            </Button>
            <Button type="submit" disabled={createCredential.isPending || !canSubmit}>
              {createCredential.isPending ? t("common.loading") : t(`${tp}.create.save`)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProviderFields({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
