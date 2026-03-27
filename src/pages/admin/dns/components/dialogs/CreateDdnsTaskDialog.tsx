import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateDdnsTask, useDnsDomains, useDnsRecords } from "@/services/dns";
import { useServers } from "@/services/servers";
import type { CreateDdnsTaskPayload } from "@/types/dns";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDdnsTaskDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const createTask = useCreateDdnsTask();
  const { data: domains = [] } = useDnsDomains();
  const { data: servers = [] } = useServers();

  const [domainId, setDomainId] = useState("");
  const { data: records = [] } = useDnsRecords(domainId ? Number(domainId) : null);

  const [recordId, setRecordId] = useState("");
  const [serverUuid, setServerUuid] = useState("");
  const [ipVersion, setIpVersion] = useState("ipv4");
  const [serverPopoverOpen, setServerPopoverOpen] = useState(false);

  const resetForm = () => {
    setDomainId("");
    setRecordId("");
    setServerUuid("");
    setIpVersion("ipv4");
    setServerPopoverOpen(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleDomainChange = (val: string) => {
    setDomainId(val);
    setRecordId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordId || !serverUuid) return;

    const payload: CreateDdnsTaskPayload = {
      record_id: Number(recordId),
      server_uuid: serverUuid,
      ip_version: ipVersion,
    };

    const toastId = toast.loading(t("admin.services.dns.ddns.toast.creating"));
    createTask.mutate(payload, {
      onSuccess: () => {
        toast.success(t("admin.services.dns.ddns.toast.createSuccess"), { id: toastId });
        resetForm();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("admin.services.dns.ddns.toast.createFailed"), { id: toastId });
      },
    });
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.services.dns.ddns.create.title")}</DialogTitle>
          <DialogDescription>{t("admin.services.dns.ddns.create.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Domain selector (helper to filter records) */}
          <div className="space-y-2">
            <Label>{t("admin.services.dns.domains.title")}</Label>
            <Select value={domainId} onValueChange={handleDomainChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.services.dns.domains.title")} />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.domain_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Record selector */}
          <div className="space-y-2">
            <Label>{t("admin.services.dns.ddns.create.record")}</Label>
            <Select value={recordId} onValueChange={setRecordId} disabled={!domainId}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.services.dns.ddns.create.recordPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {records.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name} ({r.type}) — {r.content}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Server selector */}
          <div className="space-y-2">
            <Label>{t("admin.services.dns.ddns.create.server")}</Label>
            <Popover open={serverPopoverOpen} onOpenChange={setServerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={serverPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {serverUuid
                      ? (servers.find((s) => s.uuid === serverUuid)?.name ?? serverUuid)
                      : t("admin.services.dns.ddns.create.serverPlaceholder")}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder={t("admin.services.dns.ddns.create.serverSearch")} />
                  <CommandList>
                    <CommandEmpty>{t("admin.services.dns.ddns.create.serverEmpty")}</CommandEmpty>
                    <CommandGroup>
                      {servers.map((s) => (
                        <CommandItem
                          key={s.uuid}
                          value={s.name}
                          onSelect={() => {
                            setServerUuid(s.uuid);
                            setServerPopoverOpen(false);
                          }}
                        >
                          {s.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* IP version */}
          <div className="space-y-2">
            <Label>{t("admin.services.dns.ddns.create.ipVersion")}</Label>
            <Select value={ipVersion} onValueChange={setIpVersion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ipv4">IPv4</SelectItem>
                <SelectItem value="ipv6">IPv6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createTask.isPending || !recordId || !serverUuid}
            >
              {createTask.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
