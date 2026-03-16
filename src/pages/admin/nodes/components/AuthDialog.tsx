/**
 * SSH 密码认证对话框
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  defaultUsername?: string;
  onSubmit: (username: string, password: string) => void;
  onCancel: () => void;
}

export function AuthDialog({ open, defaultUsername = "root", onSubmit, onCancel }: AuthDialogProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onSubmit(username, password);
      setPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {t("ssh.auth.title")}
          </DialogTitle>
          <DialogDescription>{t("ssh.auth.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ssh-username">{t("ssh.auth.username")}</Label>
            <Input
              id="ssh-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ssh-password">{t("ssh.auth.password")}</Label>
            <Input
              id="ssh-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("ssh.auth.cancel")}
            </Button>
            <Button type="submit" disabled={!username || !password}>
              {t("ssh.auth.connect")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
