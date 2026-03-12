import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Trash2,
  Check,
  ChevronsUpDown,
  X,
  Shield,
  ShieldOff,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useRuleTargets,
  useCreateRuleTargets,
  useDeleteRuleTargets,
} from "@/services/notifications";
import { useServers, useGroups } from "@/services/servers";
import type {
  AlertRuleRead,
  TargetType,
  RuleTargetRead,
} from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const TARGET_TYPES: TargetType[] = ["server", "group", "global"];
const TARGET_TYPE_ORDER: Record<string, number> = {
  global: 0,
  server: 1,
  group: 2,
};

interface Props {
  rule: AlertRuleRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GroupedTargets {
  whitelist: Record<string, RuleTargetRead[]>;
  blacklist: Record<string, RuleTargetRead[]>;
}

export function MappingsDialog({ rule, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { data: targets = [], isLoading } = useRuleTargets(rule?.id ?? 0);
  const { data: servers = [] } = useServers();
  const { data: groups = [] } = useGroups();
  const createTargets = useCreateRuleTargets();
  const deleteTargets = useDeleteRuleTargets();

  const [targetType, setTargetType] = useState<string>("server");
  const [isExclude, setIsExclude] = useState<string>("0");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());

  const serverNameMap = useMemo(
    () => new Map(servers.map((s) => [s.uuid, s.name])),
    [servers],
  );
  const groupNameMap = useMemo(
    () => new Map(groups.map((g) => [g.id, g.name])),
    [groups],
  );

  const resolveTargetName = (type: string, id: string) => {
    if (type === "global") return t("admin.alerts.rules.targets.globalAll");
    if (type === "server") return serverNameMap.get(id) ?? id;
    if (type === "group") return groupNameMap.get(id) ?? id;
    return id;
  };

  // Group targets by is_exclude and target_type
  const grouped = useMemo<GroupedTargets>(() => {
    const whitelist: Record<string, RuleTargetRead[]> = {};
    const blacklist: Record<string, RuleTargetRead[]> = {};

    for (const t of targets) {
      const map = t.is_exclude === 1 ? blacklist : whitelist;
      if (!map[t.target_type]) map[t.target_type] = [];
      map[t.target_type].push(t);
    }

    return { whitelist, blacklist };
  }, [targets]);

  const sortedTypes = (group: Record<string, RuleTargetRead[]>) =>
    Object.keys(group).sort(
      (a, b) => (TARGET_TYPE_ORDER[a] ?? 99) - (TARGET_TYPE_ORDER[b] ?? 99),
    );

  const handleTargetTypeChange = (value: string) => {
    setTargetType(value);
    setSelectedIds([]);
  };

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const removeId = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleAdd = () => {
    if (!rule) return;
    const exclude = Number(isExclude);
    const targetItems =
      targetType === "global"
        ? [{ target_type: "global", target_id: "all", is_exclude: exclude }]
        : selectedIds.map((id) => ({
            target_type: targetType,
            target_id: id,
            is_exclude: exclude,
          }));

    if (targetItems.length === 0) return;

    createTargets.mutate(
      { ruleId: rule.id, targets: targetItems },
      {
        onSuccess: (result) => {
          toast.success(
            t("admin.alerts.rules.toast.targetAdded", { count: result.length }),
          );
          setSelectedIds([]);
        },
        onError: (err) => {
          toast.error(
            err.message || t("admin.alerts.rules.toast.targetAddFailed"),
          );
        },
      },
    );
  };

  const handleDelete = (tType: string, tId: string) => {
    if (!rule) return;
    deleteTargets.mutate(
      { ruleId: rule.id, targets: [{ target_type: tType, target_id: tId }] },
      {
        onSuccess: () => {
          toast.success(t("admin.alerts.rules.toast.targetDeleted"));
          setCheckedKeys((prev) => {
            const next = new Set(prev);
            next.delete(`${tType}-${tId}`);
            return next;
          });
        },
        onError: (err) => {
          toast.error(
            err.message || t("admin.alerts.rules.toast.targetDeleteFailed"),
          );
        },
      },
    );
  };

  const toggleCheck = useCallback((key: string) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleCheckGroup = useCallback(
    (groupTargets: RuleTargetRead[], checked: boolean) => {
      setCheckedKeys((prev) => {
        const next = new Set(prev);
        for (const t of groupTargets) {
          const key = `${t.target_type}-${t.target_id}`;
          if (checked) next.add(key);
          else next.delete(key);
        }
        return next;
      });
    },
    [],
  );

  const handleBatchDelete = () => {
    if (!rule || checkedKeys.size === 0) return;
    const items = [...checkedKeys].map((k) => {
      const [type, ...rest] = k.split("-");
      return { target_type: type, target_id: rest.join("-") };
    });
    deleteTargets.mutate(
      { ruleId: rule.id, targets: items },
      {
        onSuccess: () => {
          toast.success(
            t("admin.alerts.rules.toast.targetBatchDeleted", {
              count: items.length,
            }),
          );
          setCheckedKeys(new Set());
        },
        onError: (err) => {
          toast.error(
            err.message || t("admin.alerts.rules.toast.targetDeleteFailed"),
          );
        },
      },
    );
  };

  const canAdd = targetType === "global" || selectedIds.length > 0;

  const selectorItems = useMemo(() => {
    if (targetType === "server") {
      return servers.map((s) => ({ id: s.uuid, name: s.name }));
    }
    if (targetType === "group") {
      return groups.map((g) => ({ id: g.id, name: g.name }));
    }
    return [];
  }, [targetType, servers, groups]);

  const hasWhitelist = sortedTypes(grouped.whitelist).length > 0;
  const hasBlacklist = sortedTypes(grouped.blacklist).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("admin.alerts.rules.targets.title")} - {rule?.name}
          </DialogTitle>
          <DialogDescription>
            {t("admin.alerts.rules.targets.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Add form */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">
                {t("admin.alerts.rules.targets.targetType")}
              </Label>
              <Select value={targetType} onValueChange={handleTargetTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPES.map((tt) => (
                    <SelectItem key={tt} value={tt}>
                      {t(`admin.alerts.rules.targets.${tt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                {t("admin.alerts.rules.targets.mode")}
              </Label>
              <Select value={isExclude} onValueChange={setIsExclude}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    {t("admin.alerts.rules.targets.include")}
                  </SelectItem>
                  <SelectItem value="1">
                    {t("admin.alerts.rules.targets.exclude")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target selector — only for server/group */}
          {targetType !== "global" && (
            <div className="space-y-1">
              <Label className="text-xs">
                {t("admin.alerts.rules.targets.selectTargets")}
              </Label>
              <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={selectorOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate text-muted-foreground">
                      {selectedIds.length > 0
                        ? t("admin.alerts.rules.targets.selectedCount", {
                            count: selectedIds.length,
                          })
                        : t("admin.alerts.rules.targets.searchPlaceholder")}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder={t(
                        "admin.alerts.rules.targets.searchPlaceholder",
                      )}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t("admin.alerts.rules.targets.noResults")}
                      </CommandEmpty>
                      <CommandGroup>
                        {selectorItems.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.name}
                            onSelect={() => toggleId(item.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedIds.includes(item.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span>{item.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground font-mono">
                              {item.id.length > 12
                                ? `${item.id.slice(0, 8)}…`
                                : item.id}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected tags */}
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedIds.map((id) => {
                    const nameMap =
                      targetType === "server" ? serverNameMap : groupNameMap;
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {nameMap.get(id) ?? id}
                        <button
                          type="button"
                          className="ml-0.5 rounded-full outline-none hover:bg-muted-foreground/20"
                          onClick={() => removeId(id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <Button
            size="sm"
            onClick={handleAdd}
            disabled={createTargets.isPending || !canAdd}
            className="w-full"
          >
            {t("admin.alerts.rules.targets.add")}
          </Button>
        </div>

        <Separator />

        {/* Targets display */}
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t("common.loading")}
          </div>
        ) : !hasWhitelist && !hasBlacklist ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t("admin.alerts.rules.targets.empty")}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Whitelist section */}
            <TargetSection
              icon={<Shield className="h-4 w-4 text-green-500" />}
              title={t("admin.alerts.rules.targets.whitelist")}
              groups={grouped.whitelist}
              sortedTypes={sortedTypes(grouped.whitelist)}
              resolveTargetName={resolveTargetName}
              onDelete={handleDelete}
              emptyText={t("admin.alerts.rules.targets.emptyWhitelist")}
              t={t}
              checkedKeys={checkedKeys}
              onToggleCheck={toggleCheck}
              onToggleCheckGroup={toggleCheckGroup}
            />

            {/* Blacklist section */}
            <TargetSection
              icon={<ShieldOff className="h-4 w-4 text-red-500" />}
              title={t("admin.alerts.rules.targets.blacklist")}
              groups={grouped.blacklist}
              sortedTypes={sortedTypes(grouped.blacklist)}
              resolveTargetName={resolveTargetName}
              onDelete={handleDelete}
              emptyText={t("admin.alerts.rules.targets.emptyBlacklist")}
              t={t}
              checkedKeys={checkedKeys}
              onToggleCheck={toggleCheck}
              onToggleCheckGroup={toggleCheckGroup}
            />

            {/* Batch delete bar */}
            {checkedKeys.size > 0 && (
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {t("admin.alerts.rules.targets.batchSelected", {
                    count: checkedKeys.size,
                  })}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBatchDelete}
                  disabled={deleteTargets.isPending}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {t("admin.alerts.rules.targets.batchDelete", {
                    count: checkedKeys.size,
                  })}
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("admin.alerts.rules.targets.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TargetSection({
  icon,
  title,
  groups,
  sortedTypes,
  resolveTargetName,
  onDelete,
  emptyText,
  t,
  checkedKeys,
  onToggleCheck,
  onToggleCheckGroup,
}: {
  icon: React.ReactNode;
  title: string;
  groups: Record<string, RuleTargetRead[]>;
  sortedTypes: string[];
  resolveTargetName: (type: string, id: string) => string;
  onDelete: (type: string, id: string) => void;
  emptyText: string;
  t: (key: string) => string;
  checkedKeys: Set<string>;
  onToggleCheck: (key: string) => void;
  onToggleCheckGroup: (targets: RuleTargetRead[], checked: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-medium text-sm">
        {icon}
        {title}
      </div>
      {sortedTypes.length === 0 ? (
        <p className="text-xs text-muted-foreground pl-6">{emptyText}</p>
      ) : (
        <div className="space-y-2 pl-6">
          {sortedTypes.map((type) => {
            const groupTargets = groups[type];
            const allChecked = groupTargets.every((tg) =>
              checkedKeys.has(`${tg.target_type}-${tg.target_id}`),
            );
            const someChecked =
              !allChecked &&
              groupTargets.some((tg) =>
                checkedKeys.has(`${tg.target_type}-${tg.target_id}`),
              );

            return (
              <div key={type} className="rounded-md border">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 text-xs font-medium border-b">
                  <Checkbox
                    checked={
                      allChecked ? true : someChecked ? "indeterminate" : false
                    }
                    onCheckedChange={(checked) =>
                      onToggleCheckGroup(groupTargets, !!checked)
                    }
                  />
                  <span>{t(`admin.alerts.rules.targets.${type}`)}</span>
                  <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                    {groupTargets.length}
                  </Badge>
                </div>
                <div className="divide-y">
                  {groupTargets.map((target) => {
                    const key = `${target.target_type}-${target.target_id}`;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between px-3 py-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox
                            checked={checkedKeys.has(key)}
                            onCheckedChange={() => onToggleCheck(key)}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm truncate">
                              {resolveTargetName(
                                target.target_type,
                                target.target_id,
                              )}
                            </span>
                            {target.target_type !== "global" &&
                              resolveTargetName(
                                target.target_type,
                                target.target_id,
                              ) !== target.target_id && (
                                <span className="text-xs text-muted-foreground font-mono truncate">
                                  {target.target_id}
                                </span>
                              )}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 text-destructive"
                          onClick={() =>
                            onDelete(target.target_type, target.target_id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
