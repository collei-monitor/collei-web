import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RANDOM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => RANDOM_CHARS[b % RANDOM_CHARS.length]).join("");
}

export function TextConfigField({
  configKey,
  label,
  description,
  placeholder,
  currentValue,
  secret,
  generateRandom,
  onSave,
  saving,
}: {
  configKey: string;
  label: string;
  description?: string;
  placeholder?: string;
  currentValue: string | null | undefined;
  secret?: boolean;
  generateRandom?: boolean;
  onSave: (key: string, value: string) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentValue ?? "");
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDirty = value !== (currentValue ?? "");

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={configKey}>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={configKey}
            type={secret && !showSecret ? "password" : "text"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={secret ? "pr-20" : undefined}
          />
          {secret && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowSecret((v) => !v)}
                tabIndex={-1}
              >
                {showSecret ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                tabIndex={-1}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}
        </div>
        {generateRandom && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setValue(generateRandomString(16))}
            tabIndex={-1}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          disabled={!isDirty || saving || !value.trim()}
          onClick={() => onSave(configKey, value.trim())}
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-1.5">{t("settings.action.save")}</span>
        </Button>
      </div>
    </div>
  );
}
