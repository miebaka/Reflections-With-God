import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type Intensity, emotionOptions } from '../domain/checkIn';
import { developmentScriptureUnit } from '../domain/content';
import type { HealthyDirection } from '../domain/direction';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { SelectionChip } from '../ui/components/SelectionChip';
import { colors, radius, spacing } from '../ui/theme';
import {
  chooseDirection, confirmProposedDirection, createCheckInDraft, selectUnknownMood,
  setDraftIntensity, toggleDraftEmotion,
} from './checkInViewModel';
import { getScreenModel } from './screenModel';
import { initialAppSession, reduceAppSession } from './session';

const directionCopy: Record<HealthyDirection, { title: string; description: string }> = {
  'acknowledge-and-ground': { title: 'Be met, then grounded', description: 'Name what is real before moving gently toward steadiness.' },
  'sustain-with-gratitude': { title: 'Sustain this with gratitude', description: 'Let joy or peace deepen through gratitude, wisdom, and generosity.' },
  'gentle-awareness': { title: 'Begin with gentle awareness', description: 'Start without forcing a label, and notice what becomes clearer.' },
};

export function AppRoot() {
  const [session, setSession] = useState(initialAppSession);
  const model = getScreenModel(session, new Date());
  const selections = session.draft.checkIn.kind === 'known' ? session.draft.checkIn.selections : [];
  const dispatch = (event: Parameters<typeof reduceAppSession>[1]) => {
    setSession((current) => reduceAppSession(current, event));
  };

  const chooseUnknown = () => {
    setSession((current) => reduceAppSession(
      reduceAppSession(current, { type: 'update-draft', draft: selectUnknownMood(current.draft) }),
      { type: 'show-direction' },
    ));
  };

  const confirmDirection = () => {
    setSession((current) => {
      const confirmed = confirmProposedDirection(current.draft);
      const updated = reduceAppSession(current, { type: 'update-draft', draft: confirmed });
      return reduceAppSession(updated, { type: 'confirm-direction', now: new Date() });
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>REFLECTIONS WITH GOD</Text>

      {model.screen === 'welcome' && (
        <View style={styles.stack}>
          <Text style={styles.title}>Meet this day with Scripture.</Text>
          <Text style={styles.body}>Begin with how you honestly feel. Scripture, reflection, and prayer will meet the day gently.</Text>
          <View style={styles.note}><Text style={styles.noteText}>For adults 18 and over. Spiritual support—not therapy, diagnosis, crisis care, prophecy, or a replacement for church or professional care.</Text></View>
          <PrimaryButton label="I’m 18 or older — begin" onPress={() => dispatch({ type: 'attest-adult' })} />
          <Text style={styles.quiet}>Memory-only preview · No streaks · No scores</Text>
        </View>
      )}

      {model.screen === 'check-in' && (
        <View style={styles.stack}>
          <Text style={styles.kicker}>Morning check-in</Text>
          <Text style={styles.title}>What are you carrying today?</Text>
          <Text style={styles.body}>Choose up to three feelings. None needs to be the “main” one.</Text>
          <Text style={styles.meta}>{selections.length} of 3 selected</Text>
          <View style={styles.chips}>
            {emotionOptions.map((emotion) => (
              <SelectionChip key={emotion} label={emotion}
                selected={selections.some((item) => item.emotion === emotion)}
                onPress={() => dispatch({ type: 'update-draft', draft: toggleDraftEmotion(session.draft, emotion) })} />
            ))}
          </View>
          {selections.map(({ emotion, intensity }) => (
            <View key={emotion} style={styles.intensityCard}>
              <Text style={styles.meta}>How strongly do you feel {emotion}?</Text>
              <View style={styles.segmented}>
                {(['mild', 'moderate', 'strong'] as const).map((value: Intensity) => (
                  <Pressable accessibilityRole="radio" accessibilityState={{ selected: intensity === value }} key={value}
                    onPress={() => dispatch({ type: 'update-draft', draft: setDraftIntensity(session.draft, emotion, value) })}
                    style={[styles.segment, intensity === value && styles.segmentSelected]}>
                    <Text style={intensity === value ? styles.segmentTextSelected : styles.segmentText}>{intensity === value ? `✓ ${value}` : value}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <PrimaryButton label="Continue" disabled={selections.length === 0} onPress={() => dispatch({ type: 'show-direction' })} />
          <Pressable accessibilityRole="button" onPress={chooseUnknown}><Text style={styles.textButton}>I don’t know how I feel</Text></Pressable>
        </View>
      )}

      {model.screen === 'direction' && session.draft.proposedDirection && (
        <View style={styles.stack}>
          <Text style={styles.kicker}>A gentle direction</Text>
          <Text style={styles.title}>How should Scripture meet you today?</Text>
          <Text style={styles.body}>This is a suggestion, not a verdict. Choose what feels most honest.</Text>
          {(Object.keys(directionCopy) as HealthyDirection[]).map((direction) => {
            const selected = session.draft.proposedDirection === direction;
            return (
              <Pressable accessibilityRole="radio" accessibilityState={{ selected }} key={direction}
                onPress={() => dispatch({ type: 'update-draft', draft: chooseDirection(session.draft, direction) })}
                style={[styles.directionOption, selected && styles.directionOptionSelected]}>
                <Text style={styles.prompt}>{selected ? '✓ ' : ''}{directionCopy[direction].title}</Text>
                <Text style={styles.body}>{directionCopy[direction].description}</Text>
              </Pressable>
            );
          })}
          <PrimaryButton label="Use this direction" onPress={confirmDirection} />
          <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'show-check-in' })}><Text style={styles.textButton}>Back to my feelings</Text></Pressable>
        </View>
      )}

      {model.screen === 'journey' && (
        <View style={styles.stack}>
          <Text style={styles.kicker}>{model.timeline.current?.label ?? 'Today’s journey'}</Text>
          <Text style={styles.reference}>{developmentScriptureUnit.reference}</Text>
          <Text style={styles.scripture}>“{developmentScriptureUnit.scriptureText}”</Text>
          <Text style={styles.body}>{developmentScriptureUnit.context}</Text>
          <View style={styles.rule} />
          <Text style={styles.prompt}>{developmentScriptureUnit.reflectionPrompt}</Text>
          <Text style={styles.prayer}>{developmentScriptureUnit.prayer}</Text>
          <View style={styles.note}><Text style={styles.noteText}>Development fixture only. It cannot ship until licensing and pastor, scholar, safety, and final approvals are recorded.</Text></View>
          {model.timeline.nextAvailableAt && <Text style={styles.meta}>Another moment becomes available at {formatTime(model.timeline.nextAvailableAt)}. No reminder is required.</Text>}
          <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'reset-session' })}><Text style={styles.textButton}>End this preview</Text></Pressable>
        </View>
      )}

      {model.screen === 'day-closed' && (
        <View style={styles.stack}>
          <Text style={styles.kicker}>Day complete</Text>
          <Text style={styles.title}>{model.title}</Text>
          <Text style={styles.body}>{model.message}</Text>
          <PrimaryButton label="Return to welcome" onPress={() => dispatch({ type: 'reset-session' })} />
        </View>
      )}
    </ScrollView>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 48, backgroundColor: colors.canvas },
  stack: { gap: spacing.md, marginTop: 56 }, eyebrow: { color: colors.forest, fontSize: 12, letterSpacing: 1.8, fontWeight: '700' },
  kicker: { color: colors.gold, fontSize: 14, fontWeight: '700' }, title: { color: colors.ink, fontSize: 42, lineHeight: 48, fontWeight: '600', letterSpacing: -1.2 },
  body: { color: colors.muted, fontSize: 17, lineHeight: 27 }, quiet: { color: colors.muted, fontSize: 13, textAlign: 'center' }, meta: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  note: { backgroundColor: colors.forestSoft, borderRadius: radius.md, padding: spacing.md }, noteText: { color: colors.forest, fontSize: 14, lineHeight: 21 },
  textButton: { minHeight: 44, color: colors.forest, fontSize: 15, fontWeight: '700', textAlign: 'center', padding: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, intensityCard: { gap: spacing.sm, paddingTop: spacing.xs },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  segment: { minHeight: 44, flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.surface }, segmentSelected: { backgroundColor: colors.forestSoft },
  segmentText: { color: colors.muted, textTransform: 'capitalize' }, segmentTextSelected: { color: colors.forest, fontWeight: '700', textTransform: 'capitalize' },
  directionOption: { minHeight: 72, gap: spacing.xs, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  directionOptionSelected: { borderColor: colors.forest, backgroundColor: colors.forestSoft }, reference: { color: colors.forest, fontSize: 20, fontWeight: '700' },
  scripture: { color: colors.ink, fontSize: 32, lineHeight: 43, fontWeight: '500' }, rule: { width: 48, height: 2, backgroundColor: colors.gold, marginVertical: spacing.sm },
  prompt: { color: colors.ink, fontSize: 19, lineHeight: 29, fontWeight: '600' }, prayer: { color: colors.muted, fontSize: 16, lineHeight: 26, fontStyle: 'italic' },
});
