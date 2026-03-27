// ── Shared types & command builder for InstallCommandDialog ─────────────────

export interface InstallOptions {
  url: string;
  regToken?: string;
  token?: string;
  name?: string;
  interval?: number;
  enableSsh?: boolean;
  setupCa?: boolean;
  force?: boolean;
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
