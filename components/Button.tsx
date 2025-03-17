import React, { forwardRef, ComponentRef } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle
} from 'react-native';
import { colors } from '../theme/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const Button = forwardRef<ComponentRef<typeof TouchableOpacity>, ButtonProps>(({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon
}, ref) => {
  const getButtonStyle = () => {
    const baseStyle: any[] = [styles.button, styles[`${size}Button`]];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineButton);
    } else if (variant === 'text') {
      baseStyle.push(styles.textButton);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledButton);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseTextStyle: any[] = [styles.buttonText, styles[`${size}Text`]];
    
    if (variant === 'primary') {
      baseTextStyle.push(styles.primaryText);
    } else if (variant === 'secondary') {
      baseTextStyle.push(styles.secondaryText);
    } else if (variant === 'outline') {
      baseTextStyle.push(styles.outlineText);
    } else if (variant === 'text') {
      baseTextStyle.push(styles.textButtonText);
    }
    
    if (disabled) {
      baseTextStyle.push(styles.disabledText);
    }
    
    if (textStyle) {
      baseTextStyle.push(textStyle);
    }
    
    return baseTextStyle;
  };
  
  return (
    <TouchableOpacity
      ref={ref}
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.text.inverse : colors.primary.main} 
        />
      ) : (
        <>
          {icon && icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  smallButton: {
    height: 32,
    paddingHorizontal: 12,
  },
  mediumButton: {
    height: 40,
    paddingHorizontal: 16,
  },
  largeButton: {
    height: 48,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: colors.secondary.main,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  disabledButton: {
    backgroundColor: colors.neutral.grey300,
    borderColor: colors.neutral.grey400,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  primaryText: {
    color: colors.text.inverse,
  },
  secondaryText: {
    color: colors.text.inverse,
  },
  outlineText: {
    color: colors.primary.main,
  },
  textButtonText: {
    color: colors.primary.main,
  },
  disabledText: {
    color: colors.text.disabled,
  },
});

export default Button; 