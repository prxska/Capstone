import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gradient } from '../components/Gradient';
import { getMedicationPhoto } from '../lib/medicationPhotos';
import { Switch } from '../components/ui/switch';
import { resetTutorial } from '../components/OnboardingTutorial';
import { ProfilesManager } from '../components/ProfilesManager';
import { useTheme } from '../context/ThemeContext';
import { cancelAttentionAlerts } from '../lib/attentionAlerts';
import { OWNER_PROFILE_ID, setActiveProfileId } from '../lib/careProfiles';
import { LocalAuth } from '../lib/storage';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode, toggleTheme, largeFont, toggleFont, voiceAlerts, toggleVoiceAlerts } = useTheme();

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  // Estados para el Historial
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleReplayTutorial = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await resetTutorial(isGuest || !session ? 'guest' : session.user.id);
    router.back();
  };

  const handleToggleVoice = () => {
    if (!voiceAlerts) Speech.speak('Así sonarán tus alertas. Es hora de tomar tu medicamento.', { language: 'es-ES', rate: 0.9 });
    else void Speech.stop();
    toggleVoiceAlerts();
  };

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

  // Función para cargar los medicamentos eliminados
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const guest = await LocalAuth.isGuestMode();
      
      if (guest) {
        // 1. Buscar en almacenamiento local
        const raw = await AsyncStorage.getItem('@meditrack_local_recipes');
        const list = raw ? JSON.parse(raw) : [];
        
        // Filtrar los que tienen deleted_at y ordenarlos
        const deleted = list
          .filter((r: any) => r.deleted_at)
          .sort((a: any, b: any) => new Date(a.deleted_at).getTime() - new Date(b.deleted_at).getTime());
        
        setHistoryData(deleted);
      } else {
        // 2. Buscar en Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .eq('user_id', user.id)
            .not('deleted_at', 'is', null) // Solo los borrados
            .order('deleted_at', { ascending: true }); // Del más antiguo al más nuevo

          if (error) throw error;
          const withPhotos = await Promise.all(
            (data || []).map(async (med: any) => ({
              ...med,
              photoUri: med.photo_url ? (await getMedicationPhoto(med.photo_url)).photoUri : '',
            }))
          );
          setHistoryData(withPhotos);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cargar el historial.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setIsHistoryVisible(true);
    fetchHistory();
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
            await cancelAttentionAlerts();
            await setActiveProfileId(OWNER_PROFILE_ID);
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
          largeFont && { fontSize: 28 }
        ]}>
          Mi Perfil
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(350)}>
          {/* Tarjeta de usuario */}
          <View style={[styles.userCard, isDarkMode && styles.darkCard]}>
            <View style={styles.avatarCircle}>
              <Gradient colors={['#0B3A66', '#0369A1']} />
              <Ionicons
                name={isGuest ? "phone-portrait" : "person"}
                size={56}
                color="#FFF"
              />
            </View>
            <Text style={[
              styles.userName,
              isDarkMode && { color: '#F1F5F9' },
              largeFont && { fontSize: 28 }
            ]}>
              {userName}
            </Text>
            <Text style={[
              styles.userEmail,
              isDarkMode && { color: '#CBD5E1' },
              largeFont && { fontSize: 20 }
            ]}>
              {userEmail}
            </Text>

            {/* BOTÓN VER HISTORIAL */}
            <TouchableOpacity 
              style={[
                styles.historyButton, 
                isDarkMode && styles.darkHistoryButton
              ]}
              onPress={handleOpenHistory}
            >
              <Ionicons 
                name="time-outline" 
                size={20} 
                color={isDarkMode ? '#38BDF8' : '#0369A1'} 
                style={{ marginRight: 8 }} 
              />
              <Text style={[
                styles.historyButtonText,
                isDarkMode && { color: '#38BDF8' },
                largeFont && { fontSize: 18 }
              ]}>
                Ver historial de medicamentos
              </Text>
            </TouchableOpacity>

            {isGuest && (
              <View style={styles.guestWarningBox}>
                <Ionicons name="warning" size={20} color="#B45309" />
                <Text style={[styles.guestWarningText, largeFont && { fontSize: 18 }]}>
                  Modo local activo: Sin respaldo en la nube.
                </Text>
              </View>
            )}
          </View>

          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
          {/* Sección Preferencias de Accesibilidad */}
          <Text style={[
            styles.sectionTitle,
            isDarkMode && { color: '#CBD5E1' },
            largeFont && { fontSize: 18 }
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
                    color={isDarkMode ? '#38BDF8' : '#0369A1'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.optionTitle,
                    isDarkMode && { color: '#F1F5F9' },
                    largeFont && { fontSize: 24 }
                  ]}>
                    Modo Oscuro
                  </Text>
                  <Text style={[
                    styles.optionSubtitle,
                    isDarkMode && { color: '#CBD5E1' },
                    largeFont && { fontSize: 18 }
                  ]}>
                    {isDarkMode ? 'Activado (Fondo oscuro)' : 'Desactivado (Fondo claro)'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#64748B', true: '#0369A1' }}
                thumbColor={isDarkMode ? '#0369A1' : '#FFFFFF'}
              />
            </View>

            <View style={[styles.divider, isDarkMode && { backgroundColor: '#334155' }]} />

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.iconBox, { backgroundColor: largeFont ? '#DCFCE7' : '#F1F5F9' }]}>
                  <Ionicons
                    name="text"
                    size={26}
                    color={largeFont ? '#16A34A' : '#3E5468'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.optionTitle,
                    isDarkMode && { color: '#F1F5F9' },
                    largeFont && { fontSize: 24 }
                  ]}>
                    Texto Aumentado
                  </Text>
                  <Text style={[
                    styles.optionSubtitle,
                    isDarkMode && { color: '#CBD5E1' },
                    largeFont && { fontSize: 18 }
                  ]}>
                    {largeFont ? 'Letras grandes y legibles' : 'Tamaño normal'}
                  </Text>
                </View>
              </View>
              <Switch
                value={largeFont}
                onValueChange={toggleFont}
                trackColor={{ false: '#64748B', true: '#0369A1' }}
                thumbColor={largeFont ? '#15803D' : '#FFFFFF'}
              />
            </View>

            <View style={[styles.divider, isDarkMode && { backgroundColor: '#334155' }]} />

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.iconBox, { backgroundColor: voiceAlerts ? '#EDE9FE' : '#F1F5F9' }]}>
                  <Ionicons
                    name={voiceAlerts ? 'volume-high' : 'volume-mute'}
                    size={26}
                    color={voiceAlerts ? '#7C3AED' : '#3E5468'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.optionTitle,
                    isDarkMode && { color: '#F1F5F9' },
                    largeFont && { fontSize: 24 }
                  ]}>
                    Leer alertas en voz alta
                  </Text>
                  <Text style={[
                    styles.optionSubtitle,
                    isDarkMode && { color: '#CBD5E1' },
                    largeFont && { fontSize: 18 }
                  ]}>
                    {voiceAlerts ? 'Dice el medicamento y la dosis' : 'Desactivado'}
                  </Text>
                </View>
              </View>
              <Switch
                value={voiceAlerts}
                onValueChange={handleToggleVoice}
                trackColor={{ false: '#64748B', true: '#0369A1' }}
                thumbColor={voiceAlerts ? '#7C3AED' : '#FFFFFF'}
              />
            </View>
          </View>

          {/* Perfiles de las personas que se cuidan desde esta cuenta */}
          <Text style={[
            styles.sectionTitle,
            isDarkMode && { color: '#CBD5E1' },
            largeFont && { fontSize: 18 }
          ]}>
            PERFILES
          </Text>
          <ProfilesManager onOwnerRenamed={(name) => !isGuest && setUserName(name)} />

          <TouchableOpacity
            style={[styles.tutorialButton, isDarkMode && styles.darkCard]}
            onPress={handleReplayTutorial}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Ionicons name="help-circle" size={26} color={isDarkMode ? '#7DD3FC' : '#0369A1'} style={{ marginRight: 8 }} />
            <Text style={[
              styles.tutorialButtonText,
              isDarkMode && { color: '#7DD3FC' },
              largeFont && { fontSize: 22 }
            ]}>
              Ver tutorial de nuevo
            </Text>
          </TouchableOpacity>

          {/* Botón Salir */}
          <TouchableOpacity
            style={[styles.signOutButton, isDarkMode && styles.darkSignOutButton]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={[
              styles.signOutText,
              largeFont && { fontSize: 22 }
            ]}>
              {isGuest ? 'Salir del Modo Local' : 'Cerrar Sesión'}
            </Text>
          </TouchableOpacity>
          </Animated.View>
        </ScrollView>

      </View>

      {/* MODAL DE HISTORIAL DE MEDICAMENTOS */}
      <Modal
        visible={isHistoryVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, isDarkMode && { backgroundColor: '#1E293B' }]}>
            
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time" size={24} color={isDarkMode ? '#38BDF8' : '#0369A1'} />
                <Text style={[styles.modalTitle, isDarkMode && { color: '#F1F5F9' }, largeFont && { fontSize: 22 }]}>
                  Historial Médico
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsHistoryVisible(false)}>
                <Ionicons name="close-circle" size={32} color={isDarkMode ? '#3E5468' : '#94A3B8'} />
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 40 }} />
            ) : historyData.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Ionicons name="document-text-outline" size={60} color={isDarkMode ? '#334155' : '#CBD5E1'} />
                <Text style={{ textAlign: 'center', marginTop: 16, color: isDarkMode ? '#CBD5E1' : '#3E5468', fontSize: 16 }}>
                  No hay medicamentos en el historial.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
{historyData.map((med, index) => (
                  <View 
                    key={med.id || index} 
                    style={[
                      styles.historyCard, 
                      isDarkMode && { backgroundColor: '#0F172A', borderColor: '#334155' }
                    ]}
                  >
                    <View style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons 
                        name="medical" 
                        size={20} 
                        color="#0EA5E9" 
                        style={{ marginRight: 6 }} 
                      />
                      <Text style={[styles.historyName, isDarkMode && { color: '#F1F5F9' }, largeFont && { fontSize: 20 }]}>
                        {med.medication}
                      </Text>
                    </View>

                    <Text style={[styles.historyDetail, isDarkMode && { color: '#94A3B8' }]}>
                      Dosis: {med.dose || 'No especificada'}
                    </Text>
                    <Text style={[styles.historyDetail, isDarkMode && { color: '#94A3B8' }]}>
                      Frecuencia: {med.frequency}
                    </Text>
                    <Text style={[styles.historyDetail, isDarkMode && { color: '#94A3B8' }]}>
                      Paciente: {med.patient}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '700' }}>
                        Eliminado el: {new Date(med.deleted_at).toLocaleDateString('es-CL', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </Text>
                    </View>
                    </View>
                    {med.photoUri ? (
                      <Image
                        source={{ uri: med.photoUri }}
                        style={styles.historyPhoto}
                        resizeMode="cover"
                        accessibilityRole="image"
                        accessibilityLabel={`Foto de ${med.medication}`}
                      />
                    ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F1FB',
  },
  darkContainer: {
    backgroundColor: '#0B1B33',
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
    fontSize: 24,
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
    overflow: 'hidden',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0369A1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#3E5468',
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
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3E5468',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSubtitle: {
    fontSize: 16,
    color: '#3E5468',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  tutorialButtonText: { fontSize: 18, fontWeight: '700', color: '#0369A1' },
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
    fontSize: 18,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  
  // ESTILOS NUEVOS PARA EL BOTÓN Y EL HISTORIAL
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    width: '100%',
  },
  darkHistoryButton: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369A1',
    textAlign: 'center',
    flex: 1, // Esto ayuda a que el texto use todo el ancho disponible
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalPanel: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102A43',
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyPhoto: { width: 92, height: 92, borderRadius: 14, backgroundColor: '#E0F2FE' },
  historyCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  historyName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  historyDetail: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 3,
    fontWeight: '500',
  },
});