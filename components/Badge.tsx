import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

export type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
}) => {
  const getBadgeStyle = () => {
    const baseStyle: ViewStyle[] = [styles.badge, styles[`${size}Badge`]];
    
    switch (variant) {
      case 'success':
        baseStyle.push(styles.successBadge);
        break;
      case 'error':
        baseStyle.push(styles.errorBadge);
        break;
      case 'warning':
        baseStyle.push(styles.warningBadge);
        break;
      case 'info':
        baseStyle.push(styles.infoBadge);
        break;
      default:
        baseStyle.push(styles.defaultBadge);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseTextStyle: TextStyle[] = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'success':
        baseTextStyle.push(styles.successText);
        break;
      case 'error':
        baseTextStyle.push(styles.errorText);
        break;
      case 'warning':
        baseTextStyle.push(styles.warningText);
        break;
      case 'info':
        baseTextStyle.push(styles.infoText);
        break;
      default:
        baseTextStyle.push(styles.defaultText);
    }
    
    if (textStyle) {
      baseTextStyle.push(textStyle);
    }
    
    return baseTextStyle;
  };
  
  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
  } as ViewStyle,
  smallBadge: {
    height: 20,
    paddingHorizontal: 6,
  } as ViewStyle,
  mediumBadge: {
    height: 24,
    paddingHorizontal: 8,
  } as ViewStyle,
  largeBadge: {
    height: 28,
    paddingHorizontal: 10,
  } as ViewStyle,
  defaultBadge: {
    backgroundColor: colors.neutral.grey200,
  } as ViewStyle,
  successBadge: {
    backgroundColor: colors.secondary.light,
  } as ViewStyle,
  errorBadge: {
    backgroundColor: colors.semantic.error + '20', // 20% opacity
  } as ViewStyle,
  warningBadge: {
    backgroundColor: colors.semantic.warning + '20', // 20% opacity
  } as ViewStyle,
  infoBadge: {
    backgroundColor: colors.semantic.info + '20', // 20% opacity
  } as ViewStyle,
  text: {
    fontSize: 12,
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
  defaultText: {
    color: colors.text.secondary,
  } as TextStyle,
  successText: {
    color: colors.secondary.dark,
  } as TextStyle,
  errorText: {
    color: colors.semantic.error.main,
  } as TextStyle,
  warningText: {
    color: colors.semantic.warning.main,
  } as TextStyle,
  infoText: {
    color: colors.semantic.info.main,
  } as TextStyle,
});

export default Badge; 