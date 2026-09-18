import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, Switch, Alert, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const { isDarkMode, setIsDarkMode, largeFont, setLargeFont } = useTheme();
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          redirectToLogin();
          return;
        }

        setEmail(user.email || 'Sin correo asociado');
        const userMetadataName = user.user_metadata?.full_name;
        setFullName(userMetadataName || user.email?.split('@')[0] || 'Paciente');
      } catch (err: any) {
        Alert.alert('Error', 'No se pudo cargar la sesión.');
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, []);

  function redirectToLogin() {
    try {
      router.replace('/login' as any);
    } catch {
      router.replace('/');
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  async function performLogout() {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      redirectToLogin();
    } catch (err: any) {
      console.error('Error al salir:', err);
      Alert.alert('Error al salir', 'No se pudo cerrar la sesión.');
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('¿Estás seguro de que deseas salir de MediTrack?');
      if (confirmLogout) {
        performLogout();
      }
      return;
    }

    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de MediTrack?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  }

  function handleGoBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, isDarkMode && styles.containerDark]}>
        <ActivityIndicator size="large" color="#36B9CC" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Top Bar de navegación */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFF' : '#102A43'} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, isDarkMode && styles.textWhite]}>Ajustes y Cuenta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Cabecera con saludo personalizado */}
        <View style={[styles.userCard, isDarkMode && styles.cardDark]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName ? fullName[0].toUpperCase() : 'M'}
            </Text>
          </View>
          <Text style={[styles.greeting, largeFont && styles.fontLargeTitle, isDarkMode && styles.textWhite]}>
            ¡Hola, {fullName || 'Paciente'}!
          </Text>
          <Text style={styles.userEmail}>{email}</Text>

          <View style={styles.statusBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#0284C7" />
            <Text style={styles.statusBadgeText}>PACIENTE REGISTRADO</Text>
          </View>
        </View>

        {/* Sección: Accesibilidad y Configuración */}
        <Text style={styles.sectionHeader}>PREFERENCIAS Y ACCESIBILIDAD</Text>
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={22} color={isDarkMode ? '#38BDF8' : '#334155'} />
              <View style={styles.settingTexts}>
                <Text style={[styles.settingTitle, largeFont && styles.fontLargeText, isDarkMode && styles.textWhite]}>
                  Modo Oscuro
                </Text>
                <Text style={styles.settingSub}>Interfaz con fondo oscuro</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#CBD5E1', true: '#36B9CC' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="text-outline" size={22} color={isDarkMode ? '#38BDF8' : '#334155'} />
              <View style={styles.settingTexts}>
                <Text style={[styles.settingTitle, largeFont && styles.fontLargeText, isDarkMode && styles.textWhite]}>
                  Texto Grande
                </Text>
                <Text style={styles.settingSub}>Aumenta el tamaño de la tipografía</Text>
              </View>
            </View>
            <Switch
              value={largeFont}
              onValueChange={setLargeFont}
              trackColor={{ false: '#CBD5E1', true: '#36B9CC' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={22} color={isDarkMode ? '#38BDF8' : '#334155'} />
              <View style={styles.settingTexts}>
                <Text style={[styles.settingTitle, largeFont && styles.fontLargeText, isDarkMode && styles.textWhite]}>
                  Recordatorios Médicos
                </Text>
                <Text style={styles.settingSub}>Alertas para dosis y próximas citas</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#CBD5E1', true: '#36B9CC' }}
            />
          </View>
        </View>

        {/* Sección: Cierre de Sesión */}
        <Text style={styles.sectionHeader}>SEGURIDAD DE LA CUENTA</Text>
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <TouchableOpacity style={styles.actionItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutActionText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert('Aviso', 'Función de baja definitiva en desarrollo.')}
          >
            <Ionicons name="trash-outline" size={22} color="#94A3B8" />
            <Text style={styles.deleteActionText}>Eliminar mi cuenta y registros</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  containerDark: { backgroundColor: '#0F172A' },
  center: { justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8, borderRadius: 10 },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: '#102A43' },
  textWhite: { color: '#F1F5F9' },
  scrollArea: { paddingHorizontal: 20, paddingBottom: 40 },
  userCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center', marginVertical: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardDark: { backgroundColor: '#1E293B', shadowColor: '#000', shadowOpacity: 0.3 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#36B9CC', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#102A43', marginBottom: 4 },
  fontLargeTitle: { fontSize: 26 },
  fontLargeText: { fontSize: 17 },
  userEmail: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusBadgeText: { color: '#0369A1', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 18, marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingTexts: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  settingSub: { fontSize: 12, color: '#94A3B8' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  logoutActionText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  deleteActionText: { fontSize: 14, fontWeight: '500', color: '#94A3B8' }
});
