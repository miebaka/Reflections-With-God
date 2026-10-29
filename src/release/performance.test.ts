import { describe, expect, it } from 'vitest';
import { evaluatePerformanceSamples, type PerformanceSample } from './performance';

function samples(valueMs: number, count = 20): PerformanceSample[] {
  return Array.from({ length: count }, (_, index) => ({
    metric: 'cold-meaningful-content-ms', valueMs: valueMs + index,
    measuredAt: '2026-10-29T12:00:00.000Z',
    device: { id: `device-${index}`, platform: 'android', classification: 'mid-range', osVersion: '15', model: 'test-profile' },
  }));
}

describe('provisional performance budgets', () => {
  it('refuses to claim performance from too few or simulated samples', () => {
    expect(evaluatePerformanceSamples('cold-meaningful-content-ms', samples(100, 19))).toMatchObject({
      passed: false, evidence: 'insufficient',
    });
    const simulated = samples(100).map((sample) => ({
      ...sample, device: { ...sample.device, classification: 'simulator' as const },
    }));
    expect(evaluatePerformanceSamples('cold-meaningful-content-ms', simulated).evidence).toBe('insufficient');
  });

  it('uses the measured p95 from at least twenty mid-range Android samples', () => {
    expect(evaluatePerformanceSamples('cold-meaningful-content-ms', samples(2_400))).toMatchObject({
      passed: true, p95Ms: 2418, evidence: 'real-midrange-android',
    });
    expect(evaluatePerformanceSamples('cold-meaningful-content-ms', samples(2_600)).passed).toBe(false);
  });
});
