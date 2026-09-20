import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Alert,
  ScrollView, Switch, Platform, ActivityIndicator,
  NativeSyntheticEvent, NativeScrollEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { LocalAuth } from '../lib/storage';
import { useTheme } from '../context/ThemeContext';
import { useAlarm } from '../context/AlarmContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode, toggleTheme, largeFont, toggleFont } = useTheme();
  const { triggerManualAlarm } = useAlarm();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [testingAlarm, setTestingAlarm] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showScrollPrompt, setShowScrollPrompt] = useState(true);

  useEffect(() => {
    async function loadData() {
      const guest = await LocalAuth.isGuestMode();
      setIsGuest(guest);

      if (guest) {
        setUserName('Modo Local (Sin cuenta)');
        setUserEmail('Tus datos se guardan sólo en este teléfono');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserName(user.user_metadata?.full_name || 'Paciente');
          setUserEmail(user.email || '');
        }
      }
    }
    loadData();
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 30 && showScrollPrompt) {
      setShowScrollPrompt(false);
    } else if (offsetY <= 10 && !showScrollPrompt) {
      setShowScrollPrompt(true);
    }
  };

  const handleTestAlarm = () => {
    setTestingAlarm(true);
    setCountdown(3);

    let current = 3;
    const timer = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(timer);
        setCountdown(null);
        setTestingAlarm(false);

        triggerManualAlarm({
          id: 'test-1',
          medication: 'Paracetamol 500mg',
          dose: '1 comprimido',
          color: '#38BDF8',
          colorName: 'Azul',
          time: '08:00',
        });
      } else {
        setCountdown(current);
      }
    }, 1000);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      isGuest
        ? 'Al salir del modo local volverás a la pantalla de acceso.'
        : '¿Deseas cerrar tu sesión actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await LocalAuth.clearGuestMode();
            await supabase.auth.signOut();
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Barra superior con botón volver */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isDarkMode && styles.darkRoundBtn]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={28} color={isDarkMode ? '#F1F5F9' : '#102A43'} />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          isDarkMode && { color: '#F1F5F9' },
          largeFont && { fontSize: 26 }
        ]}>
          Mi Perfil
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          indicatorStyle={isDarkMode ? 'white' : 'black'}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Tarjeta de usuario */}
          <View style={[styles.userCard, isDarkMode && styles.darkCard]}>
            <View style={[styles.avatarCircle, isDarkMode && { backgroundColor: '#334155' }]}>
              <Ionicons
                name={isGuest ? "phone-portrait" : "person"}
                size={56}
                color={isDarkMode ? '#38BDF8' : '#0EA5E9'}
              />
            </View>
            <Text style={[
              styles.userName,
              isDarkMode && { color: '#F1F5F9' },
              largeFont && { fontSize: 26 }
            ]}>
              {userName}
            </Text>
            <Text style={[
              styles.userEmail,
              isDarkMode && { color: '#94A3B8' },
              largeFont && { fontSize: 18 }
            ]}>
              {userEmail}
            </Text>

            {isGuest && (
              <View style={styles.guestWarningBox}>
                <Ionicons name="warning" size={20} color="#D97706" />
                <Text style={[styles.guestWarningText, largeFont && { fontSize: 16 }]}>
                  Modo local activo: Sin respaldo en la nube.
                </Text>
              </View>
            )}
          </View>

          {/* Sección Diagnóstico y Prueba de Alarmas */}
          <Text style={[
            styles.sectionTitle,
            isDarkMode && { color: '#94A3B8' },
            largeFont && { fontSize: 16 }
          ]}>
            SISTEMA DE ALARMAS Y HARDWARE
          </Text>

          <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={styles.testCardContent}>
              <View style={styles.testIconTextRow}>
                <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#334155' : '#FEF3C7' }]}>
                  <Ionicons name="alarm" size={26} color={isDarkMode ? '#FDE68A' : '#D97706'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.optionTitle,
                    isDarkMode && { color: '#F1F5F9' },
                    largeFont && { fontSize: 20 }
                  ]}>
                    Prueba de Alarma In-App
                  </Text>
                  <Text style={[
                    styles.optionSubtitle,
                    isDarkMode && { color: '#94A3B8' },
                    largeFont && { fontSize: 15 }
                  ]}>
                    Ejecuta vibración táctil y modal interactivo de confirmación.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.testButton,
                  testingAlarm && styles.testButtonDisabled,
                  isDarkMode && styles.darkTestButton
                ]}
                onPress={handleTestAlarm}
                disabled={testingAlarm}
                activeOpacity={0.8}
              >
                {testingAlarm ? (
                  <View style={styles.countdownRow}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={[styles.testButtonText, largeFont && { fontSize: 18 }]}>
                      Disparando en {countdown}s...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.countdownRow}>
                    <Ionicons name="play-circle-outline" size={22} color="#FFF" />
                    <Text style={[styles.testButtonText, largeFont && { fontSize: 18 }]}>
                      Probar alarma ahora (3s)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sección Preferencias de Accesibilidad */}
          <Text style={[
            styles.sectionTitle,
            isDarkMode && { color: '#94A3B8' },
            largeFont && { fontSize: 16 }
          ]}>
            PREFERENCIAS DE VISUALIZACIÓN
          </Text>

          <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#334155' : '#E0F2FE' }]}>
                  <Ionicons
                    name={isDarkMode ? "moon" : "sunny"}
                    size={26}
                    color={isDarkMode ? '#38BDF8' : '#0284C7'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.optionTitle,
                    isDarkMode && { color: '#F1F5F9' },
                    largeFont && { fontSize: 22 }
                  ]}>
                    Modo Oscuro
                  </Text>
                  <Text style={[
                    styles.optionSubtitle,
                    isDarkMode && { color: '#94A3B8' },
                    largeFont && { fontSize: 16 }
                  ]}>
                    {isDarkMode ? 'Activado (Fondo oscuro)' : 'Desactivado (Fondo claro)'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
                thumbColor={isDarkMode ? '#0284C7' : '#FFFFFF'}
              />
            </View>

            <View style={[styles.divider, isDarkMode && { backgroundColor: '#334155' }]} />

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.iconBox, { backgroundColor: largeFont ? '#DCFCE7' : '#F1F5F9' }]}>
                  <Ionicons
                    name="text"
                    size={26}
                    color={largeFont ? '#16A34A' : '#64748B'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.optionTitle,
                    isDarkMode && { color: '#F1F5F9' },
                    largeFont && { fontSize: 22 }
                  ]}>
                    Texto Aumentado
                  </Text>
                  <Text style={[
                    styles.optionSubtitle,
                    isDarkMode && { color: '#94A3B8' },
                    largeFont && { fontSize: 16 }
                  ]}>
                    {largeFont ? 'Letras grandes y legibles' : 'Tamaño normal'}
                  </Text>
                </View>
              </View>
              <Switch
                value={largeFont}
                onValueChange={toggleFont}
                trackColor={{ false: '#CBD5E1', true: '#22C55E' }}
                thumbColor={largeFont ? '#15803D' : '#FFFFFF'}
              />
            </View>
          </View>

          {/* Botón Salir */}
          <TouchableOpacity
            style={[styles.signOutButton, isDarkMode && styles.darkSignOutButton]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={[
              styles.signOutText,
              largeFont && { fontSize: 20 }
            ]}>
              {isGuest ? 'Salir del Modo Local' : 'Cerrar Sesión'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Indicador inferior flotante accesible para saber que hay contenido abajo */}
        {showScrollPrompt && (
          <View pointerEvents="none" style={styles.floatingPromptContainer}>
            <View style={[styles.floatingPromptPill, isDarkMode && styles.floatingPromptDark]}>
              <Ionicons name="chevron-down" size={16} color={isDarkMode ? '#94A3B8' : '#475569'} />
              <Text style={[styles.floatingPromptText, isDarkMode && { color: '#94A3B8' }]}>
                Baja para ver más opciones
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  darkContainer: {
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  darkRoundBtn: {
    backgroundColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102A43',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  darkCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  guestWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  guestWarningText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 10,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  testCardContent: {
    padding: 16,
  },
  testIconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: '#D97706',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkTestButton: {
    backgroundColor: '#B45309',
  },
  testButtonDisabled: {
    backgroundColor: '#78350F',
    opacity: 0.8,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    paddingRight: 10,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  darkSignOutButton: {
    backgroundColor: '#450A0A',
    borderColor: '#7F1D1D',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  },
  floatingPromptContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingPromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    opacity: 0.92,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  floatingPromptDark: {
    backgroundColor: '#1E293B',
  },
  floatingPromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});
