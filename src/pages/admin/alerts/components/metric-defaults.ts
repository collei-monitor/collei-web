/**
 * 告警指标前端默认值与字段联动配置
 *
 * 根据 ALERT_METRIC_DEFAULTS.md 文档:
 * - 锁定字段: 前端隐藏/禁用对应输入，提交时使用固定值
 * - 默认值: 指标切换时自动填充
 * - 阈值单位/提示: 在输入框旁显示
 */

export interface MetricDefaults {
  /** 锁定的 condition 值，undefined = 用户可选 */
  condition?: string;
  /** 锁定的 threshold 值，undefined = 用户输入 */
  threshold?: number;
  /** 锁定的 duration 值，undefined = 用户输入 */
  duration?: number;
  /** 未锁定时的默认 duration */
  defaultDuration?: number;
  /** 未锁定时的建议默认 threshold */
  defaultThreshold?: number;
  /** 隐藏 condition 选择器 */
  hideCondition?: boolean;
  /** 隐藏 threshold 输入框 */
  hideThreshold?: boolean;
  /** 隐藏 duration 输入框 */
  hideDuration?: boolean;
  /** 隐藏 notify_recovery 复选框 */
  hideNotifyRecovery?: boolean;
  /** 隐藏 traffic_notify_step 输入框 */
  hideTrafficStep?: boolean;
  /** 默认 notify_recovery (0 or 1) */
  defaultNotifyRecovery?: number;
  /** 阈值单位 i18n key（用于输入框后缀）*/
  thresholdUnit?: string;
  /** 阈值输入提示 i18n key */
  thresholdHint?: string;
}

export const METRIC_DEFAULTS: Record<string, MetricDefaults> = {
  login: {
    condition: "==",
    threshold: 1,
    duration: 0,
    hideCondition: true,
    hideThreshold: true,
    hideDuration: true,
    hideNotifyRecovery: true,
    hideTrafficStep: true,
    defaultNotifyRecovery: 0,
  },
  offline: {
    condition: "==",
    threshold: 1,
    hideCondition: true,
    hideThreshold: true,
    hideTrafficStep: true,
    defaultDuration: 60,
    defaultNotifyRecovery: 1,
  },
  expiry: {
    condition: "<",
    hideCondition: true,
    duration: 0,
    hideDuration: true,
    hideTrafficStep: true,
    defaultThreshold: 7,
    thresholdUnit: "thresholdUnits.days",
    thresholdHint: "thresholdHints.expiry",
  },
  traffic_percent: {
    condition: ">",
    hideCondition: true,
    duration: 0,
    hideDuration: true,
    hideTrafficStep: false,
    defaultThreshold: 80,
    thresholdUnit: "thresholdUnits.percent",
    thresholdHint: "thresholdHints.trafficPercent",
  },
  cpu: {
    hideTrafficStep: true,
    defaultDuration: 60,
    defaultThreshold: 0.9,
    thresholdUnit: "thresholdUnits.ratio",
    thresholdHint: "thresholdHints.ratio",
  },
  ram: {
    hideTrafficStep: true,
    defaultDuration: 60,
    defaultThreshold: 0.9,
    thresholdUnit: "thresholdUnits.ratio",
    thresholdHint: "thresholdHints.ratio",
  },
  swap: {
    hideTrafficStep: true,
    defaultDuration: 60,
    defaultThreshold: 0.8,
    thresholdUnit: "thresholdUnits.ratio",
    thresholdHint: "thresholdHints.ratio",
  },
  disk: {
    hideTrafficStep: true,
    defaultDuration: 60,
    defaultThreshold: 0.9,
    thresholdUnit: "thresholdUnits.ratio",
    thresholdHint: "thresholdHints.ratio",
  },
  load: {
    hideTrafficStep: true,
    defaultDuration: 60,
    defaultThreshold: 5,
    thresholdHint: "thresholdHints.load",
  },
  net_in: {
    hideTrafficStep: true,
    defaultDuration: 60,
    thresholdUnit: "thresholdUnits.bytesPerSec",
    thresholdHint: "thresholdHints.netIn",
  },
  net_out: {
    hideTrafficStep: true,
    defaultDuration: 60,
    thresholdUnit: "thresholdUnits.bytesPerSec",
    thresholdHint: "thresholdHints.netOut",
  },
  tcp: {
    hideTrafficStep: true,
    defaultDuration: 60,
    thresholdHint: "thresholdHints.tcp",
  },
  udp: {
    hideTrafficStep: true,
    defaultDuration: 60,
    thresholdHint: "thresholdHints.udp",
  },
  process: {
    hideTrafficStep: true,
    defaultDuration: 60,
    thresholdHint: "thresholdHints.process",
  },
};

/** 获取指标的默认配置，未知指标返回空对象 */
export function getMetricDefaults(metric: string): MetricDefaults {
  return METRIC_DEFAULTS[metric] ?? { hideTrafficStep: true };
}
