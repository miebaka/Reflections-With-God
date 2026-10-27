import * as Notifications from 'expo-notifications';

import type { NotificationIntent, NotificationPermissionState } from '../domain/notifications';
import type { NotificationPlatform, ScheduledNotification } from '../app/notificationScheduler';

const owner = 'reflections-with-god-daily';
const channelId = 'reflection-reminders';

export function createExpoNotificationPlatform(): NotificationPlatform {
  return {
    async getPermission() {
      return permissionState((await Notifications.getPermissionsAsync()).status);
    },
    async requestPermission() {
      return permissionState((await Notifications.requestPermissionsAsync()).status);
    },
    async listOwned() {
      const requests = await Notifications.getAllScheduledNotificationsAsync();
      return requests.flatMap((request): ScheduledNotification[] => {
        const data = request.content.data;
        return data?.owner === owner && typeof data.notificationIntentId === 'string'
          ? [{ platformId: request.identifier, intentId: data.notificationIntentId }]
          : [];
      });
    },
    async schedule(intent: NotificationIntent) {
      await ensureLowImportanceChannel();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: intent.title,
          body: intent.body,
          data: { owner, notificationIntentId: intent.id },
          interruptionLevel: intent.interruptionLevel,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: intent.fireAt, channelId },
      });
    },
    async cancel(platformId) {
      await Notifications.cancelScheduledNotificationAsync(platformId);
    },
  };
}

function permissionState(status: Notifications.PermissionStatus): NotificationPermissionState {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

async function ensureLowImportanceChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Reflection reminders',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    vibrationPattern: null,
    enableVibrate: false,
    showBadge: false,
  });
}
