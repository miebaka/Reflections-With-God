import { describe, expect, it } from 'vitest';
import {
  behavioralSignalMeaning,
  emptyPersonalizationProfile,
  learningAdjustment,
  recordBehavioralSignal,
  recordExplicitSignal,
  resetPersonalization,
} from './learning';

const now = new Date('2026-10-29T12:00:00.000Z');

describe('privacy-safe personalization', () => {
  it('makes explicit feedback dominant and replaces earlier corrections for the same content', () => {
    let profile = recordExplicitSignal(emptyPersonalizationProfile(), {
      id: 'feedback-1', contentId: 'unit-1', judgment: 'not-for-me', reason: 'wrong-tone',
      recordedAt: '2026-10-28T12:00:00.000Z',
    });
    profile = recordExplicitSignal(profile, {
      id: 'feedback-2', contentId: 'unit-1', judgment: 'fits', recordedAt: now.toISOString(),
    });
    expect(profile.explicit).toHaveLength(1);
    expect(learningAdjustment(profile, 'unit-1', now).explicit).toBe(1);
  });

  it('keeps behavioral influence weak, decaying, and limited to thirty days', () => {
    let profile = emptyPersonalizationProfile();
    for (let index = 0; index < 10; index += 1) {
      profile = recordBehavioralSignal(profile, {
        id: `skip-${index}`, contentId: 'unit-1', behavior: 'skip',
        recordedAt: '2026-10-28T12:00:00.000Z',
      }, now);
    }
    expect(learningAdjustment(profile, 'unit-1', now).behavioral).toBe(-0.2);
    expect(learningAdjustment(profile, 'unit-1', new Date('2026-11-28T12:00:00.000Z')).behavioral).toBe(0);
  });

  it('never defines a skip as rejection or a faith judgment', () => {
    const meaning = behavioralSignalMeaning('skip');
    expect(meaning).toContain('no reason');
    expect(meaning).not.toMatch(/weak faith|failure|rejection is inferred/i);
  });

  it('resets every learned signal without streak or penalty state', () => {
    const profile = recordExplicitSignal(emptyPersonalizationProfile(), {
      id: 'feedback-1', contentId: 'unit-1', judgment: 'fits', recordedAt: now.toISOString(),
    });
    expect(resetPersonalization(profile, now)).toEqual({
      schemaVersion: 1, explicit: [], behavioral: [], resetAt: now.toISOString(),
    });
  });

  it('rejects private or arbitrary fields smuggled into a learning signal', () => {
    expect(() => recordExplicitSignal(emptyPersonalizationProfile(), {
      id: 'feedback-1', contentId: 'unit-1', judgment: 'fits', recordedAt: now.toISOString(),
      reflection: 'private text',
    } as never)).toThrow('unsupported data');
  });
});
