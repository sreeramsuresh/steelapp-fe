import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Dark Theme Configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#008B8B',
      light: '#4DB6AC',
      dark: '#00695C',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#263238',
      light: '#37474F',
      dark: '#1C2632',
      contrastText: '#ffffff',
    },
    error: {
      main: '#D32F2F',
      light: '#F44336',
      dark: '#B71C1C',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#FFC107',
      light: '#FFD54F',
      dark: '#F57C00',
      contrastText: '#000000',
    },
    info: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    success: {
      main: '#388E3C',
      light: '#66BB6A',
      dark: '#2E7D32',
      contrastText: '#ffffff',
    },
    background: {
      default: '#121418',
      paper: '#1E2328',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0BEC5',
      disabled: '#78909C',
    },
    divider: '#37474F',
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      color: '#ffffff',
      '@media (min-width:1200px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:1536px)': {
        fontSize: '2.75rem',
      },
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      color: '#ffffff',
      '@media (min-width:1200px)': {
        fontSize: '2rem',
      },
      '@media (min-width:1536px)': {
        fontSize: '2.25rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#ffffff',
      '@media (min-width:1200px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:1536px)': {
        fontSize: '1.875rem',
      },
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#ffffff',
      '@media (min-width:1200px)': {
        fontSize: '1.375rem',
      },
      '@media (min-width:1536px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#ffffff',
      '@media (min-width:1200px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#ffffff',
      '@media (min-width:1200px)': {
        fontSize: '1.125rem',
      },
    },
    body1: {
      fontSize: '0.875rem',
      color: '#a8b2d1',
      '@media (min-width:1200px)': {
        fontSize: '1rem',
      },
    },
    body2: {
      fontSize: '0.8125rem',
      color: '#6c7582',
      '@media (min-width:1200px)': {
        fontSize: '0.875rem',
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  shadows: [
    'none',                               // 0
    '0 1px 2px rgba(0, 0, 0, 0.3)',      // 1
    '0 4px 6px rgba(0, 0, 0, 0.4)',      // 2
    '0 6px 10px rgba(0, 0, 0, 0.4)',     // 3
    '0 8px 12px rgba(0, 0, 0, 0.4)',     // 4
    '0 10px 15px rgba(0, 0, 0, 0.5)',    // 5
    '0 12px 18px rgba(0, 0, 0, 0.5)',    // 6
    '0 14px 20px rgba(0, 0, 0, 0.5)',    // 7
    '0 16px 22px rgba(0, 0, 0, 0.6)',    // 8
    '0 18px 24px rgba(0, 0, 0, 0.6)',    // 9
    '0 20px 25px rgba(0, 0, 0, 0.6)',    // 10
    '0 22px 28px rgba(0, 0, 0, 0.6)',    // 11
    '0 24px 30px rgba(0, 0, 0, 0.7)',    // 12
    '0 26px 32px rgba(0, 0, 0, 0.7)',    // 13
    '0 28px 34px rgba(0, 0, 0, 0.7)',    // 14
    '0 30px 36px rgba(0, 0, 0, 0.7)',    // 15
    '0 32px 38px rgba(0, 0, 0, 0.8)',    // 16
    '0 34px 40px rgba(0, 0, 0, 0.8)',    // 17
    '0 36px 42px rgba(0, 0, 0, 0.8)',    // 18
    '0 38px 44px rgba(0, 0, 0, 0.8)',    // 19
    '0 40px 46px rgba(0, 0, 0, 0.9)',    // 20
    '0 42px 48px rgba(0, 0, 0, 0.9)',    // 21
    '0 44px 50px rgba(0, 0, 0, 0.9)',    // 22
    '0 46px 52px rgba(0, 0, 0, 0.9)',    // 23
    '0 48px 54px rgba(0, 0, 0, 1)',      // 24
    '0 50px 56px rgba(0, 0, 0, 1)',      // 25
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#121418',
          color: '#ffffff',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: 1.6,
          fontSize: '14px',
          overflow: 'hidden',
          height: '100vh',
        },
        'input, input[type="text"], input[type="email"], input[type="password"], .MuiInputBase-input, .MuiOutlinedInput-input': {
          color: '#FFFFFF !important',
          WebkitTextFillColor: '#FFFFFF !important',
          caretColor: '#008B8B !important',
        },
        html: {
          height: '100vh',
          overflow: 'hidden',
        },
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        '::-webkit-scrollbar': {
          width: '6px',
        },
        '::-webkit-scrollbar-track': {
          background: '#1E2328',
        },
        '::-webkit-scrollbar-thumb': {
          background: '#37474F',
          borderRadius: '3px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: '#455A73',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #008B8B 0%, #00695C 100%)',
          color: '#ffffff',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4DB6AC 0%, #008B8B 100%)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          backgroundColor: '#1E2328',
          borderColor: '#37474F',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#2E3B4E',
            borderColor: '#455A73',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E2328',
          borderRadius: '12px',
          border: '1px solid #37474F',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E2328',
          border: '1px solid #37474F',
        },
      },
    },
  },
});

// Light Theme Configuration
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#008B8B',
      light: '#4DB6AC',
      dark: '#00695C',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#263238',
      light: '#37474F',
      dark: '#1C2632',
      contrastText: '#ffffff',
    },
    error: {
      main: '#D32F2F',
      light: '#F44336',
      dark: '#B71C1C',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#FFC107',
      light: '#FFD54F',
      dark: '#F57C00',
      contrastText: '#000000',
    },
    info: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    success: {
      main: '#388E3C',
      light: '#66BB6A',
      dark: '#2E7D32',
      contrastText: '#ffffff',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
    },
    divider: '#E0E0E0',
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      color: '#212121',
      '@media (min-width:1200px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:1536px)': {
        fontSize: '2.75rem',
      },
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      color: '#212121',
      '@media (min-width:1200px)': {
        fontSize: '2rem',
      },
      '@media (min-width:1536px)': {
        fontSize: '2.25rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#212121',
      '@media (min-width:1200px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:1536px)': {
        fontSize: '1.875rem',
      },
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#212121',
      '@media (min-width:1200px)': {
        fontSize: '1.375rem',
      },
      '@media (min-width:1536px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#212121',
      '@media (min-width:1200px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#212121',
      '@media (min-width:1200px)': {
        fontSize: '1.125rem',
      },
    },
    body1: {
      fontSize: '0.875rem',
      color: '#424242',
      '@media (min-width:1200px)': {
        fontSize: '1rem',
      },
    },
    body2: {
      fontSize: '0.8125rem',
      color: '#757575',
      '@media (min-width:1200px)': {
        fontSize: '0.875rem',
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  shadows: [
    'none',                               // 0
    '0 1px 3px rgba(0, 0, 0, 0.12)',     // 1
    '0 2px 4px rgba(0, 0, 0, 0.14)',     // 2
    '0 4px 6px rgba(0, 0, 0, 0.16)',     // 3
    '0 6px 8px rgba(0, 0, 0, 0.18)',     // 4
    '0 8px 10px rgba(0, 0, 0, 0.20)',    // 5
    '0 10px 12px rgba(0, 0, 0, 0.22)',   // 6
    '0 12px 14px rgba(0, 0, 0, 0.24)',   // 7
    '0 14px 16px rgba(0, 0, 0, 0.26)',   // 8
    '0 16px 18px rgba(0, 0, 0, 0.28)',   // 9
    '0 18px 20px rgba(0, 0, 0, 0.30)',   // 10
    '0 20px 22px rgba(0, 0, 0, 0.32)',   // 11
    '0 22px 24px rgba(0, 0, 0, 0.34)',   // 12
    '0 24px 26px rgba(0, 0, 0, 0.36)',   // 13
    '0 26px 28px rgba(0, 0, 0, 0.38)',   // 14
    '0 28px 30px rgba(0, 0, 0, 0.40)',   // 15
    '0 30px 32px rgba(0, 0, 0, 0.42)',   // 16
    '0 32px 34px rgba(0, 0, 0, 0.44)',   // 17
    '0 34px 36px rgba(0, 0, 0, 0.46)',   // 18
    '0 36px 38px rgba(0, 0, 0, 0.48)',   // 19
    '0 38px 40px rgba(0, 0, 0, 0.50)',   // 20
    '0 40px 42px rgba(0, 0, 0, 0.52)',   // 21
    '0 42px 44px rgba(0, 0, 0, 0.54)',   // 22
    '0 44px 46px rgba(0, 0, 0, 0.56)',   // 23
    '0 46px 48px rgba(0, 0, 0, 0.58)',   // 24
    '0 48px 50px rgba(0, 0, 0, 0.60)',   // 25
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FAFAFA',
          color: '#212121',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: 1.6,
          fontSize: '14px',
          overflow: 'hidden',
          height: '100vh',
        },
        'input, input[type="text"], input[type="email"], input[type="password"], .MuiInputBase-input, .MuiOutlinedInput-input': {
          color: '#212121 !important',
          WebkitTextFillColor: '#212121 !important',
          caretColor: '#008B8B !important',
        },
        html: {
          height: '100vh',
          overflow: 'hidden',
        },
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        '::-webkit-scrollbar': {
          width: '6px',
        },
        '::-webkit-scrollbar-track': {
          background: '#F5F5F5',
        },
        '::-webkit-scrollbar-thumb': {
          background: '#BDBDBD',
          borderRadius: '3px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: '#9E9E9E',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #008B8B 0%, #00695C 100%)',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.14)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4DB6AC 0%, #008B8B 100%)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.18)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          backgroundColor: '#FFFFFF',
          borderColor: '#E0E0E0',
          color: '#424242',
          '&:hover': {
            backgroundColor: '#F5F5F5',
            borderColor: '#BDBDBD',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E0E0E0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.14)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.18)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E0E0E0',
        },
      },
    },
  },
});

// Helper function to detect system theme preference
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false; // Default to light if unable to detect
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved || 'system'; // Default to system mode
  });

  const [systemIsDark, setSystemIsDark] = useState(getSystemTheme);

  // Determine the actual theme based on mode
  const isDarkMode = themeMode === 'system' ? systemIsDark : themeMode === 'dark';
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Cycle through theme modes: light -> dark -> system -> light...
  const toggleTheme = () => {
    let newMode;
    if (themeMode === 'light') {
      newMode = 'dark';
    } else if (themeMode === 'dark') {
      newMode = 'system';
    } else {
      newMode = 'light';
    }
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // Set specific theme mode
  const setTheme = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
  };

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        setSystemIsDark(e.matches);
      };
      
      // Add listener for system theme changes
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // Cleanup listener on unmount
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, []);

  useEffect(() => {
    // Update CSS custom properties for the current theme
    const root = document.documentElement;
    
    if (isDarkMode) {
      // Dark theme CSS variables
      root.style.setProperty('--primary-bg', '#121418');
      root.style.setProperty('--secondary-bg', '#1E2328');
      root.style.setProperty('--tertiary-bg', '#2E3B4E');
      root.style.setProperty('--card-bg', '#1E2328');
      root.style.setProperty('--text-primary', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#B0BEC5');
      root.style.setProperty('--text-muted', '#78909C');
      root.style.setProperty('--border-primary', '#37474F');
      root.style.setProperty('--border-secondary', '#455A73');
    } else {
      // Light theme CSS variables
      root.style.setProperty('--primary-bg', '#FAFAFA');
      root.style.setProperty('--secondary-bg', '#FFFFFF');
      root.style.setProperty('--tertiary-bg', '#F5F5F5');
      root.style.setProperty('--card-bg', '#FFFFFF');
      root.style.setProperty('--text-primary', '#212121');
      root.style.setProperty('--text-secondary', '#757575');
      root.style.setProperty('--text-muted', '#BDBDBD');
      root.style.setProperty('--border-primary', '#E0E0E0');
      root.style.setProperty('--border-secondary', '#BDBDBD');
    }
  }, [isDarkMode]);

  const value = {
    isDarkMode,
    themeMode,
    systemIsDark,
    toggleTheme,
    setTheme,
    theme: currentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};