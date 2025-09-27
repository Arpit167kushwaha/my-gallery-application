import { Dimensions, Platform } from 'react-native';

export interface ResponsiveConfig {
  columns: number;
  itemSpacing: number;
  containerPadding: number;
  itemAspectRatio: number;
}

export class ResponsiveUtils {
  static getScreenDimensions() {
    return Dimensions.get('window');
  }

  static getResponsiveConfig(): ResponsiveConfig {
    const { width, height } = this.getScreenDimensions();
    const isLandscape = width > height;
    
    // Determine device type
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const isPhone = width < 768;

    // Calculate responsive columns
    let columns = 2; // Default for phones
    
    if (isDesktop) {
      columns = isLandscape ? 6 : 4;
    } else if (isTablet) {
      columns = isLandscape ? 4 : 3;
    } else if (isPhone) {
      columns = isLandscape ? 3 : 2;
    }

    // Responsive spacing
    const containerPadding = isDesktop ? 24 : isTablet ? 20 : 16;
    const itemSpacing = isDesktop ? 20 : isTablet ? 16 : 12;

    return {
      columns,
      itemSpacing,
      containerPadding,
      itemAspectRatio: 1, // Square aspect ratio
    };
  }

  static getItemWidth(config: ResponsiveConfig): number {
    const { width } = this.getScreenDimensions();
    const { columns, itemSpacing, containerPadding } = config;
    
    const totalPadding = containerPadding * 2;
    const totalSpacing = itemSpacing * (columns - 1);
    const availableWidth = width - totalPadding - totalSpacing;
    
    return Math.floor(availableWidth / columns);
  }

  static getBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
    const { width } = this.getScreenDimensions();
    
    if (width >= 1024) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
  }

  static isLandscape(): boolean {
    const { width, height } = this.getScreenDimensions();
    return width > height;
  }

  static getFontSize(base: number): number {
    const { width } = this.getScreenDimensions();
    const breakpoint = this.getBreakpoint();
    
    switch (breakpoint) {
      case 'desktop':
        return base * 1.2;
      case 'tablet':
        return base * 1.1;
      default:
        return base;
    }
  }

  static getSpacing(base: number): number {
    const breakpoint = this.getBreakpoint();
    
    switch (breakpoint) {
      case 'desktop':
        return base * 1.5;
      case 'tablet':
        return base * 1.25;
      default:
        return base;
    }
  }

  static getMinTouchTarget(): number {
    // WCAG AA minimum touch target
    return Platform.OS === 'web' ? 24 : 44;
  }
}