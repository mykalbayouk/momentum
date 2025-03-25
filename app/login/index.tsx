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

// Import Google Sign-in components
const { GoogleSignin, GoogleSigninButton, statusCodes } = Platform.OS === 'android' 
  ? require('@react-native-google-signin/google-signin')
  : { GoogleSignin: null, GoogleSigninButton: null, statusCodes: null };

// Only import Apple Authentication on iOS
const AppleAuthentication = Platform.OS === 'ios' ? require('expo-apple-authentication') : null;

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  // Initialize Google Sign In only on Android
  React.useEffect(() => {
    if (Platform.OS === 'android' && GoogleSignin) {
      console.log('Configuring Google Sign In...');
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (!webClientId) {
        console.error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not defined');
        return;
      }
      try {
        GoogleSignin.configure({
          webClientId,
          scopes: ['profile', 'email'],
        });
        console.log('Google Sign In configured successfully');
      } catch (error) {
        console.error('Error configuring Google Sign In:', error);
      }
    } else {
      console.log('Google Sign In not available:', {
        platform: Platform.OS,
        hasGoogleSignin: !!GoogleSignin
      });
    }
  }, []);

  // Check if Apple Authentication is available
  React.useEffect(() => {
    console.log('Platform.OS:', Platform.OS);
    console.log('AppleAuthentication module:', !!AppleAuthentication);
    
    if (Platform.OS === 'ios') {
      console.log('Checking Apple Authentication availability...');
      AppleAuthentication.isAvailableAsync().then((available: boolean) => {
        console.log('Apple Authentication available:', available);
        if (!available) {
          console.log('Apple Authentication is not available. This could be because:');
          console.log('1. The device is not signed in to an Apple ID');
          console.log('2. The app is not properly configured with Apple Sign In capabilities');
          console.log('3. The app needs to be rebuilt with the latest configuration');
        }
        setIsAppleAuthAvailable(available);
      }).catch((err: Error) => {
        console.error('Error checking Apple Authentication availability:', err);
        console.error('Error details:', err.message);
        setError('Unable to initialize Apple Sign In');
      });
    } else {
      console.log('Apple Authentication not available:', {
        platform: Platform.OS,
        hasAppleAuth: !!AppleAuthentication
      });
    }
  }, []);

  const handleAppleSignIn = async () => {
    console.log('Apple Sign In button pressed');
    console.log('Platform:', Platform.OS);
    console.log('AppleAuthentication available:', !!AppleAuthentication);
    
    if (Platform.OS !== 'ios' || !AppleAuthentication) {
      console.log('Apple Sign In not available for this platform');
      Alert.alert(
        'Error',
        'Apple Sign In is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('Starting Apple Sign In process...');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log('Apple Sign In successful:', credential);
      
      // Sign in with Supabase using the Apple ID token
      console.log('Signing in with Supabase...');
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
            <Text style={styles.title}>Welcome to Momentum</Text>
            <Text style={styles.subtitle}>Your personal fitness companion</Text>
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={styles.appIcon}
            />
            <Text style={styles.description}>
              Track your workouts, build habits, and achieve your fitness goals with Momentum. 
              Sign in to start your fitness journey today.
            </Text>
          </View>

          <Card variant="elevated" style={styles.card}>
            <View style={styles.buttonContainer}>
              {Platform.OS === 'android' && GoogleSigninButton ? (
                <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Dark}
                  onPress={async () => {
                    try {
                      await GoogleSignin.hasPlayServices();
                      const userInfo = await GoogleSignin.signIn();
                      console.log('Google Sign In successful:', userInfo);
                      
                      if (userInfo.data?.idToken) {
                        console.log('Signing in with Supabase...');
                        const { data: { session }, error: signInError } = await supabase.auth.signInWithIdToken({
                          provider: 'google',
                          token: userInfo.data.idToken,
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
                      } else {
                        throw new Error('No ID token present!');
                      }
                    } catch (error: any) {
                      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                        // User cancelled the login flow
                        console.log('User cancelled the login flow');
                      } else if (error.code === statusCodes.IN_PROGRESS) {
                        // Operation is in progress already
                        console.log('Sign in is already in progress');
                      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                        // Play services not available or outdated
                        Alert.alert(
                          'Error',
                          'Google Play Services is not available or outdated. Please update Google Play Services.',
                          [{ text: 'OK' }]
                        );
                      } else {
                        // Some other error happened
                        console.error('Google Sign In error:', error);
                        Alert.alert(
                          'Error',
                          'Unable to sign in with Google. Please try again.',
                          [{ text: 'OK' }]
                        );
                      }
                    }
                  }}
                />
              ) : Platform.OS === 'ios' ? (
                <Button
                  title="Sign in with Apple"
                  onPress={handleAppleSignIn}
                  style={styles.appleButton}
                  variant="outline"
                  icon={<MaterialCommunityIcons name="apple" size={20} color={colors.text.primary} style={styles.appleIcon} />}
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
    backgroundColor: colors.background.default,
    borderColor: colors.neutral.grey300,
  },
  appleIcon: {
    marginRight: 8,
  },
}); 