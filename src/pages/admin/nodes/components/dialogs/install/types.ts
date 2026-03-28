// ── Shared types & command builder for InstallCommandDialog ─────────────────

// ── Linux ────────────────────────────────────────────────────────────────────

export interface InstallOptions {
  url: string;
  regToken?: string;
  token?: string;
  name?: string;
  interval?: number;
  enableSsh?: boolean;
  setupCa?: boolean;
  force?: boolean;
  noAutoUpdate?: boolean;
  installDir?: string;
  configDir?: string;
  version?: string;
  proxyDownload?: boolean;
}

export type Downloader = "wget" | "curl";
export type DownloadMode = "github" | "proxy";

export const SCRIPT_URL =
  "https://raw.githubusercontent.com/collei-monitor/collei-agent/main/install.sh";

export function buildInstallCommand(
  opts: InstallOptions,
  dl: Downloader = "wget",
  scriptUrl: string = SCRIPT_URL,
): string {
  const args: string[] = [];

  args.push(`--url ${opts.url}`);

  if (opts.regToken) {
    args.push(`--reg-token ${opts.regToken}`);
  } else if (opts.token) {
    args.push(`--token ${opts.token}`);
  }

  if (opts.name) {
    const val = opts.name.includes(" ") ? `'${opts.name}'` : opts.name;
    args.push(`--name ${val}`);
  }
  if (opts.interval && opts.interval !== 2) {
    args.push(`--interval ${opts.interval}`);
  }

  if (opts.enableSsh) args.push("--enable-ssh");
  if (opts.setupCa) args.push("--setup-ca");
  if (opts.force) args.push("--force");
  if (opts.noAutoUpdate) args.push("--no-auto-update");
  if (opts.proxyDownload) args.push("--proxy-download");

  if (opts.installDir) args.push(`--install-dir ${opts.installDir}`);
  if (opts.configDir) args.push(`--config-dir ${opts.configDir}`);
  if (opts.version && opts.version !== "latest") {
    args.push(`--version ${opts.version}`);
  }

  const paramStr = args.join(" \\\n  ");

  // Quote the script URL if it contains query parameters
  const quotedUrl = scriptUrl.includes("?") ? `'${scriptUrl}'` : scriptUrl;

  if (dl === "wget") {
    return `wget -qO- ${quotedUrl} | bash -s -- \\\n  ${paramStr}`;
  }
  return `curl -fsSL ${quotedUrl} | bash -s -- \\\n  ${paramStr}`;
}

// ── Windows ───────────────────────────────────────────────────────────────────

export interface WindowsInstallOptions {
  /** 控制端 API 地址（必须） */
  url: string;
  /** 全局安装密钥（与 token 二选一） */
  regToken?: string;
  /** 专属通信 token（与 regToken 二选一） */
  token?: string;
  /** 服务器显示名称 */
  name?: string;
  /** 上报间隔（秒），默认 3 */
  interval?: number;
  /** 启用 ConPTY 终端直连（Web 终端） */
  enableTerminal?: boolean;
  /** 启用文件管理 API（Web 文件管理器） */
  enableFileApi?: boolean;
  /** 强制重新注册 */
  force?: boolean;
  /** 禁用自动更新 */
  noAutoUpdate?: boolean;
  /** 通过面板代理下载 */
  proxyDownload?: boolean;
  /** 二进制安装目录（高级） */
  installDir?: string;
  /** 配置文件目录（高级） */
  configDir?: string;
  /** 指定版本号（高级） */
  version?: string;
}

export const WIN_SCRIPT_URL =
  "https://raw.githubusercontent.com/collei-monitor/collei-agent/main/install.ps1";

function buildWindowsParams(opts: WindowsInstallOptions): string[] {
  const args: string[] = [];

  args.push(`-Url '${opts.url}'`);

  if (opts.regToken) {
    args.push(`-RegToken '${opts.regToken}'`);
  } else if (opts.token) {
    args.push(`-Token '${opts.token}'`);
  }

  if (opts.name) args.push(`-Name '${opts.name}'`);
  if (opts.interval && opts.interval !== 3) args.push(`-Interval ${opts.interval}`);

  if (opts.enableTerminal) args.push("-EnableTerminal");
  if (opts.enableFileApi) args.push("-EnableFileApi");
  if (opts.force) args.push("-Force");
  if (opts.noAutoUpdate) args.push("-NoAutoUpdate");
  if (opts.proxyDownload) args.push("-ProxyDownload");

  if (opts.installDir) args.push(`-InstallDir '${opts.installDir}'`);
  if (opts.configDir) args.push(`-ConfigDir '${opts.configDir}'`);
  if (opts.version && opts.version !== "latest") args.push(`-Version '${opts.version}'`);

  return args;
}

/**
 * 拼装完整的 Windows 安装命令（单行 PowerShell）。
 * @param scriptUrl 脚本下载地址（支持面板中转）
 */
export function buildWindowsInstallCommand(
  opts: WindowsInstallOptions,
  scriptUrl: string = WIN_SCRIPT_URL,
): string {
  const params = buildWindowsParams(opts).join(" ");
  return (
    `powershell -ExecutionPolicy Bypass -Command ` +
    `"irm ${scriptUrl} -OutFile $env:TEMP\\ci.ps1; ` +
    `& $env:TEMP\\ci.ps1 ${params}; ` +
    `Remove-Item $env:TEMP\\ci.ps1"`
  );
}
