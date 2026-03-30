import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateDdnsTask } from "@/services/dns";
import { useServers } from "@/services/servers";
import type { DdnsTaskRead, UpdateDdnsTaskPayload } from "@/types/dns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  task: DdnsTaskRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDdnsTaskDialog({ task, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const updateTask = useUpdateDdnsTask();
  const { data: servers = [] } = useServers();

  const [serverUuid, setServerUuid] = useState("");
  const [ipVersion, setIpVersion] = useState("ipv4");
  const [isActive, setIsActive] = useState(true);
  const [serverPopoverOpen, setServerPopoverOpen] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevTask, setPrevTask] = useState(task);

  if (task && (task !== prevTask || (open && !prevOpen))) {
    setServerUuid(task.server_uuid);
    setIpVersion(task.ip_version);
    setIsActive(task.is_active === 1);
  }
  if (prevOpen !== open) setPrevOpen(open);
  if (prevTask !== task) setPrevTask(task);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    const payload: UpdateDdnsTaskPayload = {};
    let hasChanges = false;

    if (serverUuid !== task.server_uuid) {
      payload.server_uuid = serverUuid;
      hasChanges = true;
    }
    if (ipVersion !== task.ip_version) {
      payload.ip_version = ipVersion;
      hasChanges = true;
    }
    const activeNum = isActive ? 1 : 0;
    if (activeNum !== task.is_active) {
      payload.is_active = activeNum;
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info(t("admin.services.dns.ddns.toast.noChanges"));
      return;
    }

    const toastId = toast.loading(t("common.saving"));
    updateTask.mutate(
      { id: task.id, payload },
      {
        onSuccess: () => {
          toast.success(t("admin.services.dns.ddns.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("admin.services.dns.ddns.toast.editFailed"), { id: toastId });
        },
      }
    );
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.services.dns.ddns.edit.title")}</DialogTitle>
          <DialogDescription>{t("admin.services.dns.ddns.edit.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.services.dns.ddns.edit.server")}</Label>
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
                      : t("admin.services.dns.ddns.edit.serverPlaceholder")}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder={t("admin.services.dns.ddns.edit.serverSearch")} />
                  <CommandList>
                    <CommandEmpty>{t("admin.services.dns.ddns.edit.serverEmpty")}</CommandEmpty>
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

          <div className="space-y-2">
            <Label>{t("admin.services.dns.ddns.edit.ipVersion")}</Label>
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

          <div className="flex items-center justify-between">
            <Label htmlFor="ddnsActive">{t("admin.services.dns.ddns.edit.active")}</Label>
            <Switch
              id="ddnsActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateTask.isPending || !serverUuid}>
              {updateTask.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
