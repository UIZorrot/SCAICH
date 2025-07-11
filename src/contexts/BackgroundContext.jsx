import React, { createContext, useContext, useState, useEffect } from 'react';

const BackgroundContext = createContext();

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};

export const BackgroundProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to light
    return localStorage.getItem('scai-theme') || 'light';
  });

  const themes = {
    light: {
      name: 'light',
      background: '#ffffff',
      isDark: false
    },
    dark: {
      name: 'dark',
      background: 'rgba(33, 33, 33, 1)',
      isDark: true
    }
  };

  const switchTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('scai-theme', newTheme);
  };

  const setCurrentTheme = (themeName) => {
    if (themes[themeName]) {
      setTheme(themeName);
      localStorage.setItem('scai-theme', themeName);
    }
  };

  const value = {
    theme,
    currentTheme: themes[theme],
    themes,
    switchTheme,
    setCurrentTheme,
    // 保持向后兼容
    backgroundImage: themes[theme].background,
    switchBackground: switchTheme
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
};

export default BackgroundContext;
