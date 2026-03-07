/**
 * 展示页工具函数
 * 格式化、OS 识别、区域旗帜等
 */

// ── OS 识别 ───────────────────────────────────────────────────────────────────

export type OsFamily = "windows" | "linux" | "macos" | "unknown";

const LINUX_KEYWORDS = [
  "linux",
  "debian",
  "ubuntu",
  "centos",
  "fedora",
  "arch",
  "red hat",
  "rhel",
  "suse",
  "alpine",
  "gentoo",
  "manjaro",
  "mint",
  "kali",
  "rocky",
  "alma",
  "nixos",
];

/** 检测 OS 家族 */
export function detectOsFamily(os: string | null): OsFamily {
  if (!os) return "unknown";
  const lower = os.toLowerCase();
  if (lower.includes("windows")) return "windows";
  if (lower.includes("mac") || lower.includes("darwin")) return "macos";
  if (LINUX_KEYWORDS.some((kw) => lower.includes(kw))) return "linux";
  return "unknown";
}

// ── 格式化 ────────────────────────────────────────────────────────────────────

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

/** 格式化字节为人类可读 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(decimals)} ${BYTE_UNITS[i]}`;
}

/** 格式化网络速度 (bytes/s → KB/s, MB/s 等) */
export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  return `${formatBytes(bytesPerSec)}/s`;
}

/** 计算百分比 */
export function calcPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

// ── 使用率颜色 ────────────────────────────────────────────────────────────────

/** 根据使用百分比返回颜色 class */
export function getUsageColor(percent: number): string {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

/** 根据使用百分比返回文字颜色 class */
export function getUsageTextColor(percent: number): string {
  if (percent >= 90) return "text-red-500";
  if (percent >= 70) return "text-amber-500";
  return "text-emerald-500";
}
