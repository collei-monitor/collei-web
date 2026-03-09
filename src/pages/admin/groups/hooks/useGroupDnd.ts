import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBatchUpdateGroupTops, useUpdateGroup } from "@/services/servers";
import type { GroupWithServers } from "@/types/server";

export function useGroupDnd(sortedGroups: GroupWithServers[]) {
  const { t } = useTranslation();
  const batchUpdateTops = useBatchUpdateGroupTops();
  const updateGroup = useUpdateGroup();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedGroups.findIndex((g) => g.id === active.id);
      const newIndex = sortedGroups.findIndex((g) => g.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...sortedGroups];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const updates: Record<string, number> = {};

      if (newIndex === 0) {
        const firstTop = reordered[1]?.top ?? 1;
        updates[moved.id] = firstTop - 1;
      } else {
        const prevTop = reordered[newIndex - 1].top;
        const movedTop = prevTop + 1;
        updates[moved.id] = movedTop;

        for (let i = newIndex + 1; i < reordered.length; i++) {
          const g = reordered[i];
          const expectedTop = movedTop + (i - newIndex);
          if (g.top < expectedTop) {
            updates[g.id] = expectedTop;
          } else {
            break;
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        batchUpdateTops.mutate(updates);
      }
    },
    [sortedGroups, batchUpdateTops],
  );

  const handleResetSort = useCallback(() => {
    const updates: Record<string, number> = {};
    sortedGroups.forEach((g, i) => {
      updates[g.id] = i + 1;
    });
    if (Object.keys(updates).length === 0) return;

    const toastId = toast.loading(t("admin.groups.toast.sortResetting"));
    batchUpdateTops.mutate(updates, {
      onSuccess: () => {
        toast.success(t("admin.groups.toast.sortResetSuccess"), { id: toastId });
      },
      onError: () => {
        toast.error(t("admin.groups.toast.sortResetFailed"), { id: toastId });
      },
    });
  }, [sortedGroups, batchUpdateTops, t]);

  const handleSortCommit = useCallback(
    (id: string, top: number) => {
      updateGroup.mutate({ id, payload: { top } });
    },
    [updateGroup],
  );

  return {
    sensors,
    handleDragEnd,
    handleResetSort,
    handleSortCommit,
    isUpdating: batchUpdateTops.isPending || updateGroup.isPending,
  };
}
