import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full bg-surfaceContainer hover:bg-surfaceContainerHigh border border-outline/30 flex items-center justify-center text-onSurfaceVariant hover:text-onSurface transition-all duration-200 active:scale-[0.9] cursor-pointer hover:rotate-12"
      aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    >
      <span className="material-symbols-outlined text-[19px] select-none transition-transform duration-250">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
