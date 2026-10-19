import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const TUTORIAL_SEEN_PREFIX = '@meditrack_tutorial_seen_';

// Se muestra una vez por cuenta (o por modo local) en cada teléfono
export async function shouldShowTutorial(accountKey: string) {
  return !(await AsyncStorage.getItem(TUTORIAL_SEEN_PREFIX + accountKey));
}

export async function markTutorialSeen(accountKey: string) {
  await AsyncStorage.setItem(TUTORIAL_SEEN_PREFIX + accountKey, 'true');
}

export async function resetTutorial(accountKey: string) {
  await AsyncStorage.removeItem(TUTORIAL_SEEN_PREFIX + accountKey);
}

const STEPS: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; text: string }[] = [
  {
    icon: 'heart-circle',
    color: '#0284C7',
    title: 'Bienvenido a MediTrack',
    text: 'Te ayudamos a recordar tus medicamentos y citas médicas. Este recorrido dura menos de un minuto.',
  },
  {
    icon: 'medical',
    color: '#36B9CC',
    title: 'Agrega tus medicamentos',
    text: 'Toca "+ Receta" y sigue los pasos: nombre, dosis, horario y cuántos días. Puedes sacarle una foto a la caja para reconocerla.',
  },
  {
    icon: 'calendar',
    color: '#D97706',
    title: 'Agrega tus citas médicas',
    text: 'Toca "+ Cita Médica". Te avisaremos 24 horas antes, con la hora, el doctor y el lugar.',
  },
  {
    icon: 'alarm',
    color: '#7C3AED',
    title: 'Alertas a la hora exacta',
    text: 'Cuando sea hora de tu medicamento, sonará una alerta. Toca "Ya lo tomé" y, si anotaste cuántas tienes, te avisaremos cuando queden pocas.',
  },
  {
    icon: 'people',
    color: '#16A34A',
    title: 'Cuida a tu familia',
    text: 'En Mi Perfil puedes crear perfiles, por ejemplo para un hijo o tus padres. Cambia de perfil con los botones de arriba del calendario.',
  },
  {
    icon: 'create',
    color: '#0369A1',
    title: 'Editar o eliminar',
    text: 'Toca cualquier registro para cambiarlo. Para eliminarlo, toca el basurero rojo de la tarjeta. Siempre te pediremos confirmar.',
  },
];

type Props = { visible: boolean; onClose: () => void };

export function OnboardingTutorial({ visible, onClose }: Props) {
  const { isDarkMode, largeFont } = useTheme();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const big = largeFont ? 4 : 0;

  const close = () => {
    setStep(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.card, isDarkMode && { backgroundColor: '#1E293B' }]}>
          <TouchableOpacity style={styles.skip} onPress={close} accessibilityRole="button">
            <Text style={[styles.skipText, { fontSize: 18 + big }, isDarkMode && { color: '#CBD5E1' }]}>Saltar</Text>
          </TouchableOpacity>

          <View style={[styles.iconCircle, { backgroundColor: current.color }]}>
            <Ionicons name={current.icon} size={56} color="#FFF" />
          </View>

          <Text style={[styles.title, { fontSize: 26 + big }, isDarkMode && { color: '#F1F5F9' }]}>
            {current.title}
          </Text>
          <Text style={[styles.text, { fontSize: 19 + big, lineHeight: 28 + big }, isDarkMode && { color: '#CBD5E1' }]}>
            {current.text}
          </Text>

          <View style={styles.dots} accessibilityLabel={`Paso ${step + 1} de ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && { backgroundColor: current.color, width: 24 }]} />
            ))}
          </View>

          <View style={styles.actions}>
            {step > 0 ? (
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)} accessibilityRole="button">
                <Text style={[styles.backText, { fontSize: 19 + big }, isDarkMode && { color: '#7DD3FC' }]}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: current.color }]}
              onPress={() => (isLast ? close() : setStep(step + 1))}
              accessibilityRole="button"
            >
              <Text style={[styles.nextText, { fontSize: 19 + big }]}>{isLast ? 'Comenzar' : 'Siguiente'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, paddingTop: 16, alignItems: 'center' },
  skip: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 6, minHeight: 48, justifyContent: 'center' },
  skipText: { color: '#475569', fontWeight: '700' },
  iconCircle: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontWeight: '800', color: '#102A43', textAlign: 'center', marginBottom: 12 },
  text: { color: '#334155', textAlign: 'center', fontWeight: '500' },
  dots: { flexDirection: 'row', gap: 8, marginTop: 24, marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1' },
  actions: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12 },
  backButton: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  backText: { color: '#0369A1', fontWeight: '700' },
  nextButton: { flex: 1.4, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextText: { color: '#FFF', fontWeight: '800' },
});
