import type { ArcStage } from './arc';
import type { Emotion, Intensity } from './checkIn';

export type ContentStatus = 'draft' | 'approved' | 'retired';
export type PassageId = string;
export type ContentApprovals = { pastor: boolean; scholar: boolean; safety: boolean; final: boolean };

export type ContentUnit = {
  id: string; version: number; passageId: PassageId; reference: string; translationId: string;
  scriptureText: string; context: string; reflectionPrompt: string; prayer: string;
  moodTags: readonly Emotion[]; intensities: readonly Intensity[]; movements: readonly ArcStage[];
  contraindicatedEmotions: readonly Emotion[];
  deliveryClass: 'mood-responsive' | 'structured-study';
  groundingFallback: boolean; status: ContentStatus; approvals: ContentApprovals; approvedAt?: string;
};

export function isPublishable(unit: ContentUnit): boolean {
  return unit.status === 'approved'
    && unit.deliveryClass === 'mood-responsive'
    && unit.approvals.pastor && unit.approvals.scholar && unit.approvals.safety && unit.approvals.final
    && Boolean(unit.approvedAt);
}

// Development-only content. It is deliberately non-publishable and not a licensed package.
export const developmentScriptureUnit: ContentUnit = {
  id: 'dev-psalm-46-10-v1', version: 1, passageId: 'Psalm.46.10', reference: 'Psalm 46:10',
  translationId: 'DEVELOPMENT-FIXTURE', scriptureText: 'Be still, and know that I am God.',
  context: 'This invitation to stillness appears within a psalm that names upheaval honestly and rests in God’s presence.',
  reflectionPrompt: 'What would it mean to pause without pretending that everything is already resolved?',
  prayer: 'God, meet me honestly where I am. Help me become still enough to remember that you are present. In Jesus’ name, amen.',
  moodTags: ['anxious', 'overwhelmed', 'tired'], intensities: ['mild', 'moderate', 'strong'],
  movements: ['ground', 'comfort'], contraindicatedEmotions: [], deliveryClass: 'mood-responsive',
  groundingFallback: true, status: 'draft',
  approvals: { pastor: false, scholar: false, safety: false, final: false },
};
