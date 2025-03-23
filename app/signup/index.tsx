import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/types';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateName = async (name: string) => {
    if (!name) {
      setNameError('Name is required');
      return false;
    }
    
    // Check if username already exists
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', name)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking username:', error);
      setNameError('Error checking username availability');
      return false;
    }

    if (data) {
      setNameError('Username is already taken');
      return false;
    }

    setNameError('');
    return true;
  };

  const validateEmail = (email: string) => {
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

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      // Validate all fields
      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);
      const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
      const isNameValid = await validateName(name);

      if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        setIsLoading(false);
        return;
      }

      // Attempt to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: name,
          },
        },
      });

      if (error) {
        if (error.message.includes('email')) {
          setEmailError('This email is already registered');
        } else {
          Alert.alert('Signup Error', error.message);
        }
        return;
      }

      if (data?.user) {
        // Create initial profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: name,
            current_streak: 0,
            longest_streak: 0,
            weekly_goal: 5, // Default value
            has_completed_onboarding: false,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          Alert.alert(
            'Error',
            'Account created but failed to set up profile. Please try again.',
            [{ text: 'OK' }]
          );
          return;
        }

        Alert.alert(
          'Success',
          'Please check your email to confirm your account',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'An unexpected error occurred during signup');
    } finally {
      setIsLoading(false);
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
                navigation.goBack();
              }}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Momentum and start your fitness journey</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Name"
              placeholder="Enter your name"
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
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                console.log('Password input changed');
                setPassword(text);
              }}
              secureTextEntry
              error={passwordError}
              onBlur={() => validatePassword(password)}
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
              navigation.navigate('Login');
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
    backgroundColor: colors.background.default,
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
    color: colors.text.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
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
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
}); 