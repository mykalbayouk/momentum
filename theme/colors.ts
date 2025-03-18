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
      main: '#00801CFF', // Maroon for success
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
    default: '#121212FF', // Light grey background
    paper: '#252525FF', // White paper background
  },
  
  // Text colors
  text: {
    primary: '#FFFFFFFF', // Black text
    secondary: '#ACACACFF', // Medium grey text
    disabled: '#4B4B4BFF', // Light grey text
    inverse: '#000000FF', // White text
  },
  border: {
    light: '#E6E6E6',
    dark: '#333333',
  },
  overlay: {
    light: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
  error: {
    main: '#DC2626',
    light: '#FEE2E2',
    dark: '#991B1B',
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