import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const segments = useSegments();
  const router = useRouter();

  // 1. Revisar el estado de autenticación al cargar
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

  // 2. Lógica inteligente de redirección
  useEffect(() => {
    // Si aún no comprobamos la sesión en Supabase, no hacemos nada
    if (!isAuthReady) return; 

    // Forzamos a TypeScript a leer el segmento como un string normal
    const isLoginScreen = (segments[0] as string) === 'login';

    if (!session && !isLoginScreen) {
      // Usuario sin sesión intentando entrar a la app -> Lo mandamos al login
      router.replace('/login' as any);
    } else if (session && isLoginScreen) {
      // Usuario con sesión intentando ver el login -> Lo mandamos al dashboard
      router.replace('/' as any);
    }
  }, [session, isAuthReady, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      
      {/* El Stack maneja la navegación de pantallas y aquí ocultamos el header */}
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}