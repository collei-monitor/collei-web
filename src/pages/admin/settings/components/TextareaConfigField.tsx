import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextareaConfigField({
  configKey,
  label,
  description,
  placeholder,
  currentValue,
  onSave,
  saving,
  rows,
}: {
  configKey: string;
  label: string;
  description?: string;
  placeholder?: string;
  currentValue: string | null | undefined;
  onSave: (key: string, value: string) => void;
  saving: boolean;
  rows?: number;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentValue ?? "");

  const isDirty = value !== (currentValue ?? "");

  return (
    <div className="space-y-2">
      <Label htmlFor={configKey}>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Textarea
        id={configKey}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows ?? 3}
        className="font-mono text-sm h-40 min-h-20 resize-y"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!isDirty || saving}
          onClick={() => onSave(configKey, value.trim())}
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-1.5">{t("common.save")}</span>
        </Button>
      </div>
    </div>
  );
}
