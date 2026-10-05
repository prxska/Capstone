import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Image, Platform } from 'react-native';
import type { UpcomingAttention } from './UpcomingAttentionsWidget';

export const UPCOMING_ATTENTIONS_WIDGET_KEY = '@meditrack_upcoming_widget_events';

function getPhotoDimensions(uri: string): Promise<{ photoWidth: number; photoHeight: number } | null> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (photoWidth, photoHeight) => resolve({ photoWidth, photoHeight }),
      () => resolve(null)
    );
  });
}

export async function syncUpcomingAttentionsWidget(events: UpcomingAttention[]) {
  const chronologicalEvents = [...events].sort((first, second) => {
    const firstDate = new Date(`${first.date || ''}T${first.time || '00:00'}:00`).getTime();
    const secondDate = new Date(`${second.date || ''}T${second.time || '00:00'}:00`).getTime();
    return firstDate - secondDate;
  });
  const nextAppointment = chronologicalEvents.find((event) => event.type === 'appointment');
  const sortedEvents = nextAppointment
    ? [nextAppointment, ...chronologicalEvents.filter((event) => event !== nextAppointment).slice(0, 2)]
    : chronologicalEvents.slice(0, 3);

  try {
    const widgetEvents = Platform.OS === 'android'
      ? await Promise.all(sortedEvents.map(async (event) => {
          if (!event.photoUri || (event.photoWidth && event.photoHeight)) return event;
          const dimensions = await getPhotoDimensions(event.photoUri);
          return dimensions ? { ...event, ...dimensions } : event;
        }))
      : sortedEvents;

    await AsyncStorage.setItem(UPCOMING_ATTENTIONS_WIDGET_KEY, JSON.stringify(widgetEvents));

    // Expo Go no incluye el módulo nativo del widget
    if (Platform.OS !== 'android' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

    const [{ requestWidgetUpdate }, { UpcomingAttentionsWidget }] = await Promise.all([
      import('react-native-android-widget'),
      import('./UpcomingAttentionsWidget'),
    ]);
    await requestWidgetUpdate({
      widgetName: 'UpcomingAttentions',
      renderWidget: () => <UpcomingAttentionsWidget events={widgetEvents} />,
    });
  } catch (error) {
    console.warn('No se pudo actualizar el widget de próximas atenciones:', error);
  }
}
