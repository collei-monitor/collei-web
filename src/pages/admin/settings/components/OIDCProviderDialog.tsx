import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
  const tp = "admin.oidc";

  const [name, setName] = useState("");
  const [providerType, setProviderType] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [scope, setScope] = useState("");
  const [addition, setAddition] = useState("");

  // 当 open/editing 变化时同步表单状态（父组件通过 open prop 控制时 onOpenChange 不会触发）
  useEffect(() => {
    if (!open) return;
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
  }, [open, editing]);

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
      editing ? t(`${tp}.toast.updating`) : t(`${tp}.toast.creating`),
    );

    upsert.mutate(payload, {
      onSuccess: () => {
        toast.success(
          editing ? t(`${tp}.toast.updateSuccess`) : t(`${tp}.toast.createSuccess`),
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
        toast.error(err.message || t(`${tp}.toast.saveFailed`), { id: toastId });
      },
    });
  };

  const isEdit = !!editing;
  const canSubmit =
    name.trim() !== "" &&
    providerType !== "" &&
    clientId.trim() !== "" &&
    (isEdit || clientSecret.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t(`${tp}.dialog.editTitle`) : t(`${tp}.dialog.createTitle`)}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t(`${tp}.dialog.editDesc`) : t(`${tp}.dialog.createDesc`)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 名称 */}
          <div className="space-y-2">
            <Label htmlFor="oidc-name">{t(`${tp}.form.name`)}</Label>
            <Input
              id="oidc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(`${tp}.form.namePlaceholder`)}
              disabled={isEdit}
            />
          </div>

          {/* 提供商类型 */}
          <div className="space-y-2">
            <Label>{t(`${tp}.form.providerType`)}</Label>
            <Select value={providerType} onValueChange={setProviderType}>
              <SelectTrigger>
                <SelectValue placeholder={t(`${tp}.form.providerTypePlaceholder`)} />
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
            <Label htmlFor="oidc-client-id">{t(`${tp}.form.clientId`)}</Label>
            <Input
              id="oidc-client-id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder={t(`${tp}.form.clientIdPlaceholder`)}
            />
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label htmlFor="oidc-client-secret">{t(`${tp}.form.clientSecret`)}</Label>
            {isEdit && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">{t(`${tp}.form.secretStatus`)}</span>
                <Badge variant={editing!.has_secret ? "default" : "destructive"} className="text-xs">
                  {editing!.has_secret ? t(`${tp}.table.secretSet`) : t(`${tp}.table.secretMissing`)}
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
                  ? t(`${tp}.form.clientSecretEditPlaceholder`)
                  : t(`${tp}.form.clientSecretPlaceholder`)
              }
            />
          </div>

          {/* 排序 */}
          <div className="space-y-2">
            <Label htmlFor="oidc-order">{t(`${tp}.form.displayOrder`)}</Label>
            <Input
              id="oidc-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>

          {/* 自定义 Scope */}
          <div className="space-y-2">
            <Label htmlFor="oidc-scope">{t(`${tp}.form.scope`)}</Label>
            <Input
              id="oidc-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder={t(`${tp}.form.scopePlaceholder`)}
            />
          </div>

          {/* 附加配置 */}
          <div className="space-y-2">
            <Label htmlFor="oidc-addition">{t(`${tp}.form.addition`)}</Label>
            <Textarea
              id="oidc-addition"
              value={addition}
              onChange={(e) => setAddition(e.target.value)}
              placeholder={t(`${tp}.form.additionPlaceholder`)}
              rows={3}
              className="font-mono text-xs resize-none"
            />
          </div>

          {/* 启用开关 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="oidc-enabled">{t(`${tp}.form.enabled`)}</Label>
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
              {isEdit ? t(`${tp}.dialog.save`) : t(`${tp}.dialog.create`)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
