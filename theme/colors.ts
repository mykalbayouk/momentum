export const colors = {
  // Primary colors
  primary: {
    main: '#800000', // Maroon
    light: '#FFE5E5', // Light maroon
    dark: '#4D0000', // Dark maroon
  },
  
  // Secondary colors
  secondary: {
    main: '#333333', // Dark grey
    light: '#E6E6E6', // Light grey
    dark: '#1A1A1A', // Very dark grey
  },
  
  // Neutral colors
  neutral: {
    black: '#000000',
    grey900: '#1A1A1A',
    grey800: '#333333',
    grey700: '#4D4D4D',
    grey600: '#666666',
    grey500: '#808080',
    grey400: '#999999',
    grey300: '#B3B3B3',
    grey200: '#CCCCCC',
    grey100: '#E6E6E6',
    white: '#FFFFFF',
  },
  
  // Semantic colors
  semantic: {
    success: {
      main: '#800000', // Maroon for success
      light: '#E5E8FFFF',
      dark: '#4D0000',
    },
    error: {
      main: '#800000', // Maroon for error
      light: '#FFE5E5',
      dark: '#4D0000',
    },
    warning: {
      main: '#800000', // Maroon for warning
      light: '#FFE5E5',
      dark: '#4D0000',
    },
    info: {
      main: '#800000', // Maroon for info
      light: '#FFE5E5',
      dark: '#4D0000',
    },
  },
  
  // Background colors
  background: {
    default: '#F2F2F2', // Light grey background
    paper: '#FFFFFF', // White paper background
  },
  
  // Text colors
  text: {
    primary: '#000000', // Black text
    secondary: '#666666', // Medium grey text
    disabled: '#999999', // Light grey text
    inverse: '#FFFFFF', // White text
  },
  border: {
    light: '#E6E6E6',
    dark: '#333333',
  },
  overlay: {
    light: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

// Type for the colors object
export type Colors = typeof colors;

// Helper function to safely get color values
export function getColor(path: string): string {
  const parts = path.split('.');
  let value: any = colors;
  
  for (const part of parts) {
    value = value[part];
    if (value === undefined) {
      return '#000000'; // Fallback to black if color not found
    }
  }
  
  return value;
} 