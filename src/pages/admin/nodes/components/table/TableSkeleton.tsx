import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

export function TableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="w-10 min-w-10 md:sticky md:left-0 md:z-10 md:bg-background">
            <Skeleton className="h-5 w-5" />
          </TableCell>
          <TableCell className="w-20 min-w-20 md:sticky md:left-10 md:z-10 md:bg-background">
            <Skeleton className="h-5 w-12" />
          </TableCell>
          <TableCell className="md:sticky md:left-30 md:z-10 md:bg-background">
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
          <TableCell className="md:sticky md:right-0 md:z-10 md:bg-background">
            <Skeleton className="h-5 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
