import type { Emotion, Intensity } from './checkIn';

export type ReviewStatus = 'draft' | 'pastor-approved' | 'scholar-approved' | 'fully-approved';
export type ScriptureUnit = {
  id: string; reference: string; translation: 'WEB'; scriptureText: string;
  context: string; reflectionPrompt: string; prayer: string;
  emotions: readonly Emotion[]; intensities: readonly Intensity[];
  reviewStatus: ReviewStatus; reviewedAt?: string;
};

export function isPublishable(unit: ScriptureUnit): boolean {
  return unit.reviewStatus === 'fully-approved' && Boolean(unit.reviewedAt);
}

// Development-only content. Production builds must load a licensed, fully reviewed catalogue.
export const developmentScriptureUnit: ScriptureUnit = {
  id: 'dev-psalm-46-10', reference: 'Psalm 46:10', translation: 'WEB',
  scriptureText: 'Be still, and know that I am God.',
  context: 'This invitation to stillness appears within a psalm that names upheaval honestly and rests in God’s presence.',
  reflectionPrompt: 'What would it mean to pause without pretending that everything is already resolved?',
  prayer: 'God, meet me honestly where I am. Help me become still enough to remember that you are present. In Jesus’ name, amen.',
  emotions: ['anxious', 'overwhelmed', 'tired'], intensities: ['mild', 'moderate', 'strong'], reviewStatus: 'draft',
};
