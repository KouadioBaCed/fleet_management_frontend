import { useEffect, ReactNode } from 'react';
import { useColors, useTheme } from '@/store/settingsStore';

interface ThemeProviderProps {
  children: ReactNode;
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper function to lighten a color
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const lighten = (value: number) => Math.min(255, Math.floor(value + (255 - value) * (percent / 100)));

  const r = lighten(rgb.r);
  const g = lighten(rgb.g);
  const b = lighten(rgb.b);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper function to darken a color
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const darken = (value: number) => Math.max(0, Math.floor(value * (1 - percent / 100)));

  const r = darken(rgb.r);
  const g = darken(rgb.g);
  const b = darken(rgb.b);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { primary, secondary } = useColors();
  const theme = useTheme();

  useEffect(() => {
    const root = document.documentElement;

    // Set primary color variants
    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-light', lightenColor(primary, 85));
    root.style.setProperty('--color-primary-dark', darkenColor(primary, 15));
    root.style.setProperty('--color-primary-hover', darkenColor(primary, 10));

    // Set secondary color variants
    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty('--color-secondary-light', lightenColor(secondary, 85));
    root.style.setProperty('--color-secondary-dark', darkenColor(secondary, 15));
    root.style.setProperty('--color-secondary-hover', darkenColor(secondary, 10));

    // Handle dark/light theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto mode - check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [primary, secondary, theme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return <>{children}</>;
}
