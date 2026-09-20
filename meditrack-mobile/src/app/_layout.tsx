import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { LocalAuth } from '../lib/storage';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AlarmProvider } from '../context/AlarmContext';

function RootNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const { isDarkMode } = useTheme();
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

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
    <ThemeProvider>
      <AlarmProvider>
        <RootNavigation />
      </AlarmProvider>
    </ThemeProvider>
  );
}
