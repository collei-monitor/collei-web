/**
 * SSH 终端 xterm.js 核心 hook
 * 管理 xterm 实例的创建、销毁和 DOM 挂载
 */

import { useRef, useEffect, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

export interface UseXtermOptions {
  onData?: (data: string) => void;
  onBinary?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
}

export function useXterm(options: UseXtermOptions = {}) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; });

  // 初始化
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#1a1b26",
        foreground: "#c0caf5",
        cursor: "#c0caf5",
        cursorAccent: "#1a1b26",
        selectionBackground: "#33467c",
        black: "#15161e",
        red: "#f7768e",
        green: "#9ece6a",
        yellow: "#e0af68",
        blue: "#7aa2f7",
        magenta: "#bb9af7",
        cyan: "#7dcfff",
        white: "#a9b1d6",
        brightBlack: "#414868",
        brightRed: "#f7768e",
        brightGreen: "#9ece6a",
        brightYellow: "#e0af68",
        brightBlue: "#7aa2f7",
        brightMagenta: "#bb9af7",
        brightCyan: "#7dcfff",
        brightWhite: "#c0caf5",
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    fitAddon.fit();

    term.onData((data) => optionsRef.current.onData?.(data));
    term.onBinary((data) => optionsRef.current.onBinary?.(data));

    // 节流 onResize：拖拽分栏时避免高频发送尺寸信息
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    term.onResize(({ cols, rows }) => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        optionsRef.current.onResize?.(cols, rows);
      }, 150);
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // 节流 ResizeObserver：避免拖拽过程中过于频繁 fit
    let fitTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(() => {
        try {
          fitAddon.fit();
        } catch {
          // ignore fit errors during transitions
        }
      }, 80);
    });
    observer.observe(terminalRef.current);

    return () => {
      clearTimeout(resizeTimer);
      clearTimeout(fitTimer);
      observer.disconnect();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  const write = useCallback((data: string | Uint8Array) => {
    xtermRef.current?.write(data);
  }, []);

  const writeln = useCallback((data: string) => {
    xtermRef.current?.writeln(data);
  }, []);

  const focus = useCallback(() => {
    xtermRef.current?.focus();
  }, []);

  const fit = useCallback(() => {
    try {
      fitAddonRef.current?.fit();
    } catch {
      // ignore
    }
  }, []);

  const getDimensions = useCallback(() => {
    const term = xtermRef.current;
    return term ? { cols: term.cols, rows: term.rows } : { cols: 80, rows: 24 };
  }, []);

  const clear = useCallback(() => {
    xtermRef.current?.clear();
  }, []);

  return {
    terminalRef,
    write,
    writeln,
    focus,
    fit,
    getDimensions,
    clear,
  };
}
