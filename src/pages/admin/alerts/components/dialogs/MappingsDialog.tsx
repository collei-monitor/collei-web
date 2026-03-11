import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  useRuleMappings,
  useCreateMapping,
  useDeleteMapping,
  useChannels,
} from "@/services/notifications";
import type { AlertRuleRead, TargetType } from "@/types/notification";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TARGET_TYPES: TargetType[] = ["server", "group", "global"];

interface Props {
  rule: AlertRuleRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MappingsDialog({ rule, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { data: mappings = [], isLoading } = useRuleMappings(rule?.id ?? 0);
  const { data: channels = [] } = useChannels();
  const createMapping = useCreateMapping();
  const deleteMapping = useDeleteMapping();

  const [targetType, setTargetType] = useState<string>("server");
  const [targetId, setTargetId] = useState("");
  const [channelId, setChannelId] = useState<string>("");

  const handleAdd = () => {
    if (!rule) return;
    const finalTargetId = targetType === "global" ? "*" : targetId.trim();
    if (!finalTargetId || !channelId) return;

    createMapping.mutate(
      {
        ruleId: rule.id,
        payload: {
          target_type: targetType,
          target_id: finalTargetId,
          channel_id: Number(channelId),
        },
      },
      {
        onSuccess: () => {
          toast.success(t("admin.alerts.rules.toast.mappingAdded"));
          setTargetId("");
          setChannelId("");
        },
        onError: (err) => {
          toast.error(err.message || t("admin.alerts.rules.toast.mappingAddFailed"));
        },
      },
    );
  };

  const handleDelete = (tType: string, tId: string) => {
    if (!rule) return;
    deleteMapping.mutate(
      { ruleId: rule.id, targetType: tType, targetId: tId },
      {
        onSuccess: () => {
          toast.success(t("admin.alerts.rules.toast.mappingDeleted"));
        },
        onError: (err) => {
          toast.error(err.message || t("admin.alerts.rules.toast.mappingDeleteFailed"));
        },
      },
    );
  };

  const channelNameMap = new Map(channels.map((c) => [c.id, c.name]));
  const canAdd = targetType === "global" || targetId.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("admin.alerts.rules.mappings.title")} - {rule?.name}
          </DialogTitle>
          <DialogDescription>
            {t("admin.alerts.rules.mappings.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Add form */}
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">{t("admin.alerts.rules.mappings.targetType")}</Label>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_TYPES.map((tt) => (
                  <SelectItem key={tt} value={tt}>
                    {t(`admin.alerts.rules.mappings.${tt}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("admin.alerts.rules.mappings.targetId")}</Label>
            <Input
              value={targetType === "global" ? "*" : targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={targetType === "global"}
              placeholder={t("admin.alerts.rules.mappings.targetIdPlaceholder")}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("admin.alerts.rules.mappings.channel")}</Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger disabled={channels.length === 0}>
                <SelectValue placeholder={t("admin.alerts.rules.mappings.channelPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {channels.map((ch) => (
                  <SelectItem key={ch.id} value={String(ch.id)}>
                    {ch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={createMapping.isPending || !canAdd || !channelId}
          >
            {t("admin.alerts.rules.mappings.add")}
          </Button>
        </div>

        {/* Mappings table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.alerts.rules.mappings.targetType")}</TableHead>
                <TableHead>{t("admin.alerts.rules.mappings.targetId")}</TableHead>
                <TableHead>{t("admin.alerts.rules.mappings.channel")}</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    {t("admin.alerts.rules.mappings.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((m) => (
                  <TableRow key={`${m.target_type}-${m.target_id}-${m.channel_id}`}>
                    <TableCell>
                      {t(`admin.alerts.rules.mappings.${m.target_type}`)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{m.target_id}</TableCell>
                    <TableCell>{channelNameMap.get(m.channel_id) ?? m.channel_id}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(m.target_type, m.target_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("admin.alerts.rules.mappings.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
