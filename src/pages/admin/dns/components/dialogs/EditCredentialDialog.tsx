import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateDnsCredential } from "@/services/dns";
import type { CredentialRead, UpdateCredentialPayload } from "@/types/dns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  credential: CredentialRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCredentialDialog({ credential, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const updateCredential = useUpdateDnsCredential();

  const [name, setName] = useState(credential?.name ?? "");
  const [credsJson, setCredsJson] = useState("");

  const [prevCredential, setPrevCredential] = useState<CredentialRead | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  if (credential !== prevCredential || open !== prevOpen) {
    setPrevCredential(credential);
    setPrevOpen(open);
    if (credential) {
      setName(credential.name ?? "");
      setCredsJson("");
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential) return;

    const payload: UpdateCredentialPayload = {};
    const newName = name.trim();
    if (newName !== credential.name) payload.name = newName;

    if (credsJson.trim()) {
      try {
        payload.credentials = JSON.parse(credsJson.trim());
      } catch {
        toast.error("Invalid JSON");
        return;
      }
    }

    if (Object.keys(payload).length === 0) {
      toast.info(t("admin.services.dns.credentials.toast.noChanges"));
      return;
    }

    const toastId = toast.loading(t("admin.services.dns.credentials.toast.editSaving"));
    updateCredential.mutate(
      { id: credential.id, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.services.dns.credentials.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.services.dns.credentials.toast.editFailed"), { id: toastId });
        },
      },
    );
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.services.dns.credentials.edit.title")}</DialogTitle>
          <DialogDescription>{t("admin.services.dns.credentials.edit.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.services.dns.credentials.edit.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={128}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.services.dns.credentials.edit.updateCredentials")}</Label>
            <p className="text-xs text-muted-foreground">{t("admin.services.dns.credentials.edit.updateCredentialsHint")}</p>
            <textarea
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={credsJson}
              onChange={(e) => setCredsJson(e.target.value)}
              placeholder='{"auth_token": "new-value"}'
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateCredential.isPending}>
              {updateCredential.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
