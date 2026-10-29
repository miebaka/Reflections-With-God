import { describe, expect, it } from 'vitest';
import { coarseHourBucket, encodeAnalyticsEvent } from './events';

const base = {
  schemaVersion: 1 as const,
  pseudonymousId: 'pseudonym_1234567890',
  day: '2026-10-29',
  hourBucket: 6 as const,
};

describe('allow-listed analytics', () => {
  it('encodes reviewed product-quality events', () => {
    expect(encodeAnalyticsEvent({ ...base, type: 'fit-feedback', contentId: 'unit-psalm-1', fit: 'fits' }))
      .toContain('fit-feedback');
    expect(encodeAnalyticsEvent({ ...base, type: 'comprehension-responded', answered: true, clarity: 'clear' }))
      .not.toContain('responseText');
  });

  it.each(['reflection', 'prayer', 'mood', 'scriptureText', 'recoverySecret', 'analysisResult'])
  ('rejects a private or arbitrary %s field', (field) => {
    expect(() => encodeAnalyticsEvent({ ...base, type: 'day-started', [field]: 'private' })).toThrow('unsupported');
  });

  it('rejects engagement scoring, streak, and unknown event types', () => {
    expect(() => encodeAnalyticsEvent({ ...base, type: 'streak-increased' })).toThrow('not allow-listed');
    expect(() => encodeAnalyticsEvent({ ...base, type: 'unit-opened', contentId: 'unit-1', score: 99 }))
      .toThrow('unsupported');
  });

  it('coarsens event time into six-hour buckets', () => {
    expect(coarseHourBucket(new Date('2026-10-29T17:59:00.000Z'))).toBe(12);
    expect(coarseHourBucket(new Date('2026-10-29T18:00:00.000Z'))).toBe(18);
  });

  it('rejects impossible calendar days', () => {
    expect(() => encodeAnalyticsEvent({ ...base, day: '2026-99-99', type: 'day-started' }))
      .toThrow('metadata is invalid');
  });
});
