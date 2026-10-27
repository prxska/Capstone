import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useEffect } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { AttentionAlertData } from '../lib/attentionAlerts';
import { OWNER_PROFILE_ID } from '../lib/careProfiles';
import { formatDose, formatStock, getStockDaysLeft, LOW_STOCK_DAYS, parseDoseAmount } from '../lib/doseSchedule';

const monthNames = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Si el APK instalado aún no incluye expo-audio, la alerta funciona igual pero sin alarma sonora
let ExpoAudio: typeof import('expo-audio') | null = null;
try {
  ExpoAudio = require('expo-audio');
} catch {
  console.warn('expo-audio no está en este build: la alerta no reproducirá la alarma.');
}

const ALARM_SOURCE = require('../../assets/sounds/meditrack_alarm.wav');
// La alarma se detiene sola si nadie la atiende
const MAX_RING_MS = 2 * 60 * 1000;
const RING_VIBRATION = [0, 1000, 500];

function formatLongDate(dateKey: string) {
  const date = new Date(dateKey + 'T00:00:00');
  return `${weekDays[date.getDay()]} ${date.getDate()} de ${monthNames[date.getMonth()]}`;
}

type Props = {
  alert: AttentionAlertData | null;
  // Registros cargados: se usan para mostrar la foto y el stock más recientes (las URL firmadas expiran)
  events: any[];
  onClose: () => void;
  // "Ya lo tomé": descuenta la dosis del stock
  onTaken: (alert: AttentionAlertData) => void;
};

export function AttentionAlertModal({ alert, events, onClose, onTaken }: Props) {
  const { isDarkMode, largeFont, voiceAlerts } = useTheme();

  const isMedication = alert?.kind === 'medication';
  const current = alert ? events.find((e) => e.id === alert.eventId) : null;
  const forWhom = alert?.profileId && alert.profileId !== OWNER_PROFILE_ID ? alert.patient : '';
  const dose = current?.dose || alert?.dose || '';
  const doseText = formatDose(dose);

  useEffect(() => {
    if (!alert) return;

    // Vibración larga que se repite hasta cerrar la ventana
    Vibration.vibrate(RING_VIBRATION, true);

    const player = ExpoAudio?.createAudioPlayer(ALARM_SOURCE) ?? null;
    if (player) {
      player.loop = true;
      player.volume = 1;
      void ExpoAudio!.setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      player.play();
    }

    let speechTimer: ReturnType<typeof setTimeout> | undefined;
    if (voiceAlerts) {
      const who = forWhom ? `Para ${forWhom}. ` : '';
      const message = isMedication
        ? `${who}Es hora de tomar ${alert.medication || alert.title}. ${doseText ? `Tomar ${doseText}.` : ''}`
        : `${who}Mañana a las ${alert.time} hay una cita médica${alert.specialty ? ` de ${alert.specialty}` : ''}${alert.doctor ? ` con ${alert.doctor}` : ''}${alert.location ? `, en ${alert.location}` : ''}.`;
      // Tras unos segundos de alarma se pausa para que la voz se escuche, y luego sigue sonando
      speechTimer = setTimeout(() => {
        player?.pause();
        Speech.speak(message, {
          language: 'es-ES',
          rate: 0.9,
          onDone: () => player?.play(),
          onError: () => player?.play(),
        });
      }, 4000);
    }

    const stopTimer = setTimeout(() => {
      player?.pause();
      Vibration.cancel();
    }, MAX_RING_MS);

    return () => {
      clearTimeout(speechTimer);
      clearTimeout(stopTimer);
      Vibration.cancel();
      void Speech.stop();
      player?.pause();
      player?.remove();
    };
  }, [alert]);

  if (!alert) return null;

  const photoUri = isMedication ? current?.photoUri || alert.photoUri : '';
  const stock: number | null = isMedication ? current?.stock ?? null : null;
  // Stock que quedará después de esta toma
  const stockAfter = stock == null ? null : Math.max(0, stock - parseDoseAmount(dose));
  const daysLeftAfter = stockAfter == null || !current ? null : getStockDaysLeft({ ...current, stock: stockAfter });
  const accent = isMedication ? '#0284C7' : '#D97706';
  const textColor = isDarkMode ? '#F1F5F9' : '#102A43';
  const subColor = isDarkMode ? '#CBD5E1' : '#334155';
  const big = largeFont ? 4 : 0;

  const rows: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = isMedication
    ? [
        { icon: 'medical', text: `Tomar ${doseText || 'la dosis indicada'}` },
        { icon: 'time-outline', text: alert.time },
        ...(stockAfter != null ? [{ icon: 'cube-outline' as const, text: `Quedarán ${formatStock(stockAfter, dose)}` }] : []),
      ]
    : [
        { icon: 'calendar-outline', text: `${formatLongDate(alert.date)}, ${alert.time}` },
        ...(alert.doctor ? [{ icon: 'person-outline' as const, text: alert.doctor }] : []),
        ...(alert.specialty ? [{ icon: 'medkit-outline' as const, text: alert.specialty }] : []),
        ...(alert.location ? [{ icon: 'location-outline' as const, text: alert.location }] : []),
      ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, isDarkMode && { backgroundColor: '#1E293B' }]}>
          <View style={[styles.header, { backgroundColor: accent }]}>
            <Ionicons name={isMedication ? 'alarm' : 'calendar'} size={34} color="#FFF" />
            <View style={{ flexShrink: 1 }}>
              {forWhom ? (
                <Text style={[styles.forWhom, { fontSize: 18 + big }]}>Para {forWhom}</Text>
              ) : null}
              <Text style={[styles.headerText, { fontSize: 22 + big }]}>
                {isMedication ? 'Hora del medicamento' : 'Mañana hay cita médica'}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            ) : null}

            <Text style={[styles.title, { color: textColor, fontSize: 28 + big }]} numberOfLines={3}>
              {isMedication ? alert.medication || alert.title : alert.specialty || alert.title}
            </Text>

            {rows.map((row) => (
              <View key={row.icon} style={styles.row}>
                <Ionicons name={row.icon} size={24 + big} color={accent} />
                <Text style={[styles.rowText, { color: subColor, fontSize: 20 + big }]}>{row.text}</Text>
              </View>
            ))}

            {daysLeftAfter != null && daysLeftAfter <= LOW_STOCK_DAYS ? (
              <View style={styles.lowStock}>
                <Ionicons name="warning" size={22} color="#B45309" />
                <Text style={[styles.lowStockText, { fontSize: 17 + big }]}>
                  {stockAfter === 0 ? 'Se acabó este medicamento. Compra más.' : 'Quedan pocas: compra más pronto.'}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: accent }]}
              onPress={() => (isMedication ? onTaken(alert) : onClose())}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { fontSize: 20 + big }]}>
                {isMedication ? 'Ya lo tomé' : 'Entendido'}
              </Text>
            </TouchableOpacity>

            {isMedication ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={onClose} accessibilityRole="button">
                <Text style={[styles.secondaryButtonText, { color: subColor, fontSize: 18 + big }]}>Cerrar sin marcar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  card: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 18 },
  forWhom: { color: '#FFF', fontWeight: '700', opacity: 0.95 },
  headerText: { color: '#FFF', fontWeight: '800' },
  body: { padding: 22 },
  photo: { width: '100%', height: 180, borderRadius: 16, marginBottom: 16, backgroundColor: '#E2E8F0' },
  title: { fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  rowText: { fontWeight: '600', flexShrink: 1 },
  lowStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  lowStockText: { color: '#92400E', fontWeight: '700', flexShrink: 1 },
  button: { marginTop: 14, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '800' },
  secondaryButton: { marginTop: 6, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '600' },
});
