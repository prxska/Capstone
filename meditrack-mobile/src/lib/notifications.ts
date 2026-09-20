import { Platform } from 'react-native';

let Notifications: any = null;

try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn('expo-notifications no está disponible en este entorno');
}

export const AlarmService = {
  async init(): Promise<boolean> {
    if (!Notifications) return false;

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication-alarms', {
          name: 'Alarmas de Medicamentos',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500, 250, 500],
          lightColor: '#36B9CC',
          sound: 'default',
          enableVibrate: true,
          bypassDnd: false,
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (err) {
      console.warn('Error inicializando canal de alarmas:', err);
      return false;
    }
  },

  async triggerTestAlarm(seconds: number = 5): Promise<string | null> {
    if (!Notifications) return null;

    const hasPermission = await this.init();
    if (!hasPermission) return null;

    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Prueba de Alarma - MediTrack',
          body: 'El sistema de recordatorios está funcionando correctamente.',
          sound: 'default',
          android: {
            channelId: 'medication-alarms',
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: seconds,
          repeats: false,
        },
      });
    } catch (error) {
      console.error('Error disparando alarma de prueba:', error);
      return null;
    }
  },

  async scheduleRecipeAlarms(recipe: {
    id: string;
    medication: string;
    dose: string;
    startDate: string;
    endDate: string;
    startTime: string;
    intervalHours: number;
  }): Promise<string[]> {
    if (!Notifications) return [];

    const hasPermission = await this.init();
    if (!hasPermission) return [];

    const scheduledIds: string[] = [];
    const [startH, startM] = (recipe.startTime || '08:00').split(':').map(Number);
    const dosesPerDay = Math.floor(24 / recipe.intervalHours);

    const start = new Date(recipe.startDate + 'T00:00:00');
    const end = new Date(recipe.endDate + 'T23:59:59');

    const current = new Date(start);
    while (current <= end) {
      const y = current.getFullYear();
      const m = current.getMonth();
      const d = current.getDate();

      for (let i = 0; i < dosesPerDay; i++) {
        const doseHour = (startH + i * recipe.intervalHours) % 24;
        const triggerDate = new Date(y, m, d, doseHour, startM, 0);

        if (triggerDate.getTime() > Date.now()) {
          try {
            const notifId = await Notifications.scheduleNotificationAsync({
              content: {
                title: `⏰ Hora de tu medicamento: ${recipe.medication}`,
                body: `Dosis: ${recipe.dose}. ¡No olvides tomarla!`,
                data: { recipeId: recipe.id, medication: recipe.medication },
                sound: 'default',
                android: {
                  channelId: 'medication-alarms',
                  priority: Notifications.AndroidNotificationPriority.MAX,
                },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
              },
            });
            scheduledIds.push(notifId);
          } catch (error) {
            console.error('Error agendando alarma:', error);
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return scheduledIds;
  },

  async cancelAllAlarms() {
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('Error cancelando alarmas:', e);
    }
  },

  async cancelRecipeAlarms(alarmIds: string[]) {
    if (!Notifications) return;
    for (const id of alarmIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (err) {
        console.error('Error cancelando alarma:', err);
      }
    }
  },

  async getScheduledAlarms() {
    if (!Notifications) return [];
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (e) {
      return [];
    }
  },
};
