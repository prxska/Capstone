import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
// Si AppTabs es tu navegación, se recomienda manejarla en un sub-layout, 
// pero de momento lo ocultaremos para probar el dashboard.
// import AppTabs from '@/components/app-tabs'; 

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      
      {/* El Stack maneja la navegación de pantallas y aquí ocultamos el header */}
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}