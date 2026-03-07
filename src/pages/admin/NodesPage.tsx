import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  useServers,
  useUpdateServer,
  useDeleteServer,
  useApproveServer,
  useSetServerGroups,
  useGroups,
  useBatchUpdateTops,
} from "@/services/servers";
import type { Server, UpdateServerPayload } from "@/types/server";
import { ServerApproval, ServerVisibility } from "@/types/server";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Tags,
  ListRestart,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── 排序输入组件 ──────────────────────────────────────────────────────────────

function SortInput({
  value,
  onCommit,
  disabled,
}: {
  value: number;
  onCommit: (v: number) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(String(value));
  const [editing, setEditing] = useState(false);

  const handleBlur = () => {
    setEditing(false);
    const num = parseInt(local, 10);
    if (!isNaN(num) && num !== value) {
      onCommit(num);
    } else {
      setLocal(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      setLocal(String(value));
      setEditing(false);
    }
  };

  return (
    <Input
      type="number"
      className="h-7 w-16 text-center text-xs tabular-nums"
      value={editing ? local : String(value)}
      disabled={disabled}
      onFocus={() => {
        setEditing(true);
        setLocal(String(value));
      }}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}

// ── 状态徽章 ──────────────────────────────────────────────────────────────────

function StatusBadge({ server }: { server: Server }) {
  const { t } = useTranslation();

  if (server.is_approved === ServerApproval.PENDING) {
    return <Badge variant="outline">{t("admin.nodes.status.pending")}</Badge>;
  }
  if (server.status === 1) {
    return (
      <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
        {t("admin.nodes.status.online")}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
      {t("admin.nodes.status.offline")}
    </Badge>
  );
}

// ── 编辑对话框 ────────────────────────────────────────────────────────────────

function EditServerDialog({
  server,
  open,
  onOpenChange,
}: {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const updateServer = useUpdateServer();

  const [form, setForm] = useState<UpdateServerPayload>(() =>
    server
      ? {
          name: server.name,
          region: server.region ?? "",
          top: server.top,
          hidden: server.hidden,
        }
      : {},
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) return;
    updateServer.mutate(
      { uuid: server.uuid, payload: form },
      { onSuccess: () => onOpenChange(false) },
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
            <Label htmlFor="edit-name">{t("admin.nodes.edit.name")}</Label>
            <Input
              id="edit-name"
              value={form.name ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-region">{t("admin.nodes.edit.region")}</Label>
            <Input
              id="edit-region"
              value={form.region ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, region: e.target.value }))
              }
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
              <Label htmlFor="edit-hidden">
                {t("admin.nodes.edit.visibility")}
              </Label>
              <select
                id="edit-hidden"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.hidden ?? 0}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    hidden: parseInt(e.target.value, 10),
                  }))
                }
              >
                <option value={0}>{t("admin.nodes.visible")}</option>
                <option value={1}>{t("admin.nodes.hidden")}</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("admin.nodes.edit.cancel")}
            </Button>
            <Button type="submit" disabled={updateServer.isPending}>
              {updateServer.isPending
                ? t("common.loading")
                : t("admin.nodes.edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── 分组管理对话框 ────────────────────────────────────────────────────────────

function GroupsDialog({
  server,
  open,
  onOpenChange,
}: {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data: allGroups = [] } = useGroups();
  const setServerGroups = useSetServerGroups();

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    server ? server.groups.map((g) => g.id) : [],
  );

  const toggleGroup = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    if (!server) return;
    setServerGroups.mutate(
      { uuid: server.uuid, payload: { group_ids: selectedIds } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.nodes.groups.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.nodes.groups.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {allGroups.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("admin.nodes.groups.empty")}
            </p>
          )}
          {allGroups.map((group) => (
            <label
              key={group.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
            >
              <input
                type="checkbox"
                className="accent-primary"
                checked={selectedIds.includes(group.id)}
                onChange={() => toggleGroup(group.id)}
              />
              <span className="text-sm">{group.name}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("admin.nodes.groups.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={setServerGroups.isPending}>
            {setServerGroups.isPending
              ? t("common.loading")
              : t("admin.nodes.groups.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 删除确认对话框 ────────────────────────────────────────────────────────────

function DeleteServerDialog({
  server,
  open,
  onOpenChange,
}: {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const deleteServer = useDeleteServer();

  const handleDelete = () => {
    if (!server) return;
    deleteServer.mutate(server.uuid, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.nodes.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.nodes.delete.description", { name: server?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("admin.nodes.delete.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteServer.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteServer.isPending
              ? t("common.loading")
              : t("admin.nodes.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── 操作下拉菜单 ──────────────────────────────────────────────────────────────

function ServerActions({
  server,
  onEdit,
  onDelete,
  onGroups,
}: {
  server: Server;
  onEdit: (s: Server) => void;
  onDelete: (s: Server) => void;
  onGroups: (s: Server) => void;
}) {
  const { t } = useTranslation();
  const approveServer = useApproveServer();
  const updateServer = useUpdateServer();

  const isPending = server.is_approved === ServerApproval.PENDING;
  const isHidden = server.hidden === ServerVisibility.HIDDEN;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t("admin.nodes.actions.open")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isPending && (
          <DropdownMenuItem
            onClick={() => approveServer.mutate(server.uuid)}
            disabled={approveServer.isPending}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {t("admin.nodes.actions.approve")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onEdit(server)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("admin.nodes.actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onGroups(server)}>
          <Tags className="mr-2 h-4 w-4" />
          {t("admin.nodes.actions.groups")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            updateServer.mutate({
              uuid: server.uuid,
              payload: { hidden: isHidden ? 0 : 1 },
            })
          }
        >
          {isHidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              {t("admin.nodes.actions.show")}
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              {t("admin.nodes.actions.hide")}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(server)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("admin.nodes.actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── 可拖拽表格行 ──────────────────────────────────────────────────────────────

function SortableRow({
  server,
  onSortCommit,
  sortDisabled,
  onEdit,
  onDelete,
  onGroups,
}: {
  server: Server;
  onSortCommit: (uuid: string, top: number) => void;
  sortDisabled: boolean;
  onEdit: (s: Server) => void;
  onDelete: (s: Server) => void;
  onGroups: (s: Server) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: server.uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={
        server.hidden === ServerVisibility.HIDDEN ? "opacity-50" : ""
      }
    >
      {/* 拖动手柄 */}
      <TableCell>
        <button
          type="button"
          className="cursor-grab touch-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>

      {/* 排序值 */}
      <TableCell>
        <SortInput
          value={server.top}
          onCommit={(v) => onSortCommit(server.uuid, v)}
          disabled={sortDisabled}
        />
      </TableCell>

      {/* 服务器名称 */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>{server.name}</span>
          {server.hidden === ServerVisibility.HIDDEN && (
            <Tooltip>
              <TooltipTrigger>
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                {t("admin.nodes.hidden")}
              </TooltipContent>
            </Tooltip>
          )}
          {server.is_approved === ServerApproval.PENDING && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {t("admin.nodes.status.pending")}
            </Badge>
          )}
        </div>
        {server.region && (
          <span className="text-xs text-muted-foreground">
            {server.region}
          </span>
        )}
      </TableCell>

      {/* IP 地址 */}
      <TableCell>
        <div className="space-y-0.5">
          {server.ipv4 && (
            <div className="text-xs font-mono">{server.ipv4}</div>
          )}
          {server.ipv6 && (
            <div className="text-xs font-mono text-muted-foreground">
              {server.ipv6}
            </div>
          )}
          {!server.ipv4 && !server.ipv6 && (
            <span className="text-xs text-muted-foreground">
              —
            </span>
          )}
        </div>
      </TableCell>

      {/* 分组 */}
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {server.groups.length > 0 ? (
            server.groups.map((g) => (
              <Badge
                key={g.id}
                variant="secondary"
                className="text-xs"
              >
                {g.name}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              —
            </span>
          )}
        </div>
      </TableCell>

      {/* 状态 */}
      <TableCell>
        <StatusBadge server={server} />
      </TableCell>

      {/* 操作 */}
      <TableCell>
        <ServerActions
          server={server}
          onEdit={onEdit}
          onDelete={onDelete}
          onGroups={onGroups}
        />
      </TableCell>
    </TableRow>
  );
}

// ── 表格骨架屏 ────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-5 w-5" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────────

export default function NodesPage() {
  const { t } = useTranslation();
  const { data: servers = [], isLoading, isError, refetch } = useServers();
  const updateServer = useUpdateServer();
  const batchUpdateTops = useBatchUpdateTops();

  // 对话框状态
  const [editTarget, setEditTarget] = useState<Server | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Server | null>(null);
  const [groupsTarget, setGroupsTarget] = useState<Server | null>(null);

  // 排序提交
  const handleSortCommit = useCallback(
    (uuid: string, top: number) => {
      updateServer.mutate({ uuid, payload: { top } });
    },
    [updateServer],
  );

  // 按 top 排序（值越小越靠前）
  const sortedServers = [...servers].sort((a, b) => a.top - b.top);

  // dnd-kit 传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // 拖拽结束处理
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedServers.findIndex((s) => s.uuid === active.id);
      const newIndex = sortedServers.findIndex((s) => s.uuid === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // 重新排列
      const reordered = [...sortedServers];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // 计算拖动元素的新 top 值：取目标位置前一个元素的 top + 1（如果拒到第一位则取第二个的 top - 1）
      // 然后将目标位置及之后的元素 top 全部加 1
      const updates: Record<string, number> = {};

      if (newIndex === 0) {
        // 拖到最前面
        const firstTop = reordered[1]?.top ?? 1;
        const movedTop = firstTop - 1;
        updates[moved.uuid] = movedTop;
      } else {
        // 拖到中间或末尾
        const prevTop = reordered[newIndex - 1].top;
        const movedTop = prevTop + 1;
        updates[moved.uuid] = movedTop;

        // 将 newIndex 之后的所有元素（不包括 moved 本身）的 top 值在原值基础上确保不会冲突
        for (let i = newIndex + 1; i < reordered.length; i++) {
          const s = reordered[i];
          const expectedTop = movedTop + (i - newIndex);
          if (s.top < expectedTop) {
            updates[s.uuid] = expectedTop;
          } else {
            break; // 后面的已经足够大，无需调整
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        batchUpdateTops.mutate(updates);
      }
    },
    [sortedServers, batchUpdateTops],
  );

  // 重置排序
  const handleResetSort = useCallback(() => {
    const updates: Record<string, number> = {};
    sortedServers.forEach((s, i) => {
      updates[s.uuid] = i + 1;
    });
    if (Object.keys(updates).length > 0) {
      batchUpdateTops.mutate(updates);
    }
  }, [sortedServers, batchUpdateTops]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.nodes.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.nodes.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetSort}
                disabled={batchUpdateTops.isPending || sortedServers.length === 0}
              >
                <ListRestart className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.nodes.resetSort")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("admin.nodes.refresh")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Separator />

      {/* 错误提示 */}
      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.nodes.fetchError")}
        </div>
      )}

      {/* 数据表格 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="w-20">
                  {t("admin.nodes.table.sort")}
                </TableHead>
                <TableHead>{t("admin.nodes.table.name")}</TableHead>
                <TableHead>{t("admin.nodes.table.ip")}</TableHead>
                <TableHead>{t("admin.nodes.table.groups")}</TableHead>
                <TableHead>{t("admin.nodes.table.status")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>

            {isLoading ? (
              <TableSkeleton />
            ) : (
              <TableBody>
                {sortedServers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {t("admin.nodes.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  <SortableContext
                    items={sortedServers.map((s) => s.uuid)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedServers.map((server) => (
                      <SortableRow
                        key={server.uuid}
                        server={server}
                        onSortCommit={handleSortCommit}
                        sortDisabled={updateServer.isPending}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                        onGroups={setGroupsTarget}
                      />
                    ))}
                  </SortableContext>
                )}
              </TableBody>
            )}
          </Table>
        </div>
      </DndContext>

      {/* 对话框 */}
      <EditServerDialog
        key={editTarget?.uuid}
        server={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      />
      <DeleteServerDialog
        server={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      />
      <GroupsDialog
        key={groupsTarget?.uuid}
        server={groupsTarget}
        open={!!groupsTarget}
        onOpenChange={(v) => !v && setGroupsTarget(null)}
      />
    </div>
  );
}
