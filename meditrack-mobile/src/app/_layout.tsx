import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppThemeProvider, useTheme } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync();

function RootNavigationLayout() {
  const { isDarkMode } = useTheme();
  const [session, setSession] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const isLoginScreen = (segments[0] as string) === 'login';

    if (!session && !isLoginScreen) {
      router.replace('/login' as any);
    } else if (session && isLoginScreen) {
      router.replace('/' as any);
    }
  }, [session, isAuthReady, segments]);

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigationLayout />
    </AppThemeProvider>
  );
}
