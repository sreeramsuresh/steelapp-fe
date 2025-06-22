import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF6B35', // Steel orange
      light: '#FF8A65',
      dark: '#E64A19',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2E3B4E', // Steel blue-grey
      light: '#455A73',
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
      default: '#121418', // Darker steel grey
      paper: '#1E2328',   // Steel card background
    },
    text: {
      primary: '#FFFFFF',    // Pure white
      secondary: '#B0BEC5',  // Light steel grey
      disabled: '#78909C',   // Muted steel grey
    },
    divider: '#37474F', // Steel divider
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
    borderRadius: 8, // --radius-md
  },
  spacing: 8, // Base spacing unit
  shadows: [
    'none',
    '0 1px 2px rgba(0, 0, 0, 0.3)',     // --shadow-sm
    '0 4px 6px rgba(0, 0, 0, 0.4)',     // --shadow-md
    '0 10px 15px rgba(0, 0, 0, 0.5)',   // --shadow-lg
    '0 20px 25px rgba(0, 0, 0, 0.6)',   // --shadow-xl
    '0 25px 50px rgba(0, 0, 0, 0.7)',
    '0 25px 50px rgba(0, 0, 0, 0.8)',
    '0 25px 50px rgba(0, 0, 0, 0.9)',
    '0 25px 50px rgba(0, 0, 0, 1)',
    // Add more shadows as needed
    ...Array(15).fill('0 25px 50px rgba(0, 0, 0, 1)')
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
          caretColor: '#FF6B35 !important',
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
          background: 'linear-gradient(135deg, #FF6B35 0%, #E64A19 100%)',
          color: '#ffffff',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF8A65 0%, #FF6B35 100%)',
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
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1E2328 !important',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: '#37474F',
              backgroundColor: 'transparent !important',
            },
            '&:hover fieldset': {
              borderColor: '#455A73',
              backgroundColor: 'transparent !important',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FF6B35',
              backgroundColor: 'transparent !important',
            },
            '&.Mui-focused': {
              backgroundColor: '#1E2328 !important',
              transform: 'translateY(-1px)',
            },
            '& input': {
              color: '#FFFFFF !important',
              backgroundColor: 'transparent !important',
              WebkitTextFillColor: '#FFFFFF !important',
              opacity: '1 !important',
              '&::placeholder': {
                color: '#78909C !important',
                opacity: 1,
              },
            },
          },
          '& .MuiInputLabel-root': {
            color: '#78909C',
            '&.Mui-focused': {
              color: '#FF6B35',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: '#FFFFFF !important',
            backgroundColor: 'transparent !important',
            WebkitTextFillColor: '#FFFFFF !important',
            opacity: '1 !important',
            '&::placeholder': {
              color: '#78909C',
              opacity: 1,
            },
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
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1E2328',
          borderRadius: '16px',
          border: '1px solid #37474F',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.6)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #37474F',
        },
        indicator: {
          backgroundColor: '#FF6B35',
          height: '2px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          color: '#78909C',
          fontWeight: 500,
          '&.Mui-selected': {
            color: '#FF6B35',
          },
          '&:hover': {
            color: '#ffffff',
            backgroundColor: '#1E2328',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#78909C',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: '#FF6B35',
            color: '#ffffff',
            transform: 'scale(1.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          color: '#FF6B35',
          border: '1px solid rgba(255, 107, 53, 0.2)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E2328',
          borderRadius: '4px',
        },
        bar: {
          background: 'linear-gradient(135deg, #FF6B35 0%, #E64A19 100%)',
          borderRadius: '4px',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: '#FFFFFF !important',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E2328 !important',
          '&.Mui-focused': {
            backgroundColor: '#1E2328 !important',
          },
          '& fieldset': {
            backgroundColor: 'transparent !important',
          },
          '&.Mui-focused fieldset': {
            backgroundColor: 'transparent !important',
          },
        },
        input: {
          color: '#FFFFFF !important',
          backgroundColor: 'transparent !important',
          WebkitTextFillColor: '#FFFFFF !important',
          opacity: '1 !important',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          color: '#FFFFFF !important',
          backgroundColor: 'transparent !important',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1E2328 !important',
            '&.Mui-focused': {
              backgroundColor: '#1E2328 !important',
            },
            '& fieldset': {
              backgroundColor: 'transparent !important',
            },
            '&.Mui-focused fieldset': {
              backgroundColor: 'transparent !important',
            },
          },
        },
      },
    },
  },
});

export default muiTheme;