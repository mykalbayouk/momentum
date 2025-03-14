import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateName = (name: string) => {
    console.log('Validating name:', name);
    if (!name) {
      setNameError('Name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateEmail = (email: string) => {
    console.log('Validating email:', email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    console.log('Validating password');
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    console.log('Validating confirm password');
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSignup = () => {
    console.log('Signup attempt with:', { name, email, password, confirmPassword });
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      setIsLoading(true);
      
      // Simulate API call
      console.log('Simulating API call for signup...');
      setTimeout(() => {
        setIsLoading(false);
        console.log('Signup successful, navigating to home');
        // Navigate to home screen after successful signup
        router.replace('/home');
      }, 1500);
    } else {
      console.log('Signup validation failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                console.log('Back button pressed');
                router.back();
              }}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Momentum and start your fitness journey</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                console.log('Name input changed:', text);
                setName(text);
              }}
              error={nameError}
              onBlur={() => validateName(name)}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                console.log('Email input changed:', text);
                setEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              onBlur={() => validateEmail(email)}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                console.log('Password input changed');
                setPassword(text);
              }}
              secureTextEntry
              error={passwordError}
              onBlur={() => validatePassword(password)}
              helper="Password must be at least 6 characters"
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                console.log('Confirm password input changed');
                setConfirmPassword(text);
              }}
              secureTextEntry
              error={confirmPasswordError}
              onBlur={() => validateConfirmPassword(confirmPassword)}
            />

            <Button
              title="Sign Up"
              onPress={handleSignup}
              loading={isLoading}
              style={styles.signupButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => {
              console.log('Login link pressed');
              router.push('/login');
            }}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  form: {
    marginBottom: 20,
  },
  signupButton: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  loginText: {
    color: '#5D5FEF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 