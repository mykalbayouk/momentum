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
  Alert,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { supabase } from '../../utils/supabase';
import Toast from '../../components/Toast';
import { RootStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Only import Google Sign-in on Android
const GoogleSignin = Platform.OS === 'android' ? require('@react-native-google-signin/google-signin').default : null;
const statusCodes = Platform.OS === 'android' ? require('@react-native-google-signin/google-signin').statusCodes : null;

// Only import Apple Authentication on iOS
const AppleAuthentication = Platform.OS === 'ios' ? require('expo-apple-authentication') : null;

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Sign In only on Android
  React.useEffect(() => {
    if (Platform.OS === 'android' && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
    }
  }, []);

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios' || !AppleAuthentication) return;

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

  const handleGoogleSignIn = async () => {
    if (Platform.OS !== 'android' || !GoogleSignin) return;

    try {
      // Sign in with Google
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      
      // Sign in with Supabase using the Google ID token
      const { data: { session }, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
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
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        // User canceled the sign-in flow
        return;
      }
      console.error('Google Sign In error:', error);
      Alert.alert(
        'Error',
        'Unable to sign in with Google. Please try again.',
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
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={styles.appIcon}
            />
            <Text style={styles.title}>Welcome to Momentum</Text>
            <Text style={styles.subtitle}>Your personal fitness companion</Text>
            <Text style={styles.description}>
              Track your workouts, build habits, and achieve your fitness goals with Momentum. 
              Sign in to start your fitness journey today.
            </Text>
          </View>

          <Card variant="elevated" style={styles.card}>
            <View style={styles.buttonContainer}>
              {Platform.OS === 'android' && GoogleSignin ? (
                <Button
                  title="Sign in with Google"
                  onPress={handleGoogleSignIn}
                  style={styles.googleButton}
                  variant="outline"
                  icon={<MaterialCommunityIcons name="google" size={20} color={colors.text.primary} style={styles.googleIcon} />}
                />
              ) : Platform.OS === 'ios' && AppleAuthentication ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={8}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              ) : null}
            </View>
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
    alignItems: 'center',
  },
  appIcon: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  card: {
    padding: 16,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  appleButton: {
    width: '100%',
    height: 44,
    marginTop: 16,
  },
  googleButton: {
    width: '100%',
    backgroundColor: colors.background.default,
    borderColor: colors.neutral.grey300,
  },
  googleIcon: {
    marginRight: 8,
  },
}); 