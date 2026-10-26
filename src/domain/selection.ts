import type { ArcStage } from './arc';
import type { EmotionSelection } from './checkIn';
import { isPublishable, type ContentUnit, type PassageId } from './content';

export type SelectionRequest = {
  selections: readonly EmotionSelection[];
  arcStage: ArcStage;
  deliveredPassageIds: readonly PassageId[];
};

export type SelectionResult =
  | { kind: 'specific'; unit: ContentUnit }
  | { kind: 'grounding-fallback'; unit: ContentUnit }
  | { kind: 'unavailable' };

export function selectContent(request: SelectionRequest, catalogue: readonly ContentUnit[]): SelectionResult {
  const eligible = catalogue.filter((unit) => isEligible(unit, request));
  const specific = eligible.find((unit) => !unit.groundingFallback && matchesMood(unit, request));
  if (specific) return { kind: 'specific', unit: specific };
  const fallback = eligible.find((unit) => unit.groundingFallback);
  if (fallback) return { kind: 'grounding-fallback', unit: fallback };
  return { kind: 'unavailable' };
}

function isEligible(unit: ContentUnit, request: SelectionRequest): boolean {
  const selectedEmotions = request.selections.map(({ emotion }) => emotion);
  return isPublishable(unit)
    && !request.deliveredPassageIds.includes(unit.passageId)
    && unit.movements.includes(request.arcStage)
    && !selectedEmotions.some((emotion) => unit.contraindicatedEmotions.includes(emotion));
}

function matchesMood(unit: ContentUnit, request: SelectionRequest): boolean {
  return request.selections.some(({ emotion, intensity }) => (
    unit.moodTags.includes(emotion) && unit.intensities.includes(intensity)
  ));
}
