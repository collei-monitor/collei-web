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
import { useBatchUpdateTops } from "@/services/servers";
import type { Server } from "@/types/server";

export function useNodeDnd(sortedServers: Server[]) {
  const { t } = useTranslation();
  const batchUpdateTops = useBatchUpdateTops();

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

      const oldIndex = sortedServers.findIndex((s) => s.uuid === active.id);
      const newIndex = sortedServers.findIndex((s) => s.uuid === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...sortedServers];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

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

        // 将 newIndex 之后的元素 top 值确保不冲突
        for (let i = newIndex + 1; i < reordered.length; i++) {
          const s = reordered[i];
          const expectedTop = movedTop + (i - newIndex);
          if (s.top < expectedTop) {
            updates[s.uuid] = expectedTop;
          } else {
            break;
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        batchUpdateTops.mutate(updates);
      }
    },
    [sortedServers, batchUpdateTops],
  );

  const handleResetSort = useCallback(() => {
    const updates: Record<string, number> = {};
    sortedServers.forEach((s, i) => {
      updates[s.uuid] = i + 1;
    });
    if (Object.keys(updates).length > 0) {
      const toastId = toast.loading(t("admin.nodes.toast.sortResetting"));
      batchUpdateTops.mutate(updates, {
        onSuccess: () => {
          toast.success(t("admin.nodes.toast.sortResetSuccess"), { id: toastId });
        },
        onError: () => {
          toast.error(t("admin.nodes.toast.sortResetFailed"), { id: toastId });
        },
      });
    }
  }, [sortedServers, batchUpdateTops, t]);

  return {
    sensors,
    handleDragEnd,
    handleResetSort,
    isUpdating: batchUpdateTops.isPending,
  };
}
