import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { ScaleButton } from './motion';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
};

/** Ventana de aviso con el diseño de la app. Se muestra mientras esté montada. */
export function AppDialog({ icon, color, title, children, primaryLabel, onPrimary, secondaryLabel, onSecondary }: Props) {
  const { isDarkMode, largeFont } = useTheme();
  const big = largeFont ? 4 : 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onSecondary}>
      <View style={styles.backdrop}>
        <Animated.View
          entering={ZoomIn.springify().damping(16).stiffness(180)}
          style={[styles.card, isDarkMode && { backgroundColor: '#1E293B' }]}
          accessibilityRole="alert"
        >
          <Animated.View
            entering={ZoomIn.delay(120).springify().damping(12)}
            style={[styles.iconCircle, { backgroundColor: color }]}
          >
            <Ionicons name={icon} size={46} color="#FFF" />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(120).duration(280)} style={styles.texts}>
            <Text style={[styles.title, { fontSize: 25 + big }, isDarkMode && { color: '#F1F5F9' }]}>{title}</Text>
            <Text style={[styles.message, { fontSize: 18 + big, lineHeight: 26 + big }, isDarkMode && { color: '#CBD5E1' }]}>
              {children}
            </Text>
          </Animated.View>

          <ScaleButton style={[styles.primary, { backgroundColor: color }]} onPress={onPrimary}>
            <Text style={[styles.primaryText, { fontSize: 19 + big }]}>{primaryLabel}</Text>
          </ScaleButton>
          <TouchableOpacity style={styles.secondary} onPress={onSecondary} accessibilityRole="button">
            <Text style={[styles.secondaryText, { fontSize: 18 + big }, isDarkMode && { color: '#CBD5E1' }]}>
              {secondaryLabel}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center' },
  iconCircle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  texts: { alignSelf: 'stretch', alignItems: 'center', marginBottom: 20 },
  title: { color: '#0F172A', fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  message: { color: '#334155', textAlign: 'center' },
  primary: { alignSelf: 'stretch', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#FFF', fontWeight: '800' },
  secondary: { alignSelf: 'stretch', marginTop: 6, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: '#334155', fontWeight: '600' },
});
