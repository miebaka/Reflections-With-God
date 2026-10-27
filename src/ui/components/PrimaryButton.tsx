import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '../theme';

export function PrimaryButton({ label, onPress, disabled = false }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54, borderRadius: radius.md, backgroundColor: colors.forest,
    paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm,
  },
  disabled: { opacity: 0.4 },
  label: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
