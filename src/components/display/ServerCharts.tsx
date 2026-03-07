/**
 * 服务器历史图表面板
 * 包含 CPU / 内存 / 磁盘 / 网络 / 连接数 / 进程数 六组图表
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MetricChart, type ChartSeries } from "@/components/display/MetricChart";
import { formatSpeed, calcPercent } from "@/lib/display-utils";
import type { ServerNodeRecord } from "@/types/server";

interface ServerChartsProps {
  history: ServerNodeRecord[];
}

// ── 颜色常量 ──────────────────────────────────────────────────────────────────

const COLORS = {
  cpu: "#10b981",
  ram: "#3b82f6",
  swap: "#f59e0b",
  disk: "#8b5cf6",
  netIn: "#3b82f6",
  netOut: "#10b981",
  tcp: "#f97316",
  udp: "#06b6d4",
  process: "#8b5cf6",
} as const;

// ── 组件 ──────────────────────────────────────────────────────────────────────

export function ServerCharts({ history }: ServerChartsProps) {
  const { t } = useTranslation();

  // CPU 数据
  const cpuData = useMemo(
    () => history.map((r) => ({ time: r.time, cpu: r.cpu })),
    [history],
  );
  const cpuSeries: ChartSeries[] = useMemo(
    () => [{ dataKey: "cpu", label: "CPU", color: COLORS.cpu }],
    [],
  );

  // 内存数据（百分比）
  const memData = useMemo(
    () =>
      history.map((r) => ({
        time: r.time,
        ram: calcPercent(r.ram, r.ram_total),
        swap: calcPercent(r.swap, r.swap_total),
      })),
    [history],
  );
  const memSeries: ChartSeries[] = useMemo(
    () => [
      { dataKey: "ram", label: t("detail.chart.ram"), color: COLORS.ram },
      { dataKey: "swap", label: "Swap", color: COLORS.swap },
    ],
    [t],
  );

  // 磁盘数据（百分比）
  const diskData = useMemo(
    () =>
      history.map((r) => ({
        time: r.time,
        disk: calcPercent(r.disk, r.disk_total),
      })),
    [history],
  );
  const diskSeries: ChartSeries[] = useMemo(
    () => [{ dataKey: "disk", label: t("detail.chart.disk"), color: COLORS.disk }],
    [t],
  );

  // 网络速度
  const netData = useMemo(
    () =>
      history.map((r) => ({
        time: r.time,
        net_in: r.net_in,
        net_out: r.net_out,
      })),
    [history],
  );
  const netSeries: ChartSeries[] = useMemo(
    () => [
      { dataKey: "net_in", label: t("detail.chart.netIn"), color: COLORS.netIn },
      { dataKey: "net_out", label: t("detail.chart.netOut"), color: COLORS.netOut },
    ],
    [t],
  );

  // 连接数
  const connData = useMemo(
    () =>
      history.map((r) => ({
        time: r.time,
        tcp: r.tcp,
        udp: r.udp,
      })),
    [history],
  );
  const connSeries: ChartSeries[] = useMemo(
    () => [
      { dataKey: "tcp", label: "TCP", color: COLORS.tcp },
      { dataKey: "udp", label: "UDP", color: COLORS.udp },
    ],
    [],
  );

  // 进程数
  const procData = useMemo(
    () => history.map((r) => ({ time: r.time, process: r.process })),
    [history],
  );
  const procSeries: ChartSeries[] = useMemo(
    () => [{ dataKey: "process", label: t("detail.chart.process"), color: COLORS.process }],
    [t],
  );

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* CPU */}
      <MetricChart
        title={t("detail.chart.cpu")}
        data={cpuData}
        series={cpuSeries}
        yFormatter={(v) => `${v}%`}
        tooltipFormatter={(v) => `${v.toFixed(1)}%`}
        yDomain={[0, 100]}
      />

      {/* 内存 */}
      <MetricChart
        title={t("detail.chart.memory")}
        data={memData}
        series={memSeries}
        yFormatter={(v) => `${v}%`}
        tooltipFormatter={(v) => `${v.toFixed(1)}%`}
        yDomain={[0, 100]}
      />

      {/* 磁盘 */}
      <MetricChart
        title={t("detail.chart.disk")}
        data={diskData}
        series={diskSeries}
        yFormatter={(v) => `${v}%`}
        tooltipFormatter={(v) => `${v.toFixed(1)}%`}
        yDomain={[0, 100]}
      />

      {/* 网络 */}
      <MetricChart
        title={t("detail.chart.network")}
        data={netData}
        series={netSeries}
        yFormatter={(v) => formatSpeed(v)}
        tooltipFormatter={(v) => formatSpeed(v)}
      />

      {/* 连接数 */}
      <MetricChart
        title={t("detail.chart.connections")}
        data={connData}
        series={connSeries}
        tooltipFormatter={(v) => String(Math.round(v))}
      />

      {/* 进程数 */}
      <MetricChart
        title={t("detail.chart.process")}
        data={procData}
        series={procSeries}
        tooltipFormatter={(v) => String(Math.round(v))}
      />
    </div>
  );
}
