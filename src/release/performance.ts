export type PerformanceMetric =
  | 'cold-meaningful-content-ms' | 'local-interaction-ms'
  | 'journey-plan-ms' | 'encrypt-private-record-ms';

export type DeviceProfile = {
  id: string;
  platform: 'android' | 'ios';
  classification: 'low-end' | 'mid-range' | 'high-end' | 'simulator';
  osVersion: string;
  model: string;
};

export type PerformanceSample = {
  metric: PerformanceMetric;
  valueMs: number;
  measuredAt: string;
  device: DeviceProfile;
};

export type PerformanceBudgetResult = {
  metric: PerformanceMetric;
  budgetMs: number;
  p95Ms?: number;
  passed: boolean;
  evidence: 'real-midrange-android' | 'insufficient';
};

export const provisionalPerformanceBudgets: Readonly<Record<PerformanceMetric, number>> = {
  'cold-meaningful-content-ms': 2_500,
  'local-interaction-ms': 100,
  'journey-plan-ms': 50,
  'encrypt-private-record-ms': 50,
};

export function evaluatePerformanceSamples(
  metric: PerformanceMetric,
  samples: readonly PerformanceSample[],
): PerformanceBudgetResult {
  const relevant = samples.filter((sample) => sample.metric === metric
    && sample.device.platform === 'android' && sample.device.classification === 'mid-range');
  if (relevant.length < 20) {
    return { metric, budgetMs: provisionalPerformanceBudgets[metric], passed: false, evidence: 'insufficient' };
  }
  relevant.forEach(assertSample);
  const ordered = relevant.map(({ valueMs }) => valueMs).sort((a, b) => a - b);
  const p95 = ordered[Math.ceil(ordered.length * 0.95) - 1]!;
  return {
    metric, budgetMs: provisionalPerformanceBudgets[metric], p95Ms: p95,
    passed: p95 <= provisionalPerformanceBudgets[metric], evidence: 'real-midrange-android',
  };
}

function assertSample(sample: PerformanceSample): void {
  const date = new Date(sample.measuredAt);
  if (!Number.isFinite(sample.valueMs) || sample.valueMs < 0 || Number.isNaN(date.getTime())
    || date.toISOString() !== sample.measuredAt || !sample.device.id.trim()
    || !sample.device.osVersion.trim() || !sample.device.model.trim()) {
    throw new Error('Performance sample is invalid.');
  }
}
