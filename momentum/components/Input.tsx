import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperStyle?: TextStyle;
  onRightIconPress?: () => void;
  onLeftIconPress?: () => void;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  onRightIconPress,
  onLeftIconPress,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.focusedInput,
        error ? styles.errorInput : null,
      ]}>
        {leftIcon && (
          <TouchableOpacity 
            style={styles.leftIcon} 
            onPress={onLeftIconPress}
            disabled={!onLeftIconPress}
          >
            {leftIcon}
          </TouchableOpacity>
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
            inputStyle,
          ].filter(Boolean)}
          placeholderTextColor="#999"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity 
            style={styles.rightIcon} 
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error ? (
        <Text style={[styles.error, errorStyle]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helper, helperStyle]}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  } as ViewStyle,
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  } as TextStyle,
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  } as ViewStyle,
  focusedInput: {
    borderColor: '#5D5FEF',
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  errorInput: {
    borderColor: '#FF5252',
  } as ViewStyle,
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  } as TextStyle,
  inputWithLeftIcon: {
    paddingLeft: 8,
  } as TextStyle,
  inputWithRightIcon: {
    paddingRight: 8,
  } as TextStyle,
  leftIcon: {
    paddingLeft: 16,
  } as ViewStyle,
  rightIcon: {
    paddingRight: 16,
  } as ViewStyle,
  error: {
    fontSize: 12,
    color: '#FF5252',
    marginTop: 4,
  } as TextStyle,
  helper: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  } as TextStyle,
});

export default Input; 