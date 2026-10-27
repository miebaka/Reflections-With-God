import { describe, expect, it } from 'vitest';

import { safetyViewModel } from './viewModel';

describe('safety interruption copy', () => {
  it('prioritizes nearby human and professional support without diagnosis or spiritual promises', () => {
    const model = safetyViewModel({
      status: 'paused', policyId: 'policy-1', policyVersion: '1.0.0',
      interruptedAt: '2026-10-27T12:00:00.000Z',
    }, []);
    expect(model.visible).toBe(true);
    if (!model.visible) return;
    const copy = JSON.stringify(model);
    expect(copy).toContain('someone you trust nearby');
    expect(copy).toContain('qualified clinician');
    expect(copy).not.toMatch(/diagnos|God (?:will|guarantees)|Scripture is all|weak faith/i);
    expect(model.confirmationLabel).toBe('I am safe enough to continue');
  });

  it('does not expose the ordinary journey while a reviewed comfort unit is pending', () => {
    expect(safetyViewModel({
      status: 'awaiting-comfort', confirmedAt: '2026-10-27T12:01:00.000Z',
    }, [])).toMatchObject({ visible: true, title: 'Stay with this pause.' });
  });

  it('is absent during ordinary delivery', () => {
    expect(safetyViewModel({ status: 'clear' }, [])).toEqual({ visible: false });
  });
});
