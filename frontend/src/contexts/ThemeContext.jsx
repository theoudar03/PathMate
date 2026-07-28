import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { token, user } = useApp();

  const [theme, setThemeState] = useState(() => {
    const val = localStorage.getItem('pm_theme') || 'light';
    console.log('[ThemeContext] Init theme state:', val);
    return val;
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const val = localStorage.getItem('pm_theme') || 'light';
    console.log('[ThemeContext] Init resolvedTheme state:', val);
    return val;
  });

  // Function to set theme preference
  const setTheme = async (newTheme) => {
    console.log('[ThemeContext] setTheme called with:', newTheme);
    if (!['light', 'dark'].includes(newTheme)) {
      console.warn('[ThemeContext] Invalid theme rejected:', newTheme);
      return;
    }
    setThemeState(newTheme);
    localStorage.setItem('pm_theme', newTheme);
    setResolvedTheme(newTheme);

    // If authenticated, sync with DB
    if (token) {
      try {
        console.log('[ThemeContext] Syncing theme with backend DB:', newTheme);
        await fetch('/auth/change-theme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ theme: newTheme })
        });
        console.log('[ThemeContext] Backend DB theme sync completed successfully.');
      } catch (err) {
        console.warn('Failed to sync theme preference with backend:', err.message);
      }
    }
  };

  // Listen for user payload shifts (to pull the database preference on login/sync)
  useEffect(() => {
    console.log('[ThemeContext] user.preferred_theme effect ran. user pref:', user?.preferred_theme);
    if (user?.preferred_theme) {
      if (['light', 'dark'].includes(user.preferred_theme)) {
        console.log('[ThemeContext] Overriding theme from database preference:', user.preferred_theme);
        setThemeState(user.preferred_theme);
        localStorage.setItem('pm_theme', user.preferred_theme);
        setResolvedTheme(user.preferred_theme);
      }
    }
  }, [user?.preferred_theme]);

  // Apply resolvedTheme to DOM document element class and styling
  useEffect(() => {
    console.log('[ThemeContext] Applying resolvedTheme to DOM documentElement:', resolvedTheme);
    const root = window.document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [resolvedTheme]);

  // Create a customized Material UI theme mirroring our MD3 design tokens
  const muiTheme = React.useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: isDark ? '#A4C6FF' : '#1B4DA6',
          contrastText: isDark ? '#002E68' : '#FFFFFF',
        },
        secondary: {
          main: isDark ? '#C2C6DC' : '#4A5568',
          contrastText: isDark ? '#2C3042' : '#FFFFFF',
        },
        error: {
          main: isDark ? '#FFB4AB' : '#C0392B',
          contrastText: isDark ? '#690005' : '#FFFFFF',
        },
        background: {
          default: isDark ? '#111318' : '#F5F7FA',
          paper: isDark ? '#202228' : '#FFFFFF',
        },
        text: {
          primary: isDark ? '#E2E2E9' : '#0F172A',
          secondary: isDark ? '#C3C6CF' : '#475569',
        },
      },
      typography: {
        fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
        h1: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
        h2: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
        h3: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
        h4: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
        h5: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
        h6: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 50,
              textTransform: 'none',
              fontWeight: 700,
            },
          },
        },
      },
    });
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
