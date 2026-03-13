import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NumberInput({
  id,
  label,
  description,
  unit,
  min,
  value,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  unit?: string;
  min?: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex items-center gap-2 max-w-xs">
        <Input
          id={id}
          type="number"
          min={min ?? 1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
        {unit && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
