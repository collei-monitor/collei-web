import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function maskToken(token: string) {
  if (token.length <= 8) return "••••••••";
  return token.slice(0, 4) + "••••••••" + token.slice(-4);
}

export function TokenDisplay({
  label,
  token,
}: {
  label: string;
  token: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono break-all">
          {visible ? token : maskToken(token)}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
