import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const PREFERENCES_KEY = '@meditrack_preferences';

interface ThemeContextType {
  isDarkMode: boolean;
  largeFont: boolean;
  voiceAlerts: boolean;
  toggleTheme: () => void;
  toggleFont: () => void;
  toggleVoiceAlerts: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  largeFont: false,
  voiceAlerts: false,
  toggleTheme: () => {},
  toggleFont: () => {},
  toggleVoiceAlerts: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [largeFont, setLargeFont] = useState(false);
  const [voiceAlerts, setVoiceAlerts] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Las preferencias se recuerdan entre aperturas de la app
  useEffect(() => {
    AsyncStorage.getItem(PREFERENCES_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        setIsDarkMode(!!saved.isDarkMode);
        setLargeFont(!!saved.largeFont);
        setVoiceAlerts(!!saved.voiceAlerts);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({ isDarkMode, largeFont, voiceAlerts }));
  }, [loaded, isDarkMode, largeFont, voiceAlerts]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const toggleFont = () => setLargeFont((prev) => !prev);
  const toggleVoiceAlerts = () => setVoiceAlerts((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, largeFont, voiceAlerts, toggleTheme, toggleFont, toggleVoiceAlerts }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;
