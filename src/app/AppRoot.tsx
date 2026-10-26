import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type Emotion, type Intensity, emotionOptions } from '../domain/checkIn';
import { developmentScriptureUnit } from '../domain/content';
import { createDailyJourney, type DailyJourney } from '../domain/journey';
import { createEmotionalArc } from '../domain/arc';
import { proposeDirection } from '../domain/direction';
import { colors, radius, spacing } from '../ui/theme';

type Screen = 'welcome' | 'check-in' | 'journey';

export function AppRoot() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [emotions, setEmotions] = useState<readonly Emotion[]>([]);
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [journey, setJourney] = useState<DailyJourney | null>(null);
  const selectedLabel = useMemo(() => `${emotions.length} of 3 selected`, [emotions]);

  const startKnownJourney = () => {
    if (emotions.length === 0) return;
    const checkIn = {
      kind: 'known',
      selections: emotions.map((emotion) => ({ emotion, intensity })),
    } as const;
    const direction = proposeDirection(checkIn).id;
    setJourney(createDailyJourney(checkIn, createEmotionalArc(checkIn, direction), new Date()));
    setScreen('journey');
  };

  const startUnknownJourney = () => {
    const checkIn = { kind: 'unknown' } as const;
    setJourney(createDailyJourney(checkIn, createEmotionalArc(checkIn, 'gentle-awareness'), new Date()));
    setScreen('journey');
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>REFLECTIONS WITH GOD</Text>
      {screen === 'welcome' && (
        <View style={styles.stack}>
          <Text style={styles.title}>Meet this day with Scripture.</Text>
          <Text style={styles.body}>Begin with how you honestly feel. Your journey will respond gently through Scripture, reflection, and prayer.</Text>
          <View style={styles.note}><Text style={styles.noteText}>For adults 18 and over. This is spiritual support, not medical or crisis care.</Text></View>
          <PrimaryButton label="I’m 18 or older — begin" onPress={() => setScreen('check-in')} />
          <Text style={styles.quiet}>Private by design · No streaks · No scores</Text>
        </View>
      )}

      {screen === 'check-in' && (
        <View style={styles.stack}>
          <Text style={styles.kicker}>Morning check-in</Text>
          <Text style={styles.title}>What are you carrying today?</Text>
          <Text style={styles.body}>Choose up to three feelings. None needs to be the “main” one.</Text>
          <Text style={styles.meta}>{selectedLabel}</Text>
          <View style={styles.chips}>
            {emotionOptions.map((emotion) => {
              const selected = emotions.includes(emotion);
              return (
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} key={emotion}
                  onPress={() => setEmotions((current) => current.includes(emotion)
                    ? current.filter((item) => item !== emotion)
                    : current.length < 3 ? [...current, emotion] : current)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{emotion}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.kicker}>How strongly do you feel this?</Text>
          <View style={styles.segmented}>
            {(['mild', 'moderate', 'strong'] as const).map((value) => (
              <Pressable accessibilityRole="radio" accessibilityState={{ selected: intensity === value }} key={value}
                onPress={() => setIntensity(value)} style={[styles.segment, intensity === value && styles.segmentSelected]}>
                <Text style={intensity === value ? styles.segmentTextSelected : styles.segmentText}>{value}</Text>
              </Pressable>
            ))}
          </View>
          <PrimaryButton label="Begin today’s journey" disabled={emotions.length === 0} onPress={startKnownJourney} />
          <Pressable accessibilityRole="button" onPress={startUnknownJourney}><Text style={styles.textButton}>I don’t know how I feel</Text></Pressable>
        </View>
      )}

      {screen === 'journey' && journey && (
        <View style={styles.stack}>
          <Text style={styles.kicker}>Your opening reflection</Text>
          <Text style={styles.reference}>{developmentScriptureUnit.reference}</Text>
          <Text style={styles.scripture}>“{developmentScriptureUnit.scriptureText}”</Text>
          <Text style={styles.body}>{developmentScriptureUnit.context}</Text>
          <View style={styles.rule} />
          <Text style={styles.prompt}>{developmentScriptureUnit.reflectionPrompt}</Text>
          <Text style={styles.prayer}>{developmentScriptureUnit.prayer}</Text>
          <View style={styles.note}><Text style={styles.noteText}>Foundation preview: this draft unit cannot ship until pastor and biblical-scholar review is recorded.</Text></View>
          <Text style={styles.meta}>{journey.units.length} moments are planned through 10 p.m.; two-hour check-ins remain optional.</Text>
          <Pressable accessibilityRole="button" onPress={() => setScreen('check-in')}><Text style={styles.textButton}>Adjust how I feel</Text></Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={[styles.button, disabled && styles.buttonDisabled]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 48, backgroundColor: colors.canvas },
  stack: { gap: spacing.md, marginTop: 56 }, eyebrow: { color: colors.forest, fontSize: 12, letterSpacing: 1.8, fontWeight: '700' },
  kicker: { color: colors.gold, fontSize: 14, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 42, lineHeight: 48, fontWeight: '600', letterSpacing: -1.2 },
  body: { color: colors.muted, fontSize: 17, lineHeight: 27 }, quiet: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  meta: { color: colors.muted, fontSize: 13, fontWeight: '600' }, note: { backgroundColor: colors.forestSoft, borderRadius: radius.md, padding: spacing.md },
  noteText: { color: colors.forest, fontSize: 14, lineHeight: 21 }, button: { minHeight: 54, borderRadius: radius.md, backgroundColor: colors.forest, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.4 }, buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  textButton: { color: colors.forest, fontSize: 15, fontWeight: '700', textAlign: 'center', padding: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: colors.surface },
  chipSelected: { borderColor: colors.forest, backgroundColor: colors.forest }, chipText: { color: colors.ink, fontSize: 15, textTransform: 'capitalize' }, chipTextSelected: { color: colors.white },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  segment: { flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.surface }, segmentSelected: { backgroundColor: colors.forestSoft },
  segmentText: { color: colors.muted, textTransform: 'capitalize' }, segmentTextSelected: { color: colors.forest, fontWeight: '700', textTransform: 'capitalize' },
  reference: { color: colors.forest, fontSize: 20, fontWeight: '700' }, scripture: { color: colors.ink, fontSize: 32, lineHeight: 43, fontWeight: '500' },
  rule: { width: 48, height: 2, backgroundColor: colors.gold, marginVertical: spacing.sm }, prompt: { color: colors.ink, fontSize: 19, lineHeight: 29, fontWeight: '600' },
  prayer: { color: colors.muted, fontSize: 16, lineHeight: 26, fontStyle: 'italic' },
});
