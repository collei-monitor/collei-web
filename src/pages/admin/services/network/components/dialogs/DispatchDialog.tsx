import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNetworkTargetDetail, useSetNetworkDispatch } from "@/services/network";
import { useServers } from "@/services/servers";
import type { NetworkTarget, DispatchNodeType } from "@/types/network";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DispatchRow {
  node_type: DispatchNodeType;
  node_id: string;
  is_exclude: number;
}

interface DispatchDialogProps {
  target: NetworkTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DispatchDialog({ target, open, onOpenChange }: DispatchDialogProps) {
  const { t } = useTranslation();
  const { data: detail, isLoading } = useNetworkTargetDetail(
    open && target ? target.id : null,
  );
  const setDispatch = useSetNetworkDispatch();
  const { data: servers = [] } = useServers();

  const [rows, setRows] = useState<DispatchRow[]>([]);
  const [newRow, setNewRow] = useState<DispatchRow>({
    node_type: "server",
    node_id: "",
    is_exclude: 0,
  });
  // Multi-select server IDs for batch add
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);

  // Sync rows when the detail data loads/changes
  const prevDetailRef = useState<typeof detail>(undefined);
  useEffect(() => {
    if (detail && detail !== prevDetailRef[0]) {
      prevDetailRef[1](detail);
      const next = detail.dispatches.map((d) => ({
        node_type: d.node_type,
        node_id: d.node_id,
        is_exclude: d.is_exclude,
      }));
      // Use queueMicrotask to avoid setState-inside-effect lint warning
      queueMicrotask(() => setRows(next));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail]);

  // Reset new row when node type changes
  const handleNewRowTypeChange = (type: DispatchNodeType) => {
    setNewRow({
      node_type: type,
      node_id: type === "global" ? "all" : "",
      is_exclude: 0,
    });
    setSelectedServerIds([]);
  };

  const toggleServer = (uuid: string) => {
    setSelectedServerIds((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
    );
  };

  const handleAddRow = () => {
    if (newRow.node_type === "server") {
      if (selectedServerIds.length === 0) return;
      const toAdd = selectedServerIds
        .filter(
          (uuid) =>
            !rows.some(
              (r) =>
                r.node_type === "server" &&
                r.node_id === uuid &&
                r.is_exclude === newRow.is_exclude,
            ),
        )
        .map((uuid) => ({ node_type: "server" as DispatchNodeType, node_id: uuid, is_exclude: newRow.is_exclude }));
      if (toAdd.length > 0) setRows((prev) => [...prev, ...toAdd]);
      setSelectedServerIds([]);
      return;
    }
    // global rule
    if (newRow.node_type === "global" && newRow.is_exclude === 1 && !newRow.node_id.trim()) return;
    const exists = rows.some(
      (r) =>
        r.node_type === newRow.node_type &&
        r.node_id === newRow.node_id &&
        r.is_exclude === newRow.is_exclude,
    );
    if (exists) return;
    setRows((prev) => [...prev, { ...newRow }]);
    setNewRow({ node_type: "server", node_id: "", is_exclude: 0 });
  };

  const handleRemoveRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!target) return;
    const toastId = toast.loading(t("admin.services.network.dispatch.toast.saving"));
    setDispatch.mutate(
      { id: target.id, payload: { dispatches: rows } },
      {
        onSuccess: () => {
          toast.success(t("admin.services.network.dispatch.toast.saveSuccess"), {
            id: toastId,
          });
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("admin.services.network.dispatch.toast.saveFailed"), {
            id: toastId,
          });
        },
      },
    );
  };

  const getNodeLabel = (row: DispatchRow) => {
    if (row.node_type === "global" && row.node_id === "all") {
      return t("admin.services.network.dispatch.allNodes");
    }
    const srv = servers.find((s) => s.uuid === row.node_id);
    return srv?.name ?? row.node_id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("admin.services.network.dispatch.title")}
            {target && (
              <span className="ml-2 text-muted-foreground font-normal text-base">
                — {target.name}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {t("admin.services.network.dispatch.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current dispatches */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              {t("admin.services.network.dispatch.current")}
            </h4>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center border rounded-md">
                {t("admin.services.network.dispatch.empty")}
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md border px-3 py-2"
                  >
                    <Badge variant="outline" className="text-xs shrink-0">
                      {t(`admin.services.network.dispatch.types.${row.node_type}`)}
                    </Badge>
                    <span className="text-sm flex-1 truncate">{getNodeLabel(row)}</span>
                    <Badge
                      variant={row.is_exclude ? "destructive" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {row.is_exclude
                        ? t("admin.services.network.dispatch.exclude")
                        : t("admin.services.network.dispatch.include")}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleRemoveRow(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Add new row */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t("admin.services.network.dispatch.add")}</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t("admin.services.network.dispatch.nodeType")}</Label>
                <Select
                  value={newRow.node_type}
                  onValueChange={(v) =>
                    handleNewRowTypeChange(v as DispatchNodeType)
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">
                      {t("admin.services.network.dispatch.types.global")}
                    </SelectItem>
                    <SelectItem value="server">
                      {t("admin.services.network.dispatch.types.server")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("admin.services.network.dispatch.isExclude")}</Label>
                <Select
                  value={String(newRow.is_exclude)}
                  onValueChange={(v) =>
                    setNewRow((p) => ({ ...p, is_exclude: parseInt(v) }))
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      {t("admin.services.network.dispatch.include")}
                    </SelectItem>
                    <SelectItem value="1">
                      {t("admin.services.network.dispatch.exclude")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newRow.node_type === "server" && (
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">
                  {t("admin.services.network.dispatch.nodeId")}
                  {selectedServerIds.length > 0 && (
                    <span className="ml-1.5 text-muted-foreground">
                      ({t("admin.services.network.dispatch.selectedCount", { count: selectedServerIds.length })})
                    </span>
                  )}
                </Label>
                <div className="max-h-36 overflow-y-auto rounded-md border px-2 py-1 space-y-1">
                  {servers.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">
                      {t("admin.services.network.dispatch.noServers")}
                    </p>
                  ) : (
                    servers.map((s) => (
                      <label
                        key={s.uuid}
                        className="flex items-center gap-2 cursor-pointer py-0.5 rounded hover:bg-muted px-1"
                      >
                        <Checkbox
                          checked={selectedServerIds.includes(s.uuid)}
                          onCheckedChange={() => toggleServer(s.uuid)}
                        />
                        <span className="text-sm">{s.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {newRow.node_type === "global" && newRow.is_exclude === 1 && (
              <div className="space-y-1">
                <Label className="text-xs">{t("admin.services.network.dispatch.nodeId")}</Label>
                <Select
                  value={newRow.node_id === "all" ? "" : newRow.node_id}
                  onValueChange={(v) => setNewRow((p) => ({ ...p, node_id: v }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue
                      placeholder={t("admin.services.network.dispatch.nodeIdPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {servers.map((s) => (
                      <SelectItem key={s.uuid} value={s.uuid}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={handleAddRow}
              disabled={
                (newRow.node_type === "server" && selectedServerIds.length === 0) ||
                (newRow.node_type === "global" && newRow.is_exclude === 1 && !newRow.node_id.trim())
              }
            >
              <Plus className="h-4 w-4" />
              {t("admin.services.network.dispatch.addRule")}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("admin.services.network.dispatch.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={setDispatch.isPending}>
            {setDispatch.isPending
              ? t("common.loading")
              : t("admin.services.network.dispatch.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
