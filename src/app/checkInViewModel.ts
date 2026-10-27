import {
  type Emotion,
  type Intensity,
  type MoodCheckIn,
  toggleEmotionSelection,
  updateEmotionIntensity,
  validateCheckIn,
} from '../domain/checkIn';
import { type HealthyDirection, proposeDirection } from '../domain/direction';

export type CheckInDraft = {
  checkIn: MoodCheckIn;
  proposedDirection?: HealthyDirection;
  confirmedDirection?: HealthyDirection;
};

export function createCheckInDraft(): CheckInDraft {
  return { checkIn: { kind: 'known', selections: [] } };
}

export function toggleDraftEmotion(draft: CheckInDraft, emotion: Emotion): CheckInDraft {
  const current = draft.checkIn.kind === 'known' ? draft.checkIn.selections : [];
  return withFreshProposal({ kind: 'known', selections: toggleEmotionSelection(current, emotion) });
}

export function setDraftIntensity(
  draft: CheckInDraft,
  emotion: Emotion,
  intensity: Intensity,
): CheckInDraft {
  if (draft.checkIn.kind === 'unknown') return draft;
  return withFreshProposal({
    ...draft.checkIn,
    selections: updateEmotionIntensity(draft.checkIn.selections, emotion, intensity),
  });
}

export function selectUnknownMood(_draft: CheckInDraft): CheckInDraft {
  return withFreshProposal({ kind: 'unknown' });
}

export function chooseDirection(draft: CheckInDraft, direction: HealthyDirection): CheckInDraft {
  return { checkIn: draft.checkIn, proposedDirection: direction };
}

export function confirmProposedDirection(draft: CheckInDraft): CheckInDraft {
  if (!draft.proposedDirection) return draft;
  return { ...draft, confirmedDirection: draft.proposedDirection };
}

export function canSubmitCheckIn(draft: CheckInDraft): boolean {
  return validateCheckIn(draft.checkIn).length === 0
    && Boolean(draft.proposedDirection)
    && draft.confirmedDirection === draft.proposedDirection;
}

function withFreshProposal(checkIn: MoodCheckIn): CheckInDraft {
  if (checkIn.kind === 'known' && checkIn.selections.length === 0) return { checkIn };
  return { checkIn, proposedDirection: proposeDirection(checkIn).id };
}
