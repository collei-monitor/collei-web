import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateDnsDomain, useDnsCredentials } from "@/services/dns";
import type { DomainRead, UpdateDomainPayload } from "@/types/dns";
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
  domain: DomainRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDomainDialog({ domain, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const updateDomain = useUpdateDnsDomain();
  const { data: credentials = [] } = useDnsCredentials();

  const [credentialId, setCredentialId] = useState("");
  const [zoneId, setZoneId] = useState("");

  const prevOpen = useRef(open);
  const prevDomain = useRef(domain);

  useEffect(() => {
    if (
      domain &&
      (domain !== prevDomain.current || (open && !prevOpen.current))
    ) {
      setCredentialId(String(domain.credential_id));
      setZoneId(domain.zone_id ?? "");
    }
    prevOpen.current = open;
    prevDomain.current = domain;
  }, [domain, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !credentialId) return;

    const payload: UpdateDomainPayload = {
      credential_id: Number(credentialId),
      zone_id: zoneId.trim() || null,
    };

    const toastId = toast.loading(t("admin.services.dns.domains.toast.updating"));
    updateDomain.mutate(
      { id: domain.id, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.services.dns.domains.toast.updateSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.services.dns.domains.toast.updateFailed"), { id: toastId });
        },
      }
    );
  };

  const tp = "admin.services.dns.domains";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${tp}.edit.title`)}</DialogTitle>
          <DialogDescription>
            {domain?.domain_name}
          </DialogDescription>
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
            <Label>{t(`${tp}.create.zoneId`)}</Label>
            <Input
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              placeholder={t(`${tp}.create.zoneIdPlaceholder`)}
              maxLength={128}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t(`${tp}.edit.cancel`)}
            </Button>
            <Button type="submit" disabled={updateDomain.isPending || !credentialId}>
              {updateDomain.isPending ? t("common.loading") : t(`${tp}.edit.save`)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
