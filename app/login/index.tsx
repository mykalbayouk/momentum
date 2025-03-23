import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { supabase } from '../../utils/supabase';
import Toast from '../../components/Toast';
import { RootStackParamList } from '../../navigation/types';
import * as AppleAuthentication from 'expo-apple-authentication';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        'Missing Information',
        'Please fill in all fields to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          Alert.alert(
            'Login Failed',
            'Invalid email or password. Please try again.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Error',
            'Unable to log in. Please try again later.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      if (!session?.user) {
        Alert.alert(
          'Error',
          'Unable to create session. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if user has completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        Alert.alert(
          'Error',
          'Unable to load profile. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Navigate based on onboarding status
      if (!profile.has_completed_onboarding) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('MainApp');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Sign in with Supabase using the Apple ID token
      const { data: { session }, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });

      if (signInError) {
        console.error('Supabase sign in error:', signInError);
        throw signInError;
      }

      if (!session?.user) {
        Alert.alert(
          'Error',
          'Unable to create session. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if user has completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        Alert.alert(
          'Error',
          'Unable to load profile. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Navigate based on onboarding status
      if (!profile.has_completed_onboarding) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('MainApp');
      }
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        // User canceled the sign-in flow
        return;
      }
      console.error('Apple Sign In error:', error);
      Alert.alert(
        'Error',
        'Unable to sign in with Apple. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to continue</Text>
          </View>

          <Card variant="elevated" style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.text.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.text.secondary}
              secureTextEntry
            />

            <Button
              title={isLoading ? "Logging in..." : "Log In"}
              onPress={handleLogin}
              style={styles.submitButton}
              disabled={isLoading}
            />

            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}

            <TouchableOpacity 
              style={styles.signupLink}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupTextBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  card: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  signupLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  signupText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  signupTextBold: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  appleButton: {
    width: '100%',
    height: 44,
    marginTop: 16,
  },
}); 