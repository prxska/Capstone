import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  largeFont: boolean;
  toggleTheme: () => void;
  toggleFont: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  largeFont: false,
  toggleTheme: () => {},
  toggleFont: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [largeFont, setLargeFont] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const toggleFont = () => {
    setLargeFont((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, largeFont, toggleTheme, toggleFont }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;
