import { Alert, Platform } from 'react-native';

// Solo existe si las pruebas de Playwright lo inyectan; __DEV__ lo deja fuera de los builds
export const e2eHooks: any =
  __DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' ? ((window as any).__MEDITRACK_E2E__ ?? null) : null;

// En web Alert.alert no hace nada: las pruebas leen el diálogo y presionan sus botones
if (e2eHooks) {
  Alert.alert = (title, message, buttons) => {
    e2eHooks.dialogs.push({ title, message, buttons: buttons ?? [] });
  };
}
