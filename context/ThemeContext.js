'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Load saved preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('signmitra_theme');
    if (savedTheme !== null) {
      setIsDarkTheme(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme((prev) => {
      const nextTheme = !prev;
      localStorage.setItem('signmitra_theme', nextTheme ? 'dark' : 'light');
      return nextTheme;
    });
  };

  // Centralized theme tokens matching the exact Linen / Amethyst / Dolphin palette
  const themeTokens = {
    isDarkTheme,
    toggleTheme,
    bgCanvas: isDarkTheme ? 'bg-[#655A7C]' : 'bg-[#FDF1E2]',
    textPrimary: isDarkTheme ? 'text-[#FDF1E2]' : 'text-[#655A7C]',
    textSecondary: isDarkTheme ? 'text-[#AB92BF]' : 'text-[#655A7C]/80',
    cardBg: isDarkTheme ? 'bg-[#AB92BF]/20' : 'bg-[#AB92BF]/25',
    cardInnerBg: isDarkTheme ? 'bg-[#AB92BF]/30' : 'bg-[#FDF1E2]',
    borderTone: isDarkTheme ? 'border-[#AB92BF]/35' : 'border-[#655A7C]/25',
    accentSolid: isDarkTheme ? 'bg-[#FDF1E2] text-[#655A7C]' : 'bg-[#655A7C] text-[#FDF1E2]'
  };

  return (
    <ThemeContext.Provider value={themeTokens}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}