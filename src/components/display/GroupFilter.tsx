import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { PublicGroup } from "@/types/server";

interface GroupFilterProps {
  groups: PublicGroup[];
  activeGroupId: string | null;
  onGroupChange: (groupId: string | null) => void;
}

export function GroupFilter({
  groups,
  activeGroupId,
  onGroupChange,
}: GroupFilterProps) {
  const { t } = useTranslation();

  const sortedGroups = [...groups].sort(
    (a, b) => b.top - a.top || a.name.localeCompare(b.name)
  );

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <FilterButton
        active={activeGroupId === null}
        onClick={() => onGroupChange(null)}
      >
        {t("display.groups.all")}
      </FilterButton>
      {sortedGroups.map((group) => (
        <FilterButton
          key={group.id}
          active={activeGroupId === group.id}
          onClick={() => onGroupChange(group.id)}
        >
          {group.name}
        </FilterButton>
      ))}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {children}
    </button>
  );
}
