import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { useUpsertOIDC } from "@/services/oidc";
import type { OIDCProviderCreate, OIDCProviderRead } from "@/services/oidc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SUPPORTED_TYPES = [
  "discord",
  "facebook",
  "github",
  "gitlab",
  "google",
  "microsoft",
  "spotify",
  "twitter",
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 编辑模式时传入已有记录 */
  editing?: OIDCProviderRead | null;
}

export function OIDCProviderDialog({ open, onOpenChange, editing }: Props) {
  const { t } = useTranslation();
  const upsert = useUpsertOIDC();

  const [name, setName] = useState("");
  const [providerType, setProviderType] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [scope, setScope] = useState("");
  const [addition, setAddition] = useState("");

  // 当 open/editing 变化时同步表单状态（父组件通过 open prop 控制时 onOpenChange 不会触发）
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEditing, setPrevEditing] = useState(editing);
  if (open && (!prevOpen || editing !== prevEditing)) {
    if (editing) {
      setName(editing.name);
      setProviderType(editing.provider_type);
      setClientId(editing.client_id);
      setClientSecret("");
      setEnabled(editing.enabled === 1);
      setDisplayOrder(editing.display_order);
      setScope(editing.scope ?? "");
      setAddition(editing.addition ?? "");
    } else {
      setName("");
      setProviderType("");
      setClientId("");
      setClientSecret("");
      setEnabled(true);
      setDisplayOrder(0);
      setScope("");
      setAddition("");
    }
  }
  if (prevOpen !== open) setPrevOpen(open);
  if (prevEditing !== editing) setPrevEditing(editing);

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setName("");
      setProviderType("");
      setClientId("");
      setClientSecret("");
      setEnabled(true);
      setDisplayOrder(0);
      setScope("");
      setAddition("");
    }
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !providerType || !clientId.trim()) return;
    // 创建模式必须填密钥；编辑模式可以不填（保留原来的）
    if (!editing && !clientSecret.trim()) return;

    const payload: OIDCProviderCreate = {
      name: name.trim(),
      provider_type: providerType,
      client_id: clientId.trim(),
      client_secret: clientSecret.trim() || null,
      enabled: enabled ? 1 : 0,
      display_order: displayOrder,
      scope: scope.trim() || null,
      addition: addition.trim() || null,
    };

    const toastId = toast.loading(
      editing ? t("common.saving") : t("common.creating"),
    );

    upsert.mutate(payload, {
      onSuccess: () => {
        toast.success(
          editing
            ? t("admin.oidc.toast.updateSuccess")
            : t("admin.oidc.toast.createSuccess"),
          { id: toastId },
        );
        setName("");
        setProviderType("");
        setClientId("");
        setClientSecret("");
        setEnabled(true);
        setDisplayOrder(0);
        setScope("");
        setAddition("");
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t("common.updateFailed"), { id: toastId });
      },
    });
  };

  const isEdit = !!editing;
  const canSubmit =
    name.trim() !== "" &&
    providerType !== "" &&
    clientId.trim() !== "" &&
    (isEdit || clientSecret.trim() !== "");

  const callbackUrl = useMemo(() => {
    const n = (isEdit ? editing!.name : name.trim()) || "";
    if (!n) return "";
    return `${window.location.origin}/api/v1/auth/sso/${encodeURIComponent(n)}/callback`;
  }, [isEdit, editing, name]);

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!callbackUrl) return;
    navigator.clipboard.writeText(callbackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("admin.oidc.dialog.editTitle")
              : t("admin.oidc.dialog.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("admin.oidc.dialog.editDesc")
              : t("admin.oidc.dialog.createDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 名称 */}
          <div className="space-y-2">
            <Label htmlFor="oidc-name">{t("common.name")}</Label>
            <Input
              id="oidc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.oidc.form.namePlaceholder")}
              disabled={isEdit}
            />
          </div>

          {/* 回调链接 */}
          {callbackUrl && (
            <div className="space-y-2">
              <Label>{t("admin.oidc.form.callbackUrl")}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-xs break-all select-all">
                  {callbackUrl}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* 提供商类型 */}
          <div className="space-y-2">
            <Label>{t("admin.oidc.form.providerType")}</Label>
            <Select value={providerType} onValueChange={setProviderType}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("admin.oidc.form.providerTypePlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="oidc-client-id">
              {t("admin.oidc.form.clientId")}
            </Label>
            <Input
              id="oidc-client-id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder={t("admin.oidc.form.clientIdPlaceholder")}
            />
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label htmlFor="oidc-client-secret">
              {t("admin.oidc.form.clientSecret")}
            </Label>
            {isEdit && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">
                  {t("admin.oidc.form.secretStatus")}
                </span>
                <Badge
                  variant={editing!.has_secret ? "default" : "destructive"}
                  className="text-xs"
                >
                  {editing!.has_secret
                    ? t("admin.oidc.table.secretSet")
                    : t("admin.oidc.table.secretMissing")}
                </Badge>
              </div>
            )}
            <Input
              id="oidc-client-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={
                isEdit
                  ? t("admin.oidc.form.clientSecretEditPlaceholder")
                  : t("admin.oidc.form.clientSecretPlaceholder")
              }
            />
          </div>

          {/* 排序 */}
          <div className="space-y-2">
            <Label htmlFor="oidc-order">
              {t("admin.oidc.form.displayOrder")}
            </Label>
            <Input
              id="oidc-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>

          {/* 自定义 Scope */}
          <div className="space-y-2">
            <Label htmlFor="oidc-scope">{t("admin.oidc.form.scope")}</Label>
            <Input
              id="oidc-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder={t("admin.oidc.form.scopePlaceholder")}
            />
          </div>

          {/* 附加配置 */}
          <div className="space-y-2">
            <Label htmlFor="oidc-addition">
              {t("admin.oidc.form.addition")}
            </Label>
            <Textarea
              id="oidc-addition"
              value={addition}
              onChange={(e) => setAddition(e.target.value)}
              placeholder={t("admin.oidc.form.additionPlaceholder")}
              rows={3}
              className="font-mono text-xs resize-none"
            />
          </div>

          {/* 启用开关 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="oidc-enabled">{t("common.enable")}</Label>
            <Switch
              id="oidc-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit || upsert.isPending}>
              {isEdit ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
