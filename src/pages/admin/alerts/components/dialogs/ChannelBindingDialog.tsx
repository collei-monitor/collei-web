import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  useRuleChannelBindings,
  useUpdateRuleChannels,
  useChannels,
} from "@/services/notifications";
import type { AlertRuleRead } from "@/types/notification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  rule: AlertRuleRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChannelBindingDialog({ rule, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { data: bindings = [] } = useRuleChannelBindings(rule?.id ?? 0);
  const { data: channels = [] } = useChannels();
  const updateChannels = useUpdateRuleChannels();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [prevBindingsKey, setPrevBindingsKey] = useState("");

  // Sync selected state when bindings data changes (React recommended pattern)
  const bindingsKey = bindings.map((b) => b.channel_id).sort().join(",");
  if (bindingsKey !== prevBindingsKey) {
    setPrevBindingsKey(bindingsKey);
    setSelectedIds(new Set(bindings.map((b) => b.channel_id)));
  }

  const boundSet = useMemo(
    () => new Set(bindings.map((b) => b.channel_id)),
    [bindings],
  );

  const toggleChannel = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const hasChanges = useMemo(() => {
    if (selectedIds.size !== boundSet.size) return true;
    for (const id of selectedIds) {
      if (!boundSet.has(id)) return true;
    }
    return false;
  }, [selectedIds, boundSet]);

  const handleSave = () => {
    if (!rule) return;
    updateChannels.mutate(
      { ruleId: rule.id, channelIds: Array.from(selectedIds) },
      {
        onSuccess: () => {
          toast.success(t("admin.alerts.rules.toast.channelsSaved"));
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(
            err.message || t("admin.alerts.rules.toast.channelsSaveFailed"),
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("admin.alerts.rules.channelBinding.title")} - {rule?.name}
          </DialogTitle>
          <DialogDescription>
            {t("admin.alerts.rules.channelBinding.description")}
          </DialogDescription>
        </DialogHeader>

        {channels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t("admin.alerts.rules.channelBinding.empty")}
          </div>
        ) : (
          <div className="rounded-md border divide-y max-h-[50vh] overflow-y-auto">
            {channels.map((ch) => {
              const selected = selectedIds.has(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
                    selected && "bg-accent/30",
                  )}
                  onClick={() => toggleChannel(ch.id)}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {ch.name}
                    </span>
                    {ch.target && (
                      <span className="text-xs text-muted-foreground truncate">
                        {ch.target}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("admin.alerts.rules.channelBinding.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateChannels.isPending || !hasChanges}
          >
            {t("admin.alerts.rules.channelBinding.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
