import * as Flags from "country-flag-icons/react/3x2";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type FlagComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type FlagSize = "xs" | "sm" | "md" | "lg";

interface FlagIconProps {
  region: string | null;
  size?: FlagSize;
  className?: string;
}

const SIZE_MAP: Record<FlagSize, string> = {
  xs: "h-3 w-4",
  sm: "h-4 w-5",
  md: "h-5 w-6",
  lg: "h-6 w-8",
};

/** 将国家代码渲染为 SVG 旗帜，null 或未知代码显示地球图标 */
export function FlagIcon({ region, size = "sm", className }: FlagIconProps) {
  const sizeClass = SIZE_MAP[size];

  if (!region) {
    return (
      <Globe
        className={cn(sizeClass, "text-muted-foreground", className)}
      />
    );
  }

  const code = region.toUpperCase();
  const Flag = (Flags as Record<string, FlagComponent>)[code];

  if (!Flag) {
    return (
      <Globe
        className={cn(sizeClass, "text-muted-foreground", className)}
      />
    );
  }

  return (
    <Flag
      className={cn("inline-block rounded-sm object-cover", sizeClass, className)}
      aria-label={code}
    />
  );
}
