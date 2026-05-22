import { createTheme, alpha } from '@mui/material/styles';

export const SIDEBAR_WIDTH = 248;

export const BRAND = {
  indigo:   '#6366f1',
  indigoDark: '#4f46e5',
  indigoLight: '#818cf8',
  violet:   '#7c3aed',
  sky:      '#0ea5e9',
  emerald:  '#10b981',
  amber:    '#f59e0b',
  rose:     '#f43f5e',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
} as const;

export const theme = createTheme({
  palette: {
    primary:    { main: BRAND.indigo,   dark: BRAND.indigoDark,  light: BRAND.indigoLight, contrastText: '#fff' },
    secondary:  { main: BRAND.sky,       contrastText: '#fff' },
    success:    { main: BRAND.emerald,   light: '#d1fae5', dark: '#065f46',  contrastText: '#fff' },
    warning:    { main: BRAND.amber,     light: '#fef3c7', dark: '#92400e',  contrastText: '#fff' },
    error:      { main: BRAND.rose,      light: '#ffe4e6', dark: '#be123c',  contrastText: '#fff' },
    info:       { main: BRAND.sky,       light: '#dbeafe', dark: '#1e40af',  contrastText: '#fff' },
    background: { default: BRAND.slate50, paper: '#ffffff' },
    text:       { primary: BRAND.slate900, secondary: BRAND.slate600 },
    divider:    BRAND.slate200,
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3:  { fontWeight: 800, letterSpacing: '-0.03em' },
    h4:  { fontWeight: 800, letterSpacing: '-0.025em' },
    h5:  { fontWeight: 700, letterSpacing: '-0.02em' },
    h6:  { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.005em' },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
    body1: { letterSpacing: '-0.005em' },
    body2: { color: BRAND.slate600, letterSpacing: '-0.005em' },
    caption: { letterSpacing: '0' },
    overline: { letterSpacing: '0.1em', fontWeight: 700, fontSize: '0.6875rem' },
  },

  shape: { borderRadius: 10 },

  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',
    '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.06)',
    '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.05)',
    '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)',
    '0 20px 25px -5px rgba(0,0,0,0.07), 0 8px 10px -6px rgba(0,0,0,0.04)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.2)',
    '0 25px 60px -12px rgba(0,0,0,0.25)',
    ...Array(16).fill('none'),
  ] as any,

  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        * { box-sizing: border-box; }
      `,
    },

    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.05)',
          border: `1px solid ${BRAND.slate200}`,
          borderRadius: 14,
          backgroundImage: 'none',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': { paddingBottom: 16 },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          fontSize: '0.875rem',
          letterSpacing: '-0.01em',
          transition: 'all 0.15s ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: `0 4px 16px ${alpha(BRAND.indigo, 0.3)}`, transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)', boxShadow: 'none' },
        },
        outlined: {
          borderColor: BRAND.slate200,
          '&:hover': { borderColor: BRAND.indigo, backgroundColor: alpha(BRAND.indigo, 0.04) },
        },
        sizeSmall: { borderRadius: 7, fontSize: '0.8125rem', padding: '4px 10px' },
        sizeLarge: { borderRadius: 10, fontSize: '0.9375rem', padding: '10px 24px' },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.15s ease',
          '&:hover': { backgroundColor: BRAND.slate100 },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          fontSize: '0.75rem',
          letterSpacing: '0',
          border: 'none',
        },
        sizeSmall: { height: 22, fontSize: '0.71rem' },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: BRAND.slate50,
            fontWeight: 700,
            color: BRAND.slate400,
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderBottom: `2px solid ${BRAND.slate200}`,
            padding: '10px 16px',
            whiteSpace: 'nowrap',
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.1s ease',
          '&:hover': { backgroundColor: BRAND.slate50 },
          '&:last-child td': { border: 0 },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${BRAND.slate100}`,
          padding: '11px 16px',
          fontSize: '0.875rem',
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: { borderRadius: '9px !important', fontSize: '0.875rem' },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': { borderColor: BRAND.slate200, transition: 'border-color 0.15s ease' },
          '&:hover fieldset': { borderColor: `${BRAND.slate400} !important` },
          '&.Mui-focused fieldset': { borderColor: `${BRAND.indigo} !important`, borderWidth: '1.5px !important' },
        },
        input: { padding: '10px 14px' },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.875rem', color: BRAND.slate400, '&.Mui-focused': { color: BRAND.indigo } },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 3, backgroundColor: BRAND.slate100 },
        bar: { borderRadius: 4 },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)' },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontSize: '0.875rem', alignItems: 'flex-start' },
        standardError:   { backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' },
        standardSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
        standardWarning: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#b45309' },
        standardInfo:    { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 40,
          padding: '6px 14px',
          color: BRAND.slate400,
          '&.Mui-selected': { color: BRAND.slate900 },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: {
          height: 2,
          borderRadius: 2,
          backgroundColor: BRAND.indigo,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { padding: '20px 24px 12px', fontSize: '1rem', fontWeight: 700 },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '0 24px 8px' },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '12px 24px 20px', gap: 8 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: BRAND.slate800,
          fontSize: '0.75rem',
          borderRadius: 6,
          padding: '5px 10px',
        },
        arrow: { color: BRAND.slate800 },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: BRAND.slate100 },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.15s ease',
        },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },

    MuiSnackbar: {
      styleOverrides: {
        root: { '& .MuiSnackbarContent-root': { borderRadius: 10 } },
      },
    },

    MuiStepper: {
      styleOverrides: {
        root: { padding: 0 },
      },
    },

    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            borderRadius: 7,
            fontWeight: 600,
            fontSize: '0.8125rem',
          },
          '& .Mui-selected': {
            backgroundColor: `${alpha(BRAND.indigo, 0.1)} !important`,
            color: BRAND.indigo,
          },
        },
      },
    },

    MuiBadge: {
      styleOverrides: {
        badge: { fontSize: '0.65rem', fontWeight: 700, minWidth: 16, height: 16 },
      },
    },
  },
});
