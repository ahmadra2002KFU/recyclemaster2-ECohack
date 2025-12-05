import { Theme } from '../contexts/ThemeContext';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHeader: string;
  bgCard: string;
  bgInput: string;
  bgNav: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textAccent: string;
  
  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  
  // Button colors
  btnPrimary: string;
  btnPrimaryHover: string;
  btnSecondary: string;
  btnSecondaryHover: string;
  btnDanger: string;
  btnDangerHover: string;
  
  // Accent colors
  accentGreen: string;
  accentGreenHover: string;
  accentBlue: string;
  accentBlueHover: string;
  accentRed: string;
  accentRedHover: string;
  
  // Status colors
  statusActive: string;
  statusInactive: string;
}

export const themeColors: Record<Theme, ThemeColors> = {
  dark: {
    // Background colors
    bgPrimary: 'bg-gray-900',
    bgSecondary: 'bg-gray-800',
    bgTertiary: 'bg-gray-700',
    bgHeader: 'bg-gray-800/50',
    bgCard: 'bg-gray-800',
    bgInput: 'bg-gray-700',
    bgNav: 'bg-gray-800/80',
    
    // Text colors
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300',
    textTertiary: 'text-gray-400',
    textAccent: 'text-green-400',
    
    // Border colors
    borderPrimary: 'border-gray-700/50',
    borderSecondary: 'border-gray-600',
    
    // Button colors
    btnPrimary: 'bg-green-500',
    btnPrimaryHover: 'hover:bg-green-600',
    btnSecondary: 'bg-gray-700',
    btnSecondaryHover: 'hover:bg-gray-600',
    btnDanger: 'bg-red-500',
    btnDangerHover: 'hover:bg-red-600',
    
    // Accent colors
    accentGreen: 'text-green-400',
    accentGreenHover: 'hover:text-green-300',
    accentBlue: 'bg-blue-500',
    accentBlueHover: 'hover:bg-blue-600',
    accentRed: 'bg-red-500',
    accentRedHover: 'hover:bg-red-600',
    
    // Status colors
    statusActive: 'bg-green-400',
    statusInactive: 'bg-gray-600',
  },
  light: {
    // Background colors
    bgPrimary: 'bg-gray-50',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-gray-100',
    bgHeader: 'bg-white/90',
    bgCard: 'bg-white',
    bgInput: 'bg-gray-100',
    bgNav: 'bg-white/95',
    
    // Text colors
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textTertiary: 'text-gray-600',
    textAccent: 'text-green-600',
    
    // Border colors
    borderPrimary: 'border-gray-200',
    borderSecondary: 'border-gray-300',
    
    // Button colors
    btnPrimary: 'bg-green-600',
    btnPrimaryHover: 'hover:bg-green-700',
    btnSecondary: 'bg-gray-200',
    btnSecondaryHover: 'hover:bg-gray-300',
    btnDanger: 'bg-red-600',
    btnDangerHover: 'hover:bg-red-700',
    
    // Accent colors
    accentGreen: 'text-green-600',
    accentGreenHover: 'hover:text-green-700',
    accentBlue: 'bg-blue-600',
    accentBlueHover: 'hover:bg-blue-700',
    accentRed: 'bg-red-600',
    accentRedHover: 'hover:bg-red-700',
    
    // Status colors
    statusActive: 'bg-green-500',
    statusInactive: 'bg-gray-300',
  },
};

export const getThemeClasses = (theme: Theme): ThemeColors => {
  return themeColors[theme];
};

