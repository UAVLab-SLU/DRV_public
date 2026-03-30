import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

const COLOR_SCHEMES = {
  light: {
    cssVariables: {
      '--dw-color-body-bg': '#f8fafc',
      '--dw-color-body-bg-muted': '#eef6ff',
      '--dw-color-surface': '#ffffff',
      '--dw-color-surface-muted': '#f8fbff',
      '--dw-color-surface-raised': '#eef6ff',
      '--dw-color-surface-overlay': '#ffffff',
      '--dw-color-surface-glass': 'rgba(255, 255, 255, 0.05)',
      '--dw-color-surface-glass-border': 'rgba(255, 255, 255, 0.1)',
      '--dw-color-text-primary': '#0f172a',
      '--dw-color-text-secondary': '#475569',
      '--dw-color-text-muted': '#64748b',
      '--dw-color-text-inverse': '#ffffff',
      '--dw-color-text-inverse-muted': 'rgba(255, 255, 255, 0.85)',
      '--dw-color-text-link': '#2563eb',
      '--dw-color-text-link-accent': '#800080',
      '--dw-color-border': '#dbeafe',
      '--dw-color-border-muted': '#e5e7eb',
      '--dw-color-border-strong': '#0f172a',
      '--dw-color-primary': '#1e3a8a',
      '--dw-color-primary-hover': '#172554',
      '--dw-color-primary-contrast': '#ffffff',
      '--dw-color-secondary': '#7c3aed',
      '--dw-color-secondary-soft': '#ede9fe',
      '--dw-color-success': '#16a34a',
      '--dw-color-success-soft': '#dcfce7',
      '--dw-color-error': '#dc2626',
      '--dw-color-error-soft': '#fee2e2',
      '--dw-color-warning': '#f59e0b',
      '--dw-color-info': '#0ea5e9',
      '--dw-color-info-soft': '#e0f2fe',
      '--dw-color-info-strong': '#1d4ed8',
      '--dw-color-neutral-strong': '#334155',
      '--dw-color-nav-bg': '#6ddaed',
      '--dw-color-nav-text': '#0f172a',
      '--dw-color-nav-hover-text': '#ffffff',
      '--dw-color-footer-bg': '#ffffff',
      '--dw-color-footer-text': '#8c8c8c',
      '--dw-color-control-header-bg': '#d88100',
      '--dw-color-control-panel-bg': '#000000',
      '--dw-color-control-command': '#f59e0b',
      '--dw-color-control-info': '#ffffff',
      '--dw-color-table-row-add-bg': '#e0e0e0',
      '--dw-color-drag-outline': '#dc2626',
      '--dw-color-status-idle': '#16a34a',
      '--dw-color-status-running': '#2563eb',
      '--dw-color-status-error': '#dc2626',
      '--dw-color-status-unknown': '#64748b',
      '--dw-color-feature-purple-soft': '#ede9fe',
      '--dw-color-feature-purple': '#7c3aed',
      '--dw-color-feature-green-soft': '#dcfce7',
      '--dw-color-feature-green': '#16a34a',
      '--dw-color-feature-violet-soft': '#f3e8ff',
      '--dw-color-feature-violet': '#8b5cf6',
      '--dw-color-feature-orange-soft': '#ffedd5',
      '--dw-color-feature-orange': '#f97316',
      '--dw-color-about-page-bg': '#1e40af',
      '--dw-color-about-heading': '#1e40af',
      '--dw-color-about-text-secondary': '#374151',
      '--dw-gradient-hero': 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
      '--dw-gradient-page': 'linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%)',
      '--dw-gradient-card': 'linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%)',
      '--dw-gradient-about-callout':
        'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3730a3 100%)',
      '--dw-pattern-scan-lines':
        'repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.12) 0px, rgba(148, 163, 184, 0.12) 1px, transparent 1px, transparent 6px)',
      '--dw-shadow-soft': '0 4px 14px rgba(15, 23, 42, 0.06)',
      '--dw-shadow-strong': '0 10px 24px rgba(15, 23, 42, 0.08)',
    },
    palette: {
      mode: 'light',
      primary: { main: '#1e3a8a', dark: '#172554', contrastText: '#ffffff' },
      secondary: { main: '#7c3aed', dark: '#6d28d9', contrastText: '#ffffff' },
      success: { main: '#16a34a' },
      error: { main: '#dc2626' },
      warning: { main: '#f59e0b' },
      info: { main: '#0ea5e9' },
      background: { default: '#f8fafc', paper: '#ffffff' },
      text: { primary: '#0f172a', secondary: '#475569' },
      divider: '#dbeafe',
    },
  },
  dark: {
    cssVariables: {
      '--dw-color-body-bg': '#0b1120',
      '--dw-color-body-bg-muted': '#111827',
      '--dw-color-surface': '#111827',
      '--dw-color-surface-muted': '#172033',
      '--dw-color-surface-raised': '#1f2937',
      '--dw-color-surface-overlay': '#111827',
      '--dw-color-surface-glass': 'rgba(15, 23, 42, 0.58)',
      '--dw-color-surface-glass-border': 'rgba(148, 163, 184, 0.22)',
      '--dw-color-text-primary': '#e2e8f0',
      '--dw-color-text-secondary': '#cbd5e1',
      '--dw-color-text-muted': '#94a3b8',
      '--dw-color-text-inverse': '#f8fafc',
      '--dw-color-text-inverse-muted': 'rgba(226, 232, 240, 0.85)',
      '--dw-color-text-link': '#93c5fd',
      '--dw-color-text-link-accent': '#c084fc',
      '--dw-color-border': '#334155',
      '--dw-color-border-muted': '#475569',
      '--dw-color-border-strong': '#cbd5e1',
      '--dw-color-primary': '#3b82f6',
      '--dw-color-primary-hover': '#2563eb',
      '--dw-color-primary-contrast': '#f8fafc',
      '--dw-color-secondary': '#c084fc',
      '--dw-color-secondary-soft': '#312e81',
      '--dw-color-success': '#4ade80',
      '--dw-color-success-soft': '#052e16',
      '--dw-color-error': '#f87171',
      '--dw-color-error-soft': '#450a0a',
      '--dw-color-warning': '#fbbf24',
      '--dw-color-info': '#38bdf8',
      '--dw-color-info-soft': '#082f49',
      '--dw-color-info-strong': '#60a5fa',
      '--dw-color-neutral-strong': '#cbd5e1',
      '--dw-color-nav-bg': '#164e63',
      '--dw-color-nav-text': '#e2e8f0',
      '--dw-color-nav-hover-text': '#f8fafc',
      '--dw-color-footer-bg': '#0f172a',
      '--dw-color-footer-text': '#94a3b8',
      '--dw-color-control-header-bg': '#b45309',
      '--dw-color-control-panel-bg': '#020617',
      '--dw-color-control-command': '#fbbf24',
      '--dw-color-control-info': '#e2e8f0',
      '--dw-color-table-row-add-bg': '#1e293b',
      '--dw-color-drag-outline': '#f87171',
      '--dw-color-status-idle': '#4ade80',
      '--dw-color-status-running': '#60a5fa',
      '--dw-color-status-error': '#f87171',
      '--dw-color-status-unknown': '#94a3b8',
      '--dw-color-feature-purple-soft': '#312e81',
      '--dw-color-feature-purple': '#c084fc',
      '--dw-color-feature-green-soft': '#052e16',
      '--dw-color-feature-green': '#4ade80',
      '--dw-color-feature-violet-soft': '#3b0764',
      '--dw-color-feature-violet': '#a78bfa',
      '--dw-color-feature-orange-soft': '#431407',
      '--dw-color-feature-orange': '#fb923c',
      '--dw-color-about-page-bg': '#0f172a',
      '--dw-color-about-heading': '#93c5fd',
      '--dw-color-about-text-secondary': '#cbd5e1',
      '--dw-gradient-hero': 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
      '--dw-gradient-page': 'linear-gradient(180deg, #0b1120 0%, #111827 100%)',
      '--dw-gradient-card': 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
      '--dw-gradient-about-callout':
        'linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #312e81 100%)',
      '--dw-pattern-scan-lines':
        'repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.08) 0px, rgba(148, 163, 184, 0.08) 1px, transparent 1px, transparent 6px)',
      '--dw-shadow-soft': '0 4px 14px rgba(2, 6, 23, 0.38)',
      '--dw-shadow-strong': '0 10px 24px rgba(2, 6, 23, 0.48)',
    },
    palette: {
      mode: 'dark',
      primary: { main: '#3b82f6', dark: '#2563eb', contrastText: '#f8fafc' },
      secondary: { main: '#c084fc', dark: '#a855f7', contrastText: '#0f172a' },
      success: { main: '#4ade80' },
      error: { main: '#f87171' },
      warning: { main: '#fbbf24' },
      info: { main: '#38bdf8' },
      background: { default: '#0b1120', paper: '#111827' },
      text: { primary: '#e2e8f0', secondary: '#cbd5e1' },
      divider: '#334155',
    },
  },
};

const getPreferredColorMode = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'dark' : 'light';
};

const applyColorMode = (mode) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const { cssVariables, palette } = COLOR_SCHEMES[mode];

  Object.entries(cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  root.dataset.colorScheme = mode;
  root.style.colorScheme = mode;

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', palette.background.default);
  }
};

const createAppTheme = (mode) => {
  const { palette } = COLOR_SCHEMES[mode];

  return createTheme({
    palette,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: 'var(--dw-color-body-bg)',
            color: 'var(--dw-color-text-primary)',
          },
          '#root': {
            minHeight: '100vh',
            backgroundColor: 'var(--dw-color-body-bg)',
          },
          a: {
            color: 'inherit',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};

if (typeof document !== 'undefined') {
  applyColorMode(getPreferredColorMode());
}

function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(getPreferredColorMode);

  useEffect(() => {
    applyColorMode(mode);
  }, [mode]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    const handleChange = (event) => {
      setMode(event.matches ? 'dark' : 'light');
    };

    setMode(mediaQuery.matches ? 'dark' : 'light');

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const theme = createAppTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

ColorModeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ColorModeProvider;
