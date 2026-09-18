import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  largeFont: boolean;
  setLargeFont: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  setIsDarkMode: () => {},
  largeFont: false,
  setLargeFont: () => {},
});

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setDarkModeState] = useState(systemColorScheme === 'dark');
  const [largeFont, setLargeFontState] = useState(false);

  useEffect(() => {
    async function loadSavedPreferences() {
      const savedDark = await AsyncStorage.getItem('app_dark_mode');
      const savedFont = await AsyncStorage.getItem('app_large_font');
      if (savedDark !== null) setDarkModeState(savedDark === 'true');
      if (savedFont !== null) setLargeFontState(savedFont === 'true');
    }
    loadSavedPreferences();
  }, []);

  const setIsDarkMode = async (val: boolean) => {
    setDarkModeState(val);
    await AsyncStorage.setItem('app_dark_mode', String(val));
  };

  const setLargeFont = async (val: boolean) => {
    setLargeFontState(val);
    await AsyncStorage.setItem('app_large_font', String(val));
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, largeFont, setLargeFont }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
