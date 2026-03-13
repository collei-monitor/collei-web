import { Skeleton } from "@/components/ui/skeleton";

export function ConfigSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
