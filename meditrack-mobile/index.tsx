import 'expo-router/entry';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

// Expo Go no incluye el módulo nativo del widget
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (Platform.OS === 'android' && !isExpoGo) {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
