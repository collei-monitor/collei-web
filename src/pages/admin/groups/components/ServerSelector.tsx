import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useServers } from "@/services/servers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface ServerSelectorProps {
  selectedServerUuids: string[];
  onSelectionChange: (uuids: string[]) => void;
}

export function ServerSelector({
  selectedServerUuids,
  onSelectionChange,
}: ServerSelectorProps) {
  const { t } = useTranslation();
  const { data: servers = [], isLoading } = useServers();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter servers by search query
  const filteredServers = useMemo(() => {
    if (!searchQuery.trim()) return servers;
    const query = searchQuery.toLowerCase();
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(query) ||
        server.uuid.toLowerCase().includes(query),
    );
  }, [servers, searchQuery]);

  const toggleServer = (uuid: string) => {
    onSelectionChange(
      selectedServerUuids.includes(uuid)
        ? selectedServerUuids.filter((id) => id !== uuid)
        : [...selectedServerUuids, uuid],
    );
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="server-search">{t("admin.groups.servers.search")}</Label>
      <Input
        id="server-search"
        placeholder={t("admin.groups.servers.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="text-sm text-muted-foreground">
        {t("admin.groups.servers.selectedCount", {
          count: selectedServerUuids.length,
        })}
      </div>

      <div className="max-h-64 overflow-y-auto border rounded-md p-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : filteredServers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {searchQuery
              ? t("admin.groups.servers.noResults")
              : t("admin.groups.servers.empty")}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredServers.map((server) => (
              <label
                key={server.uuid}
                className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
              >
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={selectedServerUuids.includes(server.uuid)}
                  onChange={() => toggleServer(server.uuid)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {server.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {server.uuid}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
