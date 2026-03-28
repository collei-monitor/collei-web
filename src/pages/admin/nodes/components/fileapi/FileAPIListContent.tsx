import type { FileEntry } from "@/types/fileapi";
import { Button } from "@/components/ui/button";
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  File,
  FileSymlink,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

interface FileAPIListContentProps {
  entries: FileEntry[];
  isLoading: boolean;
  isMobile: boolean;
  onEntryClick: (entry: FileEntry) => void;
  onEdit: (entry: FileEntry) => void;
  onRename: (entry: FileEntry) => void;
  onDelete: (entry: FileEntry) => void;
  t: (key: string) => string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

const fileTypeIcon = (entry: FileEntry) => {
  if (entry.type === "dir") return <Folder className="h-4 w-4 text-blue-500" />;
  if (entry.type === "link") {
    return <FileSymlink className="h-4 w-4 text-purple-500" />;
  }
  return <File className="h-4 w-4 text-muted-foreground" />;
};

export function FileAPIListContent({
  entries,
  isLoading,
  isMobile,
  onEntryClick,
  onEdit,
  onRename,
  onDelete,
  t,
}: FileAPIListContentProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("fileapi.empty")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={isMobile ? "w-[60%]" : "w-[40%]"}>
            {t("common.name")}
          </TableHead>
          <TableHead className={isMobile ? "w-[25%]" : "w-[15%]"}>
            {t("fileapi.table.size")}
          </TableHead>
          {!isMobile && (
            <TableHead className="w-[15%]">{t("fileapi.table.permissions")}</TableHead>
          )}
          {!isMobile && (
            <TableHead className="w-[20%]">{t("fileapi.table.modified")}</TableHead>
          )}
          {isMobile && <TableHead className="w-[15%]"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const row = (
            <TableRow
              key={entry.name}
              className={entry.type === "dir" ? "cursor-pointer" : ""}
              onDoubleClick={() => {
                if (entry.type === "file") {
                  onEdit(entry);
                  return;
                }
                onEntryClick(entry);
              }}
            >
              <TableCell>
                <div
                  className="flex items-center gap-2"
                  role={entry.type === "dir" ? "button" : undefined}
                  onClick={() => onEntryClick(entry)}
                >
                  {fileTypeIcon(entry)}
                  <span
                    className={`truncate ${entry.type === "dir" ? "font-medium" : ""}`}
                  >
                    {entry.name}
                  </span>
                  {entry.type === "link" && entry.link_target && (
                    <span className="text-xs text-muted-foreground">
                      → {entry.link_target}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {entry.type === "dir" ? "—" : formatFileSize(entry.size)}
              </TableCell>
              {!isMobile && (
                <TableCell>
                  <code className="text-xs">{entry.permissions}</code>
                </TableCell>
              )}
              {!isMobile && (
                <TableCell className="text-muted-foreground text-xs">
                  {formatTime(entry.mtime)}
                </TableCell>
              )}
              {isMobile && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {entry.type === "file" && (
                        <DropdownMenuItem onClick={() => onEdit(entry)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onRename(entry)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("fileapi.actions.rename")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(entry)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          );

          if (!isMobile) {
            return (
              <ContextMenu key={entry.name}>
                <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
                <ContextMenuContent>
                  {entry.type === "file" && (
                    <ContextMenuItem onClick={() => onEdit(entry)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("common.edit")}
                    </ContextMenuItem>
                  )}
                  <ContextMenuItem onClick={() => onRename(entry)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("fileapi.actions.rename")}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    variant="destructive"
                    onClick={() => onDelete(entry)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("common.delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          }

          return row;
        })}
      </TableBody>
    </Table>
  );
}
