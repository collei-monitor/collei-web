/**
 * SSH 终端页面
 * 桌面端：Resizable 左右分栏（文件管理 | 终端），可拖拽调整
 * 手机端：Tab 切换（终端 / 文件管理）
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useXterm } from "@/hooks/use-xterm";
import { useSSHConnection } from "@/hooks/use-ssh-connection";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "./components/AuthDialog";
import { StatusIndicator } from "./components/StatusIndicator";
import { SFTPPanel } from "./components/SFTPPanel";
import type { SFTPPanelHandle } from "./components/SFTPPanel";
import { SshScriptsPanel } from "./components/SshScriptsPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  TerminalSquare,
  FolderOpen,
  Power,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function SSHTerminalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const serverUuid = searchParams.get("uuid") || "";
  const serverName = searchParams.get("name") || serverUuid;

  // 手机端：Tab 切换；桌面端：面板显示/隐藏
  const [activeTab, setActiveTab] = useState("terminal");
  const [showFiles, setShowFiles] = useState(true);
  const [filePanelWidth, setFilePanelWidth] = useState(500); // 默认左侧文件面板宽度
  const connectedRef = useRef(false);
  const sftpRef = useRef<SFTPPanelHandle>(null);

  // xterm 实例
  const { terminalRef, write, writeln, focus, getDimensions } = useXterm({
    onData: (data) => sendInput(data),
    onResize: (cols, rows) => sendResize(cols, rows),
  });

  // SSH 连接
  const { status, connect, sendInput, sendAuth, sendResize, disconnect } =
    useSSHConnection({
      serverUuid,
      onOutput: (data) => write(data),
      onConnected: () => {
        connectedRef.current = true;
        focus();
      },
      onAuthRequired: () => {
        // auth_required 状态会通过 status 触发 AuthDialog
      },
      onError: (msg) => {
        writeln(`\r\n\x1b[31m${t("ssh.terminal.error")}: ${msg}\x1b[0m`);
      },
      onClosed: (reason) => {
        connectedRef.current = false;
        writeln(
          `\r\n\x1b[33m${t("ssh.terminal.disconnected")}: ${reason}\x1b[0m`,
        );
      },
    });

  // 自动连接（cleanup 防止 StrictMode 双重调用）
  useEffect(() => {
    if (!serverUuid) return;
    let cancelled = false;

    // 延迟一帧，让 xterm 完成初始化
    const timer = setTimeout(() => {
      if (cancelled) return;
      const dims = getDimensions();
      writeln(
        `\x1b[36m${t("ssh.terminal.connecting", { name: serverName })}...\x1b[0m`,
      );
      connect({ cols: dims.cols, rows: dims.rows });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      disconnect();
    };
  }, [serverUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthSubmit = useCallback(
    (username: string, password: string) => {
      sendAuth(username, password);
    },
    [sendAuth],
  );

  const handleDisconnect = useCallback(() => {
    sftpRef.current?.disconnect();
    disconnect();
  }, [disconnect]);

  const handleReconnect = useCallback(() => {
    const dims = getDimensions();
    writeln(`\r\n\x1b[36m${t("ssh.terminal.reconnecting")}...\x1b[0m`);
    connect({ cols: dims.cols, rows: dims.rows });
  }, [connect, getDimensions, writeln, t]);

  const handleBack = useCallback(() => {
    sftpRef.current?.disconnect();
    disconnect();
    navigate("/admin/nodes", { replace: true });
  }, [disconnect, navigate]);

  // 自定义拖拽调整宽度逻辑
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = filePanelWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // 最小宽度 200px，最大宽度不超过屏幕宽度的 80%
        const newWidth = Math.max(
          200,
          Math.min(
            window.innerWidth * 0.8,
            startWidth + moveEvent.clientX - startX,
          ),
        );
        setFilePanelWidth(newWidth);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        // 拖拽停止后，触发全量尺寸更新（xterm会在此处fit）
        window.dispatchEvent(new Event("resize"));
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [filePanelWidth],
  );

  if (!serverUuid) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("ssh.terminal.noServer")}</p>
      </div>
    );
  }

  const isDisconnected = status === "closed" || status === "error";

  // 终端面板
  const terminalPanel = (
    <div
      className="relative h-full w-full"
      style={{ backgroundColor: "#1a1b26" }}
    >
      <div className="absolute inset-1 overflow-hidden">
        <div
          ref={terminalRef}
          className="h-full w-full outline-none"
          onClick={() => focus()}
        />
      </div>
    </div>
  );

  // SFTP 面板在 JSX 中直接渲染（始终挂载，避免 WS 重连）

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* 顶栏 */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("ssh.terminal.back")}</TooltipContent>
          </Tooltip>

          {isMobile ? (
            /* 手机端：Tab 切换 */
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-8">
                <TabsTrigger
                  value="terminal"
                  className="gap-1.5 text-xs px-3 h-7"
                >
                  <TerminalSquare className="h-3.5 w-3.5" />
                  {t("ssh.tabs.terminal")}
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-1.5 text-xs px-3 h-7">
                  <FolderOpen className="h-3.5 w-3.5" />
                  {t("ssh.tabs.files")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            /* 桌面端：文件面板切换按钮 */
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowFiles((v) => !v)}
                >
                  {showFiles ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showFiles ? t("ssh.tabs.hideFiles") : t("ssh.tabs.files")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator status={status} serverName={serverName} />

          {isDisconnected ? (
            <Button size="sm" variant="outline" onClick={handleReconnect}>
              {t("ssh.terminal.reconnect")}
            </Button>
          ) : status === "connected" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={handleDisconnect}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("ssh.terminal.disconnect")}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex flex-1 h-full w-full min-h-0 min-w-0 overflow-hidden">
        {/* SFTP 文件面板：始终挂载，通过 CSS 控制显隐，避免桌面/手机模式切换时重连 WS */}
        <div
          style={!isMobile && showFiles ? { width: filePanelWidth } : undefined}
          className={`shrink-0 flex flex-col h-full border-r bg-background relative${
            isMobile
              ? activeTab === "files"
                ? " flex-1 min-w-0 border-r-0"
                : " hidden"
              : showFiles
                ? ""
                : " hidden"
          }`}
        >
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0">
              <SFTPPanel ref={sftpRef} serverUuid={serverUuid} serverName={serverName} />
            </div>
          </div>
        </div>
        {/* 桌面端拖动把手 */}
        {!isMobile && showFiles && (
          <div
            className="w-1.5 cursor-col-resize bg-border/50 hover:bg-primary/50 shrink-0 z-10 transition-colors active:bg-primary"
            onMouseDown={handleMouseDown}
          />
        )}
        {/* 终端：始终挂载，手机端用 hidden 隐藏而非卸载，避免 xterm 丢失 */}
        <div
          className={`flex-1 min-w-0 relative h-full${
            isMobile && activeTab !== "terminal" ? " hidden" : ""
          }`}
        >
          {terminalPanel}
          {/* SSH 快捷脚本浮动面板 */}
          <SshScriptsPanel onSend={(content) => sendInput(content)} />
        </div>
      </div>

      {/* 密码认证对话框 */}
      <AuthDialog
        open={status === "auth_required"}
        onSubmit={handleAuthSubmit}
        onCancel={handleDisconnect}
      />
    </div>
  );
}
