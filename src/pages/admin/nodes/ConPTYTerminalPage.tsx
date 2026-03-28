/**
 * ConPTY 终端页面（本机终端 + 原生文件管理）
 * 桌面端：Resizable 左右分栏（文件管理 | 终端），可拖拽调整
 * 手机端：Tab 切换（终端 / 文件管理）
 * 与 SSH 终端不同：无密码认证流程，直连 Agent 本机终端与文件系统
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useXterm } from "@/hooks/use-xterm";
import { useTerminalConnection } from "@/hooks/use-terminal-connection";
import { useIsMobile } from "@/hooks/use-mobile";
import { TerminalStatusIndicator } from "./components/TerminalStatusIndicator";
import { FileAPIPanel } from "./components/FileAPIPanel";
import type { FileAPIPanelHandle } from "./components/FileAPIPanel";
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

export default function ConPTYTerminalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const serverUuid = searchParams.get("uuid") || "";
  const serverName = searchParams.get("name") || serverUuid;

  // 手机端：Tab 切换；桌面端：面板显示/隐藏
  const [activeTab, setActiveTab] = useState("terminal");
  const [showFiles, setShowFiles] = useState(true);
  const [filePanelWidth, setFilePanelWidth] = useState(500);
  const fileRef = useRef<FileAPIPanelHandle>(null);

  // xterm 实例
  const { terminalRef, write, writeln, focus, getDimensions } = useXterm({
    onData: (data) => sendInput(data),
    onResize: (cols, rows) => sendResize(cols, rows),
  });

  // Terminal 连接（无认证流程）
  const { status, connect, sendInput, sendResize, disconnect } =
    useTerminalConnection({
      serverUuid,
      onOutput: (data) => write(data),
      onConnected: () => {
        focus();
      },
      onError: (msg) => {
        writeln(`\r\n\x1b[31m${t("terminal.terminal.error")}: ${msg}\x1b[0m`);
      },
      onClosed: (reason, exitCode) => {
        const extra = exitCode !== undefined ? ` (exit ${exitCode})` : "";
        writeln(
          `\r\n\x1b[33m${t("terminal.terminal.disconnected")}: ${reason}${extra}\x1b[0m`,
        );
      },
    });

  // 自动连接
  useEffect(() => {
    if (!serverUuid) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;
      const dims = getDimensions();
      writeln(
        `\x1b[36m${t("terminal.terminal.connecting", { name: serverName })}...\x1b[0m`,
      );
      connect({ cols: dims.cols, rows: dims.rows });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      disconnect();
    };
  }, [serverUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDisconnect = useCallback(() => {
    fileRef.current?.disconnect();
    disconnect();
  }, [disconnect]);

  const handleReconnect = useCallback(() => {
    const dims = getDimensions();
    writeln(`\r\n\x1b[36m${t("terminal.terminal.reconnecting")}...\x1b[0m`);
    connect({ cols: dims.cols, rows: dims.rows });
  }, [connect, getDimensions, writeln, t]);

  const handleBack = useCallback(() => {
    fileRef.current?.disconnect();
    disconnect();
    navigate("/admin/nodes", { replace: true });
  }, [disconnect, navigate]);

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = filePanelWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
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
        <p className="text-muted-foreground">{t("terminal.terminal.noServer")}</p>
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
            <TooltipContent>{t("terminal.terminal.back")}</TooltipContent>
          </Tooltip>

          {isMobile ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-8">
                <TabsTrigger
                  value="terminal"
                  className="gap-1.5 text-xs px-3 h-7"
                >
                  <TerminalSquare className="h-3.5 w-3.5" />
                  {t("terminal.tabs.terminal")}
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-1.5 text-xs px-3 h-7">
                  <FolderOpen className="h-3.5 w-3.5" />
                  {t("terminal.tabs.files")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
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
                {showFiles ? t("terminal.tabs.hideFiles") : t("terminal.tabs.files")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-3">
          <TerminalStatusIndicator status={status} serverName={serverName} />

          {isDisconnected ? (
            <Button size="sm" variant="outline" onClick={handleReconnect}>
              {t("terminal.terminal.reconnect")}
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
              <TooltipContent>{t("terminal.terminal.disconnect")}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex flex-1 h-full w-full min-h-0 min-w-0 overflow-hidden">
        {/* File API 文件面板 */}
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
              <FileAPIPanel ref={fileRef} serverUuid={serverUuid} serverName={serverName} />
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
        {/* 终端 */}
        <div
          className={`flex-1 min-w-0 relative h-full${
            isMobile && activeTab !== "terminal" ? " hidden" : ""
          }`}
        >
          {terminalPanel}
        </div>
      </div>
    </div>
  );
}
