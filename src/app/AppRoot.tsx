import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type Intensity, emotionOptions } from '../domain/checkIn';
import { developmentScriptureUnit } from '../domain/content';
import type { HealthyDirection } from '../domain/direction';
import { defaultNotificationSettings, type NotificationMode, type NotificationSettings } from '../domain/notifications';
import { confirmTimezoneChange, observeTimezone } from '../domain/scheduleRecovery';
import { sadnessSupportFor } from '../safety/policy';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { SelectionChip } from '../ui/components/SelectionChip';
import { colors, radius, spacing } from '../ui/theme';
import {
  chooseDirection, confirmProposedDirection, createCheckInDraft, selectUnknownMood,
  setDraftIntensity, toggleDraftEmotion,
} from './checkInViewModel';
import { getScreenModel } from './screenModel';
import { initialAppSession, reduceAppSession } from './session';
import { createSessionController } from './sessionController';
import { createAsyncStorageSessionRepository } from '../infrastructure/asyncStorageSessionRepository';
import { createAsyncStorageNotificationSettings } from '../infrastructure/asyncStorageNotificationSettings';
import { createExpoNotificationPlatform } from '../infrastructure/expoNotificationPlatform';
import { synchronizeDailyNotifications, type NotificationSyncResult } from './notificationScheduler';

const sessionController = createSessionController(createAsyncStorageSessionRepository());
const notificationSettingsRepository = createAsyncStorageNotificationSettings();
const notificationPlatform = createExpoNotificationPlatform();

const directionCopy: Record<HealthyDirection, { title: string; description: string }> = {
  'acknowledge-and-ground': { title: 'Be met, then grounded', description: 'Name what is real before moving gently toward steadiness.' },
  'sustain-with-gratitude': { title: 'Sustain this with gratitude', description: 'Let joy or peace deepen through gratitude, wisdom, and generosity.' },
  'gentle-awareness': { title: 'Begin with gentle awareness', description: 'Start without forcing a label, and notice what becomes clearer.' },
};

export function AppRoot() {
  const [session, setSession] = useState(initialAppSession);
  const [now, setNow] = useState(() => new Date());
  const [hydrated, setHydrated] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>();
  const [notificationResult, setNotificationResult] = useState<NotificationSyncResult>();
  const [pendingTimezone, setPendingTimezone] = useState<string>();
  const [timezoneNote, setTimezoneNote] = useState<string>();
  const [explicitReminderChoice, setExplicitReminderChoice] = useState(false);
  const persistIntent = useRef<'save' | 'clear'>('save');
  const skippedHydrationWrite = useRef(false);
  const model = getScreenModel(session, now);
  const meaningfulUnitVisible = model.screen === 'journey' && model.showScripture;
  const showStrongSadnessSupport = session.journey
    ? sadnessSupportFor(session.journey.currentCheckIn) === 'gentle-nudge'
    : false;
  const selections = session.draft.checkIn.kind === 'known' ? session.draft.checkIn.selections : [];
  const dispatch = (event: Parameters<typeof reduceAppSession>[1]) => {
    persistIntent.current = event.type === 'reset-session' ? 'clear' : 'save';
    setSession((current) => reduceAppSession(current, event));
  };

  useEffect(() => {
    let active = true;
    void sessionController.hydrate(new Date()).then((result) => {
      if (!active) return;
      setSession(result.session);
      setPersistenceAvailable(result.persistenceAvailable);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void notificationSettingsRepository.load().then((saved) => {
      if (!active) return;
      const resolved = saved ?? defaultNotificationSettings(deviceTimezone());
      setNotificationSettings(resolved);
      const observed = deviceTimezone();
      if (resolved.timezone !== observed) setPendingTimezone(observed);
    }).catch(() => {
      if (active) setNotificationSettings(defaultNotificationSettings(deviceTimezone()));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!skippedHydrationWrite.current) {
      skippedHydrationWrite.current = true;
      return;
    }
    const operation = persistIntent.current === 'clear'
      ? sessionController.clear()
      : sessionController.save(session, new Date());
    void operation.then(setPersistenceAvailable);
  }, [hydrated, session]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(new Date());
        const observed = deviceTimezone();
        if (notificationSettings && observed !== notificationSettings.timezone) setPendingTimezone(observed);
      }
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [notificationSettings]);

  useEffect(() => {
    if (!hydrated || !notificationSettings || model.screen !== 'journey' || !session.journey) return;
    void synchronizeDailyNotifications(notificationPlatform, {
      localDate: session.journey.localDate,
      settings: notificationSettings,
      now,
      hasOpenedMeaningfulUnit: meaningfulUnitVisible,
      explicitlyEnabledReminders: explicitReminderChoice,
    }).then(setNotificationResult).catch(() => undefined);
  }, [explicitReminderChoice, hydrated, meaningfulUnitVisible, model.screen, notificationSettings, now, session.journey]);

  const chooseNotificationMode = (mode: NotificationMode) => {
    if (!notificationSettings) return;
    const next: NotificationSettings = {
      mode,
      timezone: notificationSettings.timezone,
      closingReminder: notificationSettings.closingReminder,
      ...(mode === 'gentle' ? { gentleTime: notificationSettings.gentleTime ?? { hour: 9, minute: 0 } } : {}),
    };
    setExplicitReminderChoice(mode !== 'silent');
    setNotificationSettings(next);
    void notificationSettingsRepository.save(next);
  };

  const acceptTimezone = () => {
    if (!pendingTimezone || !notificationSettings) return;
    if (session.journey) {
      const observation = observeTimezone({
        selectedTimezone: notificationSettings.timezone,
        confirmedScheduleTimezone: notificationSettings.timezone,
      }, pendingTimezone);
      const result = confirmTimezoneChange(session.journey, observation.state, new Date());
      if (result.status === 'new-local-day-required') {
        setTimezoneNote('The new timezone is already on a different calendar day. Your current day was kept unchanged to prevent duplicate journeys.');
        setPendingTimezone(undefined);
        return;
      }
      setSession((current) => ({ ...current, journey: result.journey }));
    }
    const next = { ...notificationSettings, timezone: pendingTimezone };
    setNotificationSettings(next);
    void notificationSettingsRepository.save(next);
    setPendingTimezone(undefined);
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

      {!hydrated && (
        <View style={styles.stack} accessibilityLiveRegion="polite">
          <Text style={styles.kicker}>Preparing today</Text>
          <Text style={styles.title}>Returning to your day gently.</Text>
          <Text style={styles.body}>Your current journey is being restored on this device.</Text>
        </View>
      )}

      {hydrated && !persistenceAvailable && (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <Text style={styles.noticeText}>This device could not save your journey. You can continue, but today may not be restored after the app closes.</Text>
        </View>
      )}

      {hydrated && pendingTimezone && (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <Text style={styles.noticeText}>Your device timezone changed to {pendingTimezone}. Use it for the remaining schedule?</Text>
          <PrimaryButton label="Use new timezone" onPress={acceptTimezone} />
          <Pressable accessibilityRole="button" onPress={() => setPendingTimezone(undefined)}>
            <Text style={styles.textButton}>Keep my current schedule</Text>
          </Pressable>
        </View>
      )}

      {hydrated && timezoneNote && (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <Text style={styles.noticeText}>{timezoneNote}</Text>
          <Pressable accessibilityRole="button" onPress={() => setTimezoneNote(undefined)}>
            <Text style={styles.textButton}>Dismiss</Text>
          </Pressable>
        </View>
      )}

      {hydrated && model.screen === 'welcome' && (
        <View style={styles.stack}>
          <Text style={styles.title}>Meet this day with Scripture.</Text>
          <Text style={styles.body}>Begin with how you honestly feel. Scripture, reflection, and prayer will meet the day gently.</Text>
          <View style={styles.note}><Text style={styles.noteText}>For adults 18 and over. Spiritual support—not therapy, diagnosis, crisis care, prophecy, or a replacement for church or professional care.</Text></View>
          <PrimaryButton label="I’m 18 or older — begin" onPress={() => dispatch({ type: 'attest-adult' })} />
          <Text style={styles.quiet}>Saved on this device for today · No streaks · No scores</Text>
        </View>
      )}

      {hydrated && model.screen === 'check-in' && (
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

      {hydrated && model.screen === 'direction' && session.draft.proposedDirection && (
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

      {hydrated && model.screen === 'journey' && (
        <View style={styles.stack}>
          {model.notices.map((notice) => <View key={notice} style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View>)}
          {showStrongSadnessSupport && (
            <View style={styles.note} accessibilityLiveRegion="polite">
              <Text style={styles.noteText}>You do not have to move quickly through this. If it would help, consider talking with someone you trust—a friend, family member, pastor, or qualified professional.</Text>
            </View>
          )}
          {model.showScripture ? (
            <>
              <Text style={styles.kicker}>{model.timeline.current?.label}</Text>
              <Text style={styles.reference}>{developmentScriptureUnit.reference}</Text>
              <Text style={styles.scripture}>“{developmentScriptureUnit.scriptureText}”</Text>
              <Text style={styles.body}>{developmentScriptureUnit.context}</Text>
              <View style={styles.rule} />
              <Text style={styles.prompt}>{developmentScriptureUnit.reflectionPrompt}</Text>
              <Text style={styles.prayer}>{developmentScriptureUnit.prayer}</Text>
              <View style={styles.note}><Text style={styles.noteText}>Development fixture only. It cannot ship until licensing and pastor, scholar, safety, and final approvals are recorded.</Text></View>
            </>
          ) : (
            <>
              <Text style={styles.kicker}>Today’s journey</Text>
              <Text style={styles.title}>Your first moment will be ready soon.</Text>
              <Text style={styles.body}>There is nothing to catch up. Return when the day begins.</Text>
            </>
          )}
          {model.timeline.nextAvailableAt && <Text style={styles.meta}>Another moment becomes available at {formatTime(model.timeline.nextAvailableAt)}. No reminder is required.</Text>}
          {notificationSettings && (
            <View style={styles.reminderPanel}>
              <Text style={styles.prompt}>Reminders</Text>
              <Text style={styles.body}>Scripture still appears quietly every 30 minutes. Choose how often this app may interrupt you.</Text>
              <View style={styles.chips}>
                {(['gentle', 'rhythm', 'companion', 'silent'] as const).map((mode) => (
                  <SelectionChip key={mode} label={mode} selected={notificationSettings.mode === mode}
                    onPress={() => chooseNotificationMode(mode)} />
                ))}
              </View>
              <Text style={styles.meta}>{reminderDescription(notificationSettings.mode)}</Text>
              {notificationResult?.status === 'permission-denied' && (
                <Text style={styles.noticeText}>Notifications are off in your device settings. Your private timeline will still update.</Text>
              )}
            </View>
          )}
          <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'reset-session' })}><Text style={styles.textButton}>End this preview</Text></Pressable>
        </View>
      )}

      {hydrated && model.screen === 'day-closed' && (
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

function deviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
}

function reminderDescription(mode: NotificationMode): string {
  if (mode === 'silent') return 'Silent · no notifications';
  if (mode === 'gentle') return 'Gentle · one daily invitation at 9:00 a.m.';
  if (mode === 'companion') return 'Companion · Rhythm plus optional two-hour check-in invitations';
  return 'Rhythm · three invitations at 8:00 a.m., 2:00 p.m., and 8:00 p.m.';
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 48, backgroundColor: colors.canvas },
  stack: { gap: spacing.md, marginTop: 56 }, eyebrow: { color: colors.forest, fontSize: 12, letterSpacing: 1.8, fontWeight: '700' },
  kicker: { color: colors.gold, fontSize: 14, fontWeight: '700' }, title: { color: colors.ink, fontSize: 42, lineHeight: 48, fontWeight: '600', letterSpacing: -1.2 },
  body: { color: colors.muted, fontSize: 17, lineHeight: 27 }, quiet: { color: colors.muted, fontSize: 13, textAlign: 'center' }, meta: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  note: { backgroundColor: colors.forestSoft, borderRadius: radius.md, padding: spacing.md }, noteText: { color: colors.forest, fontSize: 14, lineHeight: 21 },
  notice: { borderWidth: 1, borderColor: colors.gold, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface },
  noticeText: { color: colors.ink, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  textButton: { minHeight: 44, color: colors.forest, fontSize: 15, fontWeight: '700', textAlign: 'center', padding: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, intensityCard: { gap: spacing.sm, paddingTop: spacing.xs },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  segment: { minHeight: 44, flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.surface }, segmentSelected: { backgroundColor: colors.forestSoft },
  segmentText: { color: colors.muted, textTransform: 'capitalize' }, segmentTextSelected: { color: colors.forest, fontWeight: '700', textTransform: 'capitalize' },
  directionOption: { minHeight: 72, gap: spacing.xs, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  directionOptionSelected: { borderColor: colors.forest, backgroundColor: colors.forestSoft }, reference: { color: colors.forest, fontSize: 20, fontWeight: '700' },
  scripture: { color: colors.ink, fontSize: 32, lineHeight: 43, fontWeight: '500' }, rule: { width: 48, height: 2, backgroundColor: colors.gold, marginVertical: spacing.sm },
  prompt: { color: colors.ink, fontSize: 19, lineHeight: 29, fontWeight: '600' }, prayer: { color: colors.muted, fontSize: 16, lineHeight: 26, fontStyle: 'italic' },
  reminderPanel: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.lg, marginTop: spacing.md },
});
