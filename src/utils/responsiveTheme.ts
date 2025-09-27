import { Theme } from '../types';
import { ResponsiveUtils } from './responsive';

export const createResponsiveTheme = (baseTheme: Theme): Theme => {
  const breakpoint = ResponsiveUtils.getBreakpoint();
  
  // Enhanced shadows for larger screens
  const getShadowStyle = () => {
    switch (breakpoint) {
      case 'desktop':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        };
      case 'tablet':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 6,
        };
      default:
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        };
    }
  };

  // Enhanced border radius for larger screens
  const getBorderRadius = (base: number) => {
    switch (breakpoint) {
      case 'desktop':
        return base * 1.5;
      case 'tablet':
        return base * 1.25;
      default:
        return base;
    }
  };

  return {
    ...baseTheme,
    shadows: getShadowStyle(),
    borderRadius: {
      small: getBorderRadius(4),
      medium: getBorderRadius(8),
      large: getBorderRadius(12),
      xlarge: getBorderRadius(16),
    },
    spacing: {
      xs: ResponsiveUtils.getSpacing(4),
      sm: ResponsiveUtils.getSpacing(8),
      md: ResponsiveUtils.getSpacing(16),
      lg: ResponsiveUtils.getSpacing(24),
      xl: ResponsiveUtils.getSpacing(32),
    },
    typography: {
      h1: ResponsiveUtils.getFontSize(24),
      h2: ResponsiveUtils.getFontSize(20),
      h3: ResponsiveUtils.getFontSize(18),
      body: ResponsiveUtils.getFontSize(14),
      caption: ResponsiveUtils.getFontSize(12),
      small: ResponsiveUtils.getFontSize(10),
    },
  } as any;
};

export const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    card: '#F2F2F7',
    text: '#000000',
    border: '#C6C6C8',
    notification: '#FF3B30',
    surface: '#FFFFFF',
    onSurface: '#000000',
    accent: '#34C759',
  },
};

export const darkTheme: Theme = {
  colors: {
    primary: '#0A84FF',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#38383A',
    notification: '#FF453A',
    surface: '#1C1C1E',
    onSurface: '#FFFFFF',
    accent: '#30D158',
  },
};