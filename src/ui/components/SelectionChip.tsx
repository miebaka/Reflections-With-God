import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme';

export function SelectionChip({ label, selected, onPress }: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress}
      style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{selected ? `✓ ${label}` : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: colors.line,
    borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.forest, backgroundColor: colors.forest },
  label: { color: colors.ink, fontSize: 15, textTransform: 'capitalize' },
  selectedLabel: { color: colors.white },
});
