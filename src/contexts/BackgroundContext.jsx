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
  // 只使用光明模式
  const theme = 'light';

  const currentTheme = {
    name: 'light',
    background: '#ffffff',
    isDark: false
  };

  const value = {
    theme,
    currentTheme,
    // 保持向后兼容
    backgroundImage: currentTheme.background
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
};

export default BackgroundContext;
