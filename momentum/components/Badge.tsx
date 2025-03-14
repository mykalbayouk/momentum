import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  value: string | number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  outlined?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  value,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  outlined = false,
}) => {
  const getBadgeStyle = () => {
    const baseStyle = [styles.badge, styles[`${size}Badge`]];
    
    if (outlined) {
      baseStyle.push(styles.outlinedBadge, styles[`outlined${capitalize(variant)}Badge`]);
    } else {
      baseStyle.push(styles[`${variant}Badge`]);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseTextStyle = [styles.text, styles[`${size}Text`]];
    
    if (outlined) {
      baseTextStyle.push(styles[`outlined${capitalize(variant)}Text`]);
    } else {
      baseTextStyle.push(styles[`${variant}Text`]);
    }
    
    if (textStyle) {
      baseTextStyle.push(textStyle);
    }
    
    return baseTextStyle;
  };
  
  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>{value}</Text>
    </View>
  );
};

// Helper function to capitalize first letter
const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
  },
  mediumBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
  },
  largeBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
  primaryBadge: {
    backgroundColor: '#5D5FEF',
  },
  successBadge: {
    backgroundColor: '#4CAF50',
  },
  warningBadge: {
    backgroundColor: '#FFC107',
  },
  errorBadge: {
    backgroundColor: '#FF5252',
  },
  infoBadge: {
    backgroundColor: '#2196F3',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  successText: {
    color: '#FFFFFF',
  },
  warningText: {
    color: '#333333',
  },
  errorText: {
    color: '#FFFFFF',
  },
  infoText: {
    color: '#FFFFFF',
  },
  outlinedBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  outlinedPrimaryBadge: {
    borderColor: '#5D5FEF',
  },
  outlinedSuccessBadge: {
    borderColor: '#4CAF50',
  },
  outlinedWarningBadge: {
    borderColor: '#FFC107',
  },
  outlinedErrorBadge: {
    borderColor: '#FF5252',
  },
  outlinedInfoBadge: {
    borderColor: '#2196F3',
  },
  outlinedPrimaryText: {
    color: '#5D5FEF',
  },
  outlinedSuccessText: {
    color: '#4CAF50',
  },
  outlinedWarningText: {
    color: '#FFC107',
  },
  outlinedErrorText: {
    color: '#FF5252',
  },
  outlinedInfoText: {
    color: '#2196F3',
  },
});

export default Badge; 