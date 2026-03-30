/* eslint-disable react-refresh/only-export-components */
/**
 * 文件预览对话框
 * 支持预览图片、视频、音频等文件类型
 */

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Download } from "lucide-react";

// ── 文件类型检测工具 ──────────────────────────────────────────────────────────

const IMAGE_EXTS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif",
]);

const VIDEO_EXTS = new Set(["mp4", "webm"]);

const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "flac", "aac", "m4a"]);

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

export function isPreviewableFile(name: string): boolean {
  const ext = getFileExtension(name);
  return IMAGE_EXTS.has(ext) || VIDEO_EXTS.has(ext) || AUDIO_EXTS.has(ext);
}

export function getFileMimeType(name: string): string {
  const ext = getFileExtension(name);
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    avif: "image/avif",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",
  };
  return map[ext] || "application/octet-stream";
}

// ── 组件 ──────────────────────────────────────────────────────────────────────

interface FilePreviewDialogProps {
  open: boolean;
  fileName: string;
  filePath?: string;
  blobUrl: string | null;
  loading: boolean;
  mimeType: string;
  onOpenChange: (open: boolean) => void;
  onDownload?: () => void;
}

export function FilePreviewDialog({
  open,
  fileName,
  filePath,
  blobUrl,
  loading,
  mimeType,
  onOpenChange,
  onDownload,
}: FilePreviewDialogProps) {
  const { t } = useTranslation();

  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");
  const isAudio = mimeType.startsWith("audio/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl!" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
          {filePath && (
            <p className="text-sm text-muted-foreground">{filePath}</p>
          )}
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : blobUrl ? (
            <>
              {isImage && (
                <img
                  src={blobUrl}
                  alt={fileName}
                  className="max-h-[65vh] max-w-full object-contain rounded-md"
                />
              )}
              {isVideo && (
                <video
                  src={blobUrl}
                  controls
                  className="max-h-[65vh] max-w-full rounded-md"
                />
              )}
              {isAudio && (
                <audio src={blobUrl} controls className="w-full" />
              )}
            </>
          ) : (
            <div className="flex h-[30vh] items-center justify-center text-muted-foreground">
              {t("sftp.preview.loadFailed")}
            </div>
          )}

          <div className="flex justify-end gap-2 w-full">
            {onDownload && (
              <Button variant="outline" onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                {t("sftp.actions.download")}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
