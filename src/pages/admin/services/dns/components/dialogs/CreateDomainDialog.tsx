import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateDnsDomain, useDnsCredentials } from "@/services/dns";
import type { CreateDomainPayload } from "@/types/dns";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDomainDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const createDomain = useCreateDnsDomain();
  const { data: credentials = [] } = useDnsCredentials();

  const [credentialId, setCredentialId] = useState("");
  const [domainName, setDomainName] = useState("");
  const [zoneId, setZoneId] = useState("");

  const resetForm = () => {
    setCredentialId("");
    setDomainName("");
    setZoneId("");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialId || !domainName.trim()) return;

    const payload: CreateDomainPayload = {
      credential_id: Number(credentialId),
      domain_name: domainName.trim(),
      zone_id: zoneId.trim() || null,
    };

    const toastId = toast.loading(t("admin.services.dns.domains.toast.creating"));
    createDomain.mutate(payload, {
      onSuccess: () => {
        toast.success(t("admin.services.dns.domains.toast.createSuccess"), { id: toastId });
        resetForm();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.services.dns.domains.toast.createFailed"), { id: toastId });
      },
    });
  };

  const tp = "admin.services.dns.domains";
  const canSubmit = credentialId !== "" && domainName.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${tp}.create.title`)}</DialogTitle>
          <DialogDescription>{t(`${tp}.create.description`)}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t(`${tp}.create.credential`)}</Label>
            <Select value={credentialId} onValueChange={setCredentialId}>
              <SelectTrigger>
                <SelectValue placeholder={t(`${tp}.create.credentialPlaceholder`)} />
              </SelectTrigger>
              <SelectContent>
                {credentials.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t(`${tp}.create.domainName`)}</Label>
            <Input
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              placeholder={t(`${tp}.create.domainNamePlaceholder`)}
              maxLength={253}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t(`${tp}.create.zoneId`)}</Label>
            <Input
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              placeholder={t(`${tp}.create.zoneIdPlaceholder`)}
              maxLength={128}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t(`${tp}.create.cancel`)}
            </Button>
            <Button type="submit" disabled={createDomain.isPending || !canSubmit}>
              {createDomain.isPending ? t("common.loading") : t(`${tp}.create.save`)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
