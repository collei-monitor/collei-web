import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateDnsRecord } from "@/services/dns";
import type { CreateRecordPayload, DnsRecordType } from "@/types/dns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

const RECORD_TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME", "TXT", "MX", "SRV"];

interface Props {
  domainId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRecordDialog({ domainId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const createRecord = useCreateDnsRecord();

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("");
  const [priority, setPriority] = useState("");
  const [proxied, setProxied] = useState(false);

  const resetForm = () => {
    setName("");
    setType("");
    setContent("");
    setTtl("");
    setPriority("");
    setProxied(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type || !content.trim()) return;

    const payload: CreateRecordPayload = {
      name: name.trim(),
      type,
      content: content.trim(),
    };
    if (ttl) payload.ttl = Number(ttl);
    if (priority && (type === "MX" || type === "SRV")) payload.priority = Number(priority);
    if (proxied) payload.proxied = 1;

    const toastId = toast.loading(t("admin.services.dns.records.toast.creating"));
    createRecord.mutate(
      { domainId, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.services.dns.records.toast.createSuccess"), { id: toastId });
          resetForm();
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.services.dns.records.toast.createFailed"), { id: toastId });
        },
      }
    );
  };

  const showPriority = type === "MX" || type === "SRV";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.services.dns.records.create.title")}</DialogTitle>
          <DialogDescription>{t("admin.services.dns.records.create.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("admin.services.dns.records.create.name")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("admin.services.dns.records.create.namePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.services.dns.records.create.type")}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.services.dns.records.create.typePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      {rt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("admin.services.dns.records.create.content")}</Label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("admin.services.dns.records.create.contentPlaceholder")}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("admin.services.dns.records.create.ttl")}</Label>
              <Input
                type="number"
                min={1}
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                placeholder={t("admin.services.dns.records.create.ttlPlaceholder")}
              />
            </div>
            {showPriority && (
              <div className="space-y-2">
                <Label>{t("admin.services.dns.records.create.priority")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  placeholder={t("admin.services.dns.records.create.priorityPlaceholder")}
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="proxied"
              checked={proxied}
              onCheckedChange={(v) => setProxied(!!v)}
            />
            <Label htmlFor="proxied">{t("admin.services.dns.records.create.proxied")}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createRecord.isPending || !name.trim() || !type || !content.trim()}
            >
              {createRecord.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
