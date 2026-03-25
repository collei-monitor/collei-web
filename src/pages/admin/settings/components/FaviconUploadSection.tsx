import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Trash2, RefreshCw, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePublicConfig } from "@/services/public-config";
import { useUploadFavicon, useDeleteFavicon } from "@/services/config";

export function FaviconUploadSection() {
  const { t } = useTranslation();
  const { data: publicConfig } = usePublicConfig();
  const uploadFavicon = useUploadFavicon();
  const deleteFavicon = useDeleteFavicon();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const faviconUrl = publicConfig?.favicon_url;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("settings.general.faviconTooLarge"));
      return;
    }

    uploadFavicon.mutate(file, {
      onSuccess: () => {
        toast.success(t("settings.general.faviconSuccess"));
        setPreviewKey((k) => k + 1);
      },
      onError: (err) => {
        toast.error(t("settings.general.faviconFailed"), {
          description: (err as Error).message,
        });
      },
    });

    // 重置 input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = () => {
    deleteFavicon.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("settings.general.faviconDeleted"));
        setPreviewKey((k) => k + 1);
      },
      onError: (err) => {
        toast.error(t("settings.general.faviconDeleteFailed"), {
          description: (err as Error).message,
        });
      },
    });
  };

  return (
    <div className="space-y-2">
      <Label>{t("settings.general.favicon")}</Label>
      <p className="text-sm text-muted-foreground">
        {t("settings.general.faviconDesc")}
      </p>
      <div className="flex items-center gap-4">
        {faviconUrl ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
            <img
              key={previewKey}
              src={`${faviconUrl}?v=${previewKey}`}
              alt="favicon"
              className="h-8 w-8 object-contain"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={uploadFavicon.isPending}
            onClick={() => fileRef.current?.click()}
          >
            {uploadFavicon.isPending ? (
              <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            {t("settings.general.faviconUpload")}
          </Button>
          {faviconUrl && (
            <Button
              size="sm"
              variant="outline"
              disabled={deleteFavicon.isPending}
              onClick={handleDelete}
            >
              {deleteFavicon.isPending ? (
                <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-4 w-4" />
              )}
              {t("settings.general.faviconDelete")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
