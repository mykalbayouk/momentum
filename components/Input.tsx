import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  style,
  labelStyle,
  errorStyle,
  helperStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          props.multiline && styles.multilineInput,
        ]}
        placeholderTextColor={colors.text.disabled}
        {...props}
      />
      
      {(error || helper) && (
        <Text 
          style={[
            styles.helperText,
            error ? styles.errorText : styles.helperTextColor,
            errorStyle || helperStyle
          ]}
        >
          {error || helper}
        </Text>
      )}
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
    color: colors.text.primary,
    marginBottom: 8,
  } as TextStyle,
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
  } as TextStyle,
  inputError: {
    borderColor: colors.semantic.error,
  } as ViewStyle,
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  } as ViewStyle,
  helperText: {
    fontSize: 12,
    marginTop: 4,
  } as TextStyle,
  helperTextColor: {
    color: colors.text.secondary,
  } as TextStyle,
  errorText: {
    color: colors.semantic.error,
  } as TextStyle,
});

export default Input; 