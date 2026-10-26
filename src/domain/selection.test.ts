import { describe, expect, it } from 'vitest';

import type { ContentUnit } from './content';
import { selectContent, type SelectionRequest } from './selection';

const request: SelectionRequest = {
  selections: [{ emotion: 'anxious', intensity: 'strong' }],
  arcStage: 'ground',
  deliveredPassageIds: [],
};

function approvedUnit(overrides: Partial<ContentUnit> = {}): ContentUnit {
  return {
    id: 'unit-1-v1', version: 1, passageId: 'Psalm.46.10', reference: 'Psalm 46:10',
    translationId: 'TEST-ONLY', scriptureText: 'Fixture text', context: 'Fixture context',
    reflectionPrompt: 'Fixture reflection?', prayer: 'Fixture prayer. In Jesus’ name, amen.',
    moodTags: ['anxious'], intensities: ['strong'], movements: ['ground'],
    contraindicatedEmotions: [], deliveryClass: 'mood-responsive', groundingFallback: false,
    status: 'approved', approvals: { pastor: true, scholar: true, safety: true, final: true },
    approvedAt: '2026-10-26T00:00:00.000Z',
    ...overrides,
  };
}

describe('reviewed content selection', () => {
  it.each([
    ['missing pastor approval', { approvals: { pastor: false, scholar: true, safety: true, final: true } }],
    ['retired content', { status: 'retired' as const }],
    ['structured-study difficult content', { deliveryClass: 'structured-study' as const }],
    ['a contraindicated emotion', { contraindicatedEmotions: ['anxious'] as const }],
  ])('excludes %s', (_label, overrides) => {
    expect(selectContent(request, [approvedUnit(overrides)])).toEqual({ kind: 'unavailable' });
  });

  it('selects a fitting fully approved unit', () => {
    const unit = approvedUnit();
    expect(selectContent(request, [unit])).toEqual({ kind: 'specific', unit });
  });

  it('deduplicates canonical passages across content versions', () => {
    const revised = approvedUnit({ id: 'unit-1-v2', version: 2 });
    expect(selectContent({ ...request, deliveredPassageIds: ['Psalm.46.10'] }, [revised]))
      .toEqual({ kind: 'unavailable' });
  });

  it('uses an eligible grounding fallback when no specific unit fits', () => {
    const fallback = approvedUnit({
      id: 'fallback-1', passageId: 'Psalm.23.1-4', reference: 'Psalm 23:1–4',
      moodTags: [], intensities: ['mild', 'moderate', 'strong'], movements: ['ground'],
      groundingFallback: true,
    });
    expect(selectContent(request, [fallback])).toEqual({ kind: 'grounding-fallback', unit: fallback });
  });

  it('returns unavailable when the safe fallback was already delivered', () => {
    const fallback = approvedUnit({
      id: 'fallback-1', passageId: 'Psalm.23.1-4', moodTags: [],
      intensities: ['mild', 'moderate', 'strong'], movements: ['ground'], groundingFallback: true,
    });
    expect(selectContent({ ...request, deliveredPassageIds: ['Psalm.23.1-4'] }, [fallback]))
      .toEqual({ kind: 'unavailable' });
  });
});
