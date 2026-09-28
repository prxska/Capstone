import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const ALARM_CLEANUP_KEY = '@meditrack_alarm_cleanup_complete_v1';

export async function clearLegacyMedicationAlarms() {
  if (await AsyncStorage.getItem(ALARM_CLEANUP_KEY)) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alarmNotifications = scheduled.filter((notification) => {
      const title = String(notification.content.title || '');
      return notification.content.data?.recipeId != null || /hora de tu medicamento|prueba de alarma/i.test(title);
    });

    for (const notification of alarmNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    await AsyncStorage.setItem(ALARM_CLEANUP_KEY, 'true');
  } catch (error) {
    console.warn('No se pudieron cancelar las alarmas antiguas de MediTrack:', error);
  }
}
