import { useState, useEffect } from 'react';

type Theme = 'light' | 'pink';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'pink')) {
      return savedTheme;
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'pink');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'pink' : 'light');
  };

  return {
    theme,
    toggleTheme,
    isPink: theme === 'pink'
  };
}