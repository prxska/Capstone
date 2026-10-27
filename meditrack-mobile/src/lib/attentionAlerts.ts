import Constants, { ExecutionEnvironment } from 'expo-constants';
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { calculateDoseTimes, formatDose, getIntervalHours } from './doseSchedule';

// expo-notifications no funciona completo en Expo Go (Android, SDK 53+): ahí no se programan alertas
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const Notifications: typeof import('expo-notifications') | null =
  Platform.OS === 'web' || isExpoGo ? null : require('expo-notifications');

// Android no deja cambiar el sonido de un canal ya creado: por eso el sufijo de versión
// El sonido de alarma llegó en el mismo build que expo-audio: si el APK instalado no lo tiene,
// se usa el canal anterior con el sonido normal (un canal creado sin su sonido queda mudo para siempre)
const HAS_ALARM_SOUND = Platform.OS !== 'web' && !!requireOptionalNativeModule('ExpoAudio');
const CHANNEL_ID = HAS_ALARM_SOUND ? 'meditrack-alerts-v3' : 'meditrack-alerts-v2';
const OLD_CHANNEL_IDS = HAS_ALARM_SOUND ? ['meditrack-alerts', 'meditrack-alerts-v2'] : ['meditrack-alerts'];
// Incluido en la app por el plugin de expo-notifications (app.json -> sounds)
const ALARM_SOUND = 'meditrack_alarm.wav';
// ~10 s de vibraciones largas, para que se note aunque el teléfono esté en el bolsillo
const VIBRATION_PATTERN = [0, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000];
const DAYS_AHEAD = 7;
// iOS admite 64 notificaciones pendientes; Android ~500 alarmas por app
const MAX_SCHEDULED = Platform.OS === 'ios' ? 60 : 150;
const APPOINTMENT_NOTICE_MS = 24 * 60 * 60 * 1000;

export type AttentionAlertData = {
  kind: 'medication' | 'appointment';
  eventId: string;
  // Perfil dueño del registro; 'owner' es el titular de la cuenta
  profileId?: string;
  title: string;
  time: string;
  date: string;
  patient?: string;
  medication?: string;
  dose?: string;
  photoUri?: string;
  doctor?: string;
  specialty?: string;
  location?: string;
};

function toLocalDate(dateKey: string, time: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildUpcomingAlerts(events: any[], now: Date) {
  const alerts: { triggerAt: Date; data: AttentionAlertData }[] = [];

  for (const event of events) {
    if (event.type === 'recipe') {
      const times = calculateDoseTimes(event.time, getIntervalHours(event.frequency));
      for (let offset = 0; offset <= DAYS_AHEAD; offset++) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
        const dateKey = toDateKey(day);
        if (dateKey < event.date || (event.endDate && dateKey > event.endDate)) continue;

        for (const time of times) {
          const triggerAt = toLocalDate(dateKey, time);
          if (triggerAt <= now) continue;
          alerts.push({
            triggerAt,
            data: {
              kind: 'medication',
              eventId: event.id,
              title: event.medication || event.title,
              medication: event.medication,
              dose: event.dose,
              photoUri: event.photoUri || '',
              patient: event.patient,
              profileId: event.profileId,
              time,
              date: dateKey,
            },
          });
        }
      }
    } else if (event.type === 'appointment' && event.date) {
      const appointmentAt = toLocalDate(event.date, event.time);
      const triggerAt = new Date(appointmentAt.getTime() - APPOINTMENT_NOTICE_MS);
      if (triggerAt <= now) continue;
      alerts.push({
        triggerAt,
        data: {
          kind: 'appointment',
          eventId: event.id,
          title: event.title,
          doctor: event.doctor,
          specialty: event.specialty,
          location: event.location,
          patient: event.patient,
          profileId: event.profileId,
          time: event.time,
          date: event.date,
        },
      });
    }
  }

  return alerts.sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime()).slice(0, MAX_SCHEDULED);
}

export function configureAttentionAlerts() {
  if (!Notifications) return;

  // Con la app abierta no se muestra el aviso del sistema: la ventana emergente hace sonar la alarma
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    OLD_CHANNEL_IDS.forEach((id) => void Notifications!.deleteNotificationChannelAsync(id).catch(() => {}));
    void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Medicamentos y citas',
      importance: Notifications.AndroidImportance.MAX,
      // Sin la clave `sound` el canal usa el sonido de notificación del teléfono
      ...(HAS_ALARM_SOUND
        ? {
            sound: ALARM_SOUND,
            // Suena con el volumen de alarma del teléfono, no con el de notificaciones
            audioAttributes: {
              usage: Notifications.AndroidAudioUsage.ALARM,
              contentType: Notifications.AndroidAudioContentType.SONIFICATION,
            },
          }
        : {}),
      vibrationPattern: VIBRATION_PATTERN,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

// Se pide una sola vez por sesión: al cerrar el diálogo la app vuelve a 'active' y se resincroniza
let askedThisSession = false;

async function ensurePermission() {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain || askedThisSession) return false;
  askedThisSession = true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

let syncQueue: Promise<void> = Promise.resolve();

/**
 * Reprograma todas las alertas de los próximos días a partir de los registros actuales.
 * Se llama cada vez que cambian los registros y al volver a abrir la app.
 */
export function syncAttentionAlerts(events: any[]) {
  syncQueue = syncQueue.then(async () => {
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (events.length === 0 || !(await ensurePermission())) return;

      for (const { triggerAt, data } of buildUpcomingAlerts(events, new Date())) {
        const isMedication = data.kind === 'medication';
        const forWhom = data.profileId && data.profileId !== 'owner' && data.patient ? `${data.patient}: ` : '';
        await Notifications.scheduleNotificationAsync({
          content: {
            title: isMedication
              ? `💊 ${forWhom}hora de tomar ${data.title}`
              : `📅 ${forWhom}mañana hay una cita médica`,
            body: isMedication
              ? `${formatDose(data.dose || '') || 'Tu dosis'} · ${data.time}`
              : `${data.title} · ${data.time}${data.location ? ` · ${data.location}` : ''}`,
            data,
            sound: HAS_ALARM_SOUND ? ALARM_SOUND : true,
            vibrate: VIBRATION_PATTERN,
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerAt,
            channelId: CHANNEL_ID,
          },
        });
      }
    } catch (error) {
      console.warn('No se pudieron programar las alertas de MediTrack:', error);
    }
  });
  return syncQueue;
}

export function cancelAttentionAlerts() {
  return syncAttentionAlerts([]);
}

/**
 * Avisa cuando llega una alerta con la app abierta o cuando la persona toca la notificación
 * (también si la app estaba cerrada). Devuelve la función para dejar de escuchar.
 */
export function listenForAttentionAlerts(onAlert: (data: AttentionAlertData) => void) {
  if (!Notifications) return () => {};

  const shown = new Set<string>();
  const handle = (notification: import('expo-notifications').Notification) => {
    const id = notification.request.identifier;
    const data = notification.request.content.data as unknown as AttentionAlertData;
    if (shown.has(id) || !data?.kind) return;
    shown.add(id);
    onAlert(data);
  };

  const received = Notifications.addNotificationReceivedListener(handle);
  const response = Notifications.addNotificationResponseReceivedListener((r) => handle(r.notification));

  // La app se abrió tocando una notificación
  void Notifications.getLastNotificationResponseAsync().then((r) => {
    if (r) {
      handle(r.notification);
      void Notifications.clearLastNotificationResponseAsync();
    }
  });

  return () => {
    received.remove();
    response.remove();
  };
}
