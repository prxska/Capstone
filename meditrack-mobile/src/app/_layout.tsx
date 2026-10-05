import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { clearLegacyMedicationAlarms } from '../lib/legacyAlarms';
import { LocalAuth } from '../lib/storage';
import { supabase } from '../lib/supabase';

function RootNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const { isDarkMode } = useTheme();
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void clearLegacyMedicationAlarms();

    const updateTokenRefresh = (state: string | null) => {
      if (state === 'active') {
        void supabase.auth.startAutoRefresh();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    };

    updateTokenRefresh(AppState.currentState);
    const subscription = AppState.addEventListener('change', updateTokenRefresh);

    return () => {
      subscription.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function evaluateAuth() {
      try {
        const isGuest = await LocalAuth.isGuestMode();
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        const currentSegment = segments[0] || '';
        const hasAccess = !!session || isGuest;

        if (!hasAccess && currentSegment !== 'login') {
          router.replace('/login' as any);
        } else if (hasAccess && currentSegment === 'login') {
          router.replace('/' as any);
        }
      } catch (err) {
        console.error('Error al evaluar autenticación:', err);
      } finally {
        if (isMounted) setIsAuthLoaded(true);
      }
    }

    evaluateAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const isGuest = await LocalAuth.isGuestMode();
      const currentSegment = segments[0] || '';
      const hasAccess = !!session || isGuest;

      if (!hasAccess && currentSegment !== 'login') {
        router.replace('/login' as any);
      } else if (hasAccess && currentSegment === 'login') {
        router.replace('/' as any);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [segments]);

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="profile" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigation />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
