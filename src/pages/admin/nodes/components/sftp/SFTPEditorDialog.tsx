import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save } from "lucide-react";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface SFTPEditorDialogProps {
  open: boolean;
  mode: "create" | "edit";
  fileName: string;
  filePath?: string;
  content: string;
  encoding: string;
  loading: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onFileNameChange: (name: string) => void;
  onContentChange: (content: string) => void;
  onEncodingChange: (encoding: string) => void;
  onSave: () => void;
}

function detectEditorLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return "plaintext";

  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
    less: "less",
    py: "python",
    go: "go",
    java: "java",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    txt: "plaintext",
  };

  return map[ext] || "plaintext";
}

const ENCODINGS = [
  "utf-8", "gbk", "gb2312", "gb18030", "big5",
  "shift_jis", "euc-jp", "euc-kr",
  "iso-8859-1", "windows-1252",
] as const;

export function SFTPEditorDialog({
  open,
  mode,
  fileName,
  filePath,
  content,
  encoding,
  loading,
  saving,
  onOpenChange,
  onFileNameChange,
  onContentChange,
  onEncodingChange,
  onSave,
}: SFTPEditorDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl!" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
          {filePath && (
            <p className="text-sm text-muted-foreground">{filePath}</p>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="editor-file-name">{t("sftp.editor.fileName")}</Label>
              <Input
                id="editor-file-name"
                value={fileName}
                onChange={(e) => onFileNameChange(e.target.value)}
                placeholder={t("sftp.editor.fileNamePlaceholder")}
              />
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-[55vh] w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Label className="shrink-0 text-xs text-muted-foreground">{t("sftp.editor.encoding")}</Label>
                <Select value={encoding} onValueChange={onEncodingChange}>
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENCODINGS.map((enc) => (
                      <SelectItem key={enc} value={enc} className="text-xs">
                        {enc.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-hidden rounded-md border">
              <Suspense
                fallback={
                  <div className="flex h-[55vh] items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </div>
                }
              >
                <MonacoEditor
                  height="55vh"
                  language={detectEditorLanguage(fileName)}
                  value={content}
                  onChange={(value) => onContentChange(value ?? "")}
                  options={{
                    // Layout & Display
                    minimap: { enabled: false },
                    wordWrap: "on",
                    fontSize: 13,
                    lineHeight: 1.5,
                    cursorBlinking: "blink",
                    smoothScrolling: true,
                    scrollBeyondLastLine: false,
                    glyphMargin: true,
                    lineNumbers: "on",
                    
                    // Editor Features
                    formatOnPaste: true,
                    formatOnType: true,
                    autoIndent: "full",
                    insertSpaces: true,
                    tabSize: 2,
                    detectIndentation: true,
                    
                    // Code Intelligence
                    bracketPairColorization: { enabled: true },
                    guides: {
                      bracketPairs: "active",
                      indentation: true,
                    },
                    acceptSuggestionOnEnter: "smart",
                    
                    // Other
                    automaticLayout: true,
                    contextmenu: true,
                    quickSuggestions: {
                      other: true,
                      comments: false,
                      strings: false,
                    },
                  }}
                />
              </Suspense>
            </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={onSave} disabled={saving || loading}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("common.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
