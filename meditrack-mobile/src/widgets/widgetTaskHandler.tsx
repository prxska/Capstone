import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { UPCOMING_ATTENTIONS_WIDGET_KEY } from './syncUpcomingAttentions';
import { UpcomingAttentionsWidget, type UpcomingAttention } from './UpcomingAttentionsWidget';

export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetInfo.widgetName !== 'UpcomingAttentions' || widgetAction === 'WIDGET_DELETED') {
    return;
  }

  const storedEvents = await AsyncStorage.getItem(UPCOMING_ATTENTIONS_WIDGET_KEY);
  const events: UpcomingAttention[] = storedEvents ? JSON.parse(storedEvents) : [];
  renderWidget(<UpcomingAttentionsWidget events={events.slice(0, 3)} />);
}
