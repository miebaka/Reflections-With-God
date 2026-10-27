import type { SafetyInterruptionState } from './interruption';
import type { SupportResource } from './resources';

export type SafetyViewModel =
  | { visible: false }
  | {
    visible: true;
    title: string;
    message: string;
    trustedRoutes: readonly string[];
    resources: readonly Pick<SupportResource, 'id' | 'name' | 'contact' | 'availability'>[];
    confirmationLabel?: string;
  };

export function safetyViewModel(
  state: SafetyInterruptionState,
  verifiedResources: readonly SupportResource[],
): SafetyViewModel {
  if (state.status === 'clear') return { visible: false };
  if (state.status === 'awaiting-comfort') {
    return {
      visible: true,
      title: 'Stay with this pause.',
      message: 'A reviewed grounding passage will be offered before the ordinary journey continues.',
      trustedRoutes: [],
      resources: [],
    };
  }
  return {
    visible: true,
    title: 'Your safety matters more than continuing right now.',
    message: 'Please pause and reach someone who can be with you. If you may act soon or cannot stay safe, contact emergency support now.',
    trustedRoutes: [
      'Call or go to someone you trust nearby.',
      'Contact a pastor or mature Christian you know personally.',
      'Contact a qualified clinician or emergency service.',
    ],
    resources: verifiedResources.map(({ id, name, contact, availability }) => ({ id, name, contact, availability })),
    confirmationLabel: 'I am safe enough to continue',
  };
}
