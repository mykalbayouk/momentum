import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'small' | 'medium' | 'large';

type StyleKey = keyof typeof styles;
type BadgeStyleKey = StyleKey & `${string}Badge`;
type TextStyleKey = StyleKey & `${string}Text`;

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
    const baseStyle: ViewStyle[] = [styles.badge, styles[`${size}Badge` as BadgeStyleKey]];
    
    if (outlined) {
      baseStyle.push(
        styles.outlinedBadge,
        styles[`outlined${capitalize(variant)}Badge` as BadgeStyleKey]
      );
    } else {
      baseStyle.push(styles[`${variant}Badge` as BadgeStyleKey]);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseTextStyle: TextStyle[] = [styles.text, styles[`${size}Text` as TextStyleKey]];
    
    if (outlined) {
      baseTextStyle.push(styles[`outlined${capitalize(variant)}Text` as TextStyleKey]);
    } else {
      baseTextStyle.push(styles[`${variant}Text` as TextStyleKey]);
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
  } as ViewStyle,
  smallBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
  } as ViewStyle,
  mediumBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
  } as ViewStyle,
  largeBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
  } as ViewStyle,
  text: {
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
  smallText: {
    fontSize: 10,
  } as TextStyle,
  mediumText: {
    fontSize: 12,
  } as TextStyle,
  largeText: {
    fontSize: 14,
  } as TextStyle,
  primaryBadge: {
    backgroundColor: '#5D5FEF',
  } as ViewStyle,
  successBadge: {
    backgroundColor: '#4CAF50',
  } as ViewStyle,
  warningBadge: {
    backgroundColor: '#FFC107',
  } as ViewStyle,
  errorBadge: {
    backgroundColor: '#FF5252',
  } as ViewStyle,
  infoBadge: {
    backgroundColor: '#2196F3',
  } as ViewStyle,
  primaryText: {
    color: '#FFFFFF',
  } as TextStyle,
  successText: {
    color: '#FFFFFF',
  } as TextStyle,
  warningText: {
    color: '#333333',
  } as TextStyle,
  errorText: {
    color: '#FFFFFF',
  } as TextStyle,
  infoText: {
    color: '#FFFFFF',
  } as TextStyle,
  outlinedBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  } as ViewStyle,
  outlinedPrimaryBadge: {
    borderColor: '#5D5FEF',
  } as ViewStyle,
  outlinedSuccessBadge: {
    borderColor: '#4CAF50',
  } as ViewStyle,
  outlinedWarningBadge: {
    borderColor: '#FFC107',
  } as ViewStyle,
  outlinedErrorBadge: {
    borderColor: '#FF5252',
  } as ViewStyle,
  outlinedInfoBadge: {
    borderColor: '#2196F3',
  } as ViewStyle,
  outlinedPrimaryText: {
    color: '#5D5FEF',
  } as TextStyle,
  outlinedSuccessText: {
    color: '#4CAF50',
  } as TextStyle,
  outlinedWarningText: {
    color: '#FFC107',
  } as TextStyle,
  outlinedErrorText: {
    color: '#FF5252',
  } as TextStyle,
  outlinedInfoText: {
    color: '#2196F3',
  } as TextStyle,
});

export default Badge; 