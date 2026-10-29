import { describe, expect, it } from 'vitest';
import { contrastRatio, meetsNormalTextContrast } from './accessibility';
import { colors } from './theme';

describe('accessibility color contracts', () => {
  it.each([
    ['ink on canvas', colors.ink, colors.canvas],
    ['muted on canvas', colors.muted, colors.canvas],
    ['gold on canvas', colors.gold, colors.canvas],
    ['ink on surface', colors.ink, colors.surface],
    ['forest on soft', colors.forest, colors.forestSoft],
    ['white on forest', colors.white, colors.forest],
  ])('%s meets WCAG AA normal-text contrast', (_label, foreground, background) => {
    expect(meetsNormalTextContrast(foreground, background)).toBe(true);
  });

  it('rejects malformed color input', () => {
    expect(() => contrastRatio('#fff', colors.canvas)).toThrow('six-digit');
  });
});
