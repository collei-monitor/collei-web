import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateDnsRecord } from "@/services/dns";
import type { RecordRead, UpdateRecordPayload } from "@/types/dns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  record: RecordRead | null;
  domainId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRecordDialog({ record, domainId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const updateRecord = useUpdateDnsRecord();

  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("");
  const [priority, setPriority] = useState("");
  const [proxied, setProxied] = useState(false);

  const prevOpen = useRef(open);
  const prevRecord = useRef(record);

  useEffect(() => {
    if (
      record &&
      (record !== prevRecord.current || (open && !prevOpen.current))
    ) {
      setContent(record.content);
      setTtl(String(record.ttl));
      setPriority(record.priority != null ? String(record.priority) : "");
      setProxied(record.proxied === 1);
    }
    prevOpen.current = open;
    prevRecord.current = record;
  }, [record, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    const payload: UpdateRecordPayload = {};
    let hasChanges = false;

    if (content.trim() !== record.content) {
      payload.content = content.trim();
      hasChanges = true;
    }
    const newTtl = Number(ttl);
    if (!isNaN(newTtl) && newTtl !== record.ttl) {
      payload.ttl = newTtl;
      hasChanges = true;
    }
    const newPriority = priority ? Number(priority) : null;
    if (newPriority !== record.priority) {
      payload.priority = newPriority;
      hasChanges = true;
    }
    const newProxied = proxied ? 1 : 0;
    if (newProxied !== record.proxied) {
      payload.proxied = newProxied;
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info(t("admin.services.dns.records.toast.noChanges"));
      return;
    }

    const toastId = toast.loading(t("admin.services.dns.records.toast.editSaving"));
    updateRecord.mutate(
      { recId: record.id, domainId, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.services.dns.records.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.services.dns.records.toast.editFailed"), { id: toastId });
        },
      }
    );
  };

  const tp = "admin.services.dns.records";
  const showPriority = record?.type === "MX" || record?.type === "SRV";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${tp}.edit.title`)}</DialogTitle>
          <DialogDescription>
            {record ? `${record.name} (${record.type})` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t(`${tp}.edit.content`)}</Label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t(`${tp}.edit.ttl`)}</Label>
              <Input
                type="number"
                min={1}
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
              />
            </div>
            {showPriority && (
              <div className="space-y-2">
                <Label>{t(`${tp}.edit.priority`)}</Label>
                <Input
                  type="number"
                  min={0}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="editProxied"
              checked={proxied}
              onCheckedChange={(v) => setProxied(!!v)}
            />
            <Label htmlFor="editProxied">{t(`${tp}.edit.proxied`)}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t(`${tp}.edit.cancel`)}
            </Button>
            <Button type="submit" disabled={updateRecord.isPending}>
              {updateRecord.isPending ? t("common.loading") : t(`${tp}.edit.save`)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
