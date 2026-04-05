import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import countries from "i18n-iso-countries";
import zhLocale from "i18n-iso-countries/langs/zh.json";
import enLocale from "i18n-iso-countries/langs/en.json";
import { useUpdateServer } from "@/services/servers";
import type { Server, UpdateServerPayload } from "@/types/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";import {
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
import { FlagIcon } from "@/components/FlagIcon";
import { ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

countries.registerLocale(zhLocale);
countries.registerLocale(enLocale);

// 预定义标签颜色
const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export function EditServerDialog({
  server,
  open,
  onOpenChange,
}: {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const updateServer = useUpdateServer();

  const [form, setForm] = useState<UpdateServerPayload>(() =>
    server
      ? {
          name: server.name,
          region: server.region ?? "",
          top: server.top,
          hidden: server.hidden,
          is_region_locked: server.is_region_locked,
          tags: server.tags ?? [],
          remark: server.remark ?? "",
          public_remark: server.public_remark ?? "",
        }
      : {},
  );

  const [regionOpen, setRegionOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // 构建国家/地区列表
  const lang = i18n.language.startsWith("zh") ? "zh" : "en";
  const countryList = useMemo(() => {
    const names = countries.getNames(lang);
    return Object.entries(names)
      .map(([code, name]) => ({ code, name: name as string }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [lang]);

  const selectedCountryName = useMemo(() => {
    if (!form.region) return "";
    const name = countries.getName(form.region, lang);
    return name ?? form.region;
  }, [form.region, lang]);

  const handleAddTag = useCallback(() => {
    const name = newTagName.trim();
    if (!name) return;
    const existing = form.tags ?? [];
    if (existing.some((tag) => tag.name === name)) return;
    setForm((p) => ({ ...p, tags: [...existing, { name, color: newTagColor }] }));
    setNewTagName("");
  }, [newTagName, newTagColor, form.tags]);

  const handleRemoveTag = useCallback((tagName: string) => {
    setForm((p) => ({
      ...p,
      tags: (p.tags ?? []).filter((tag) => tag.name !== tagName),
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) return;

    // Only submit fields that have been modified
    const diff: UpdateServerPayload = {};
    if (form.name !== server.name) diff.name = form.name;
    if (form.region !== (server.region ?? "")) diff.region = form.region;
    if (form.top !== server.top) diff.top = form.top;
    if (form.hidden !== server.hidden) diff.hidden = form.hidden;
    if (form.is_region_locked !== server.is_region_locked) diff.is_region_locked = form.is_region_locked;
    if (JSON.stringify(form.tags ?? []) !== JSON.stringify(server.tags ?? [])) diff.tags = form.tags;
    if (form.remark !== (server.remark ?? "")) diff.remark = form.remark;
    if (form.public_remark !== (server.public_remark ?? "")) diff.public_remark = form.public_remark;

    if (Object.keys(diff).length === 0) {
      onOpenChange(false);
      return;
    }

    const toastId = toast.loading(t("common.saving"));
    updateServer.mutate(
      { uuid: server.uuid, payload: diff },
      {
        onSuccess: () => {
          toast.success(t("admin.nodes.toast.editSuccess"), { id: toastId });
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("common.updateFailed"), { id: toastId });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.nodes.edit.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.nodes.edit.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t("common.name")}</Label>
            <Input
              id="edit-name"
              value={form.name ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* 区域选择 + 锁定 */}
          <div className="space-y-2">
            <Label>{t("admin.nodes.edit.region")}</Label>
            <div className="flex items-center gap-2">
              <Popover open={regionOpen} onOpenChange={setRegionOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={regionOpen}
                    className="flex-1 justify-between font-normal"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {form.region && (
                        <FlagIcon region={form.region} size="sm" />
                      )}
                      {selectedCountryName || t("admin.nodes.edit.regionPlaceholder")}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("admin.nodes.edit.regionSearch")} />
                    <CommandList>
                      <CommandEmpty>{t("admin.nodes.edit.regionEmpty")}</CommandEmpty>
                      <CommandGroup>
                        {countryList.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={`${c.code} ${c.name}`}
                            onSelect={() => {
                              setForm((p) => ({ ...p, region: c.code }));
                              setRegionOpen(false);
                            }}
                          >
                            <FlagIcon region={c.code} size="sm" />
                            <span className="ml-2">{c.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{c.code}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-1.5 shrink-0">
                <Checkbox
                  id="edit-region-locked"
                  checked={!!form.is_region_locked}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, is_region_locked: v ? 1 : 0 }))
                  }
                />
                <Label htmlFor="edit-region-locked" className="text-xs whitespace-nowrap cursor-pointer">
                  {t("admin.nodes.edit.lockRegion")}
                </Label>
              </div>
            </div>
          </div>

          {/* 标签编辑 */}
          <div className="space-y-2">
            <Label>{t("admin.nodes.edit.tags")}</Label>
            {(form.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(form.tags ?? []).map((tag) => (
                  <Badge
                    key={tag.name}
                    variant="secondary"
                    className="gap-1 pr-1"
                    style={{
                      backgroundColor: tag.color + "33",
                      color: tag.color,
                      borderColor: tag.color + "66",
                    }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      className="rounded-full hover:bg-foreground/10 p-0.5"
                      onClick={() => handleRemoveTag(tag.name)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t("admin.nodes.edit.tagPlaceholder")}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-md border shrink-0"
                    style={{ backgroundColor: newTagColor }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <div className="grid grid-cols-4 gap-1.5">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "h-6 w-6 rounded-md border-2 transition-all",
                          newTagColor === color
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105",
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 私人备注 */}
          <div className="space-y-2">
            <Label htmlFor="edit-remark">{t("admin.nodes.edit.remark")}</Label>
            <Textarea
              id="edit-remark"
              rows={2}
              value={form.remark ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
              placeholder={t("admin.nodes.edit.remarkPlaceholder")}
            />
          </div>

          {/* 公开备注 */}
          <div className="space-y-2">
            <Label htmlFor="edit-public-remark">{t("admin.nodes.edit.publicRemark")}</Label>
            <Textarea
              id="edit-public-remark"
              rows={2}
              value={form.public_remark ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, public_remark: e.target.value }))}
              placeholder={t("admin.nodes.edit.publicRemarkPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-top">{t("admin.nodes.edit.sort")}</Label>
              <Input
                id="edit-top"
                type="number"
                value={form.top ?? 0}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    top: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.nodes.edit.visibility")}</Label>
              <Select
                value={String(form.hidden ?? 0)}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, hidden: parseInt(v, 10) }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    {t("admin.nodes.visible")}
                  </SelectItem>
                  <SelectItem value="1">
                    {t("admin.nodes.hidden")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateServer.isPending}>
              {updateServer.isPending
                ? t("common.loading")
                : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
