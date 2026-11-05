import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDoseTimes, getIntervalHours } from './doseSchedule';

const DOSE_LOG_KEY = '@meditrack_dose_log';
const KEEP_DAYS = 14;
// Hasta 30 minutos después es "hora de tomarla"; luego "atrasada"
const DUE_MINUTES = 30;
// Pasada 1 hora deja de sugerirse: tomarla tan tarde puede juntarla con la siguiente dosis
const LATE_MINUTES = 60;

export type DoseState = 'taken' | 'skipped';
export type DoseLog = Record<string, DoseState>;
export type DoseStatus = 'upcoming' | 'due' | 'late';

export function doseKey(eventId: string, date: string, time: string) {
  return `${date}|${time}|${eventId}`;
}

export async function loadDoseLog(): Promise<DoseLog> {
  try {
    return JSON.parse((await AsyncStorage.getItem(DOSE_LOG_KEY)) ?? '{}');
  } catch {
    return {};
  }
}

export async function saveDoseLog(log: DoseLog, now = new Date()) {
  const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS);
  const oldest = toDateKey(limit);
  const kept = Object.fromEntries(Object.entries(log).filter(([key]) => key.split('|')[0] >= oldest));
  await AsyncStorage.setItem(DOSE_LOG_KEY, JSON.stringify(kept));
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** La próxima toma pendiente de hoy. Las que coinciden en la hora se muestran de a una. */
export function getNextDose(events: any[], log: DoseLog, now: Date) {
  const date = toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const doses = events
    .filter((e) => e.type === 'recipe' && date >= e.date && (!e.endDate || date <= e.endDate))
    .flatMap((event) =>
      calculateDoseTimes(event.time, getIntervalHours(event.frequency)).map((time) => ({ event, time, date }))
    );

  const pending = doses
    .filter((d) => !log[doseKey(d.event.id, date, d.time)] && nowMinutes - toMinutes(d.time) <= LATE_MINUTES)
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

  const next = pending[0];
  if (!next) return null;

  const sameTime = doses.filter((d) => d.time === next.time);
  const remaining = pending.filter((d) => d.time === next.time).length;
  const elapsed = nowMinutes - toMinutes(next.time);
  const status: DoseStatus = elapsed < 0 ? 'upcoming' : elapsed <= DUE_MINUTES ? 'due' : 'late';

  return { ...next, status, position: sameTime.length - remaining + 1, total: sameTime.length };
}
