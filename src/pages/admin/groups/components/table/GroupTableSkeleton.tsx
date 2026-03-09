import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

export function GroupTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-5 w-5" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
