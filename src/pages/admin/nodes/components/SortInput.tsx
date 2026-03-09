import { useState } from "react";
import { Input } from "@/components/ui/input";

export function SortInput({
  value,
  onCommit,
  disabled,
}: {
  value: number;
  onCommit: (v: number) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(String(value));
  const [editing, setEditing] = useState(false);

  const handleBlur = () => {
    setEditing(false);
    const num = parseInt(local, 10);
    if (!isNaN(num) && num !== value) {
      onCommit(num);
    } else {
      setLocal(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      setLocal(String(value));
      setEditing(false);
    }
  };

  return (
    <Input
      type="number"
      className="h-7 w-16 text-center text-xs tabular-nums"
      value={editing ? local : String(value)}
      disabled={disabled}
      onFocus={() => {
        setEditing(true);
        setLocal(String(value));
      }}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
