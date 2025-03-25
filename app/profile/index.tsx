import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Image,
  Alert,
  TextInput,
  ImageStyle,
  Linking
} from 'react-native';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Feather from 'react-native-vector-icons/Feather';
import { supabase } from '../../utils/supabase';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp as BaseNavigationProp } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { getLocalDate } from '../../utils/dateUtils';
import ImageSelector from '../../components/ImageSelector';
import { uploadImage, deleteImage } from '../../utils/imageUpload';
import ImageViewer from '../../components/ImageViewer';
import { realtimeDB, Profile } from '../../utils/RealtimeDB';
import { StreakHelper } from '../../utils/StreakHelper';

type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Leaderboard: undefined;
  Groups: undefined;
  Settings: undefined;
  Login: undefined;
};

type AppNavigationProp = BaseNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [currentStreak, setCurrentStreak] = useState(0);
  const streakHelper = StreakHelper.getInstance();

  // Add navigation listener to handle leaving edit mode
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (isEditing) {
        handleLeaveEditMode();
      }
    });

    return unsubscribe;
  }, [navigation, isEditing]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    console.log('[Profile] Setting up real-time subscription');
    let isSubscribed = true;

    async function initializeProfile() {
      try {
        // First get/create the profile
        await getProfile();
        
        if (!isSubscribed) return;

        // Then set up real-time updates
        realtimeDB.subscribeToProfile(session!.user.id, (newProfile: Profile) => {
          console.log('[Profile] Received profile update');
          const displayStreak = streakHelper.calculateDisplayStreak(
            newProfile.current_streak,
            newProfile.is_week_complete
          );
          setCurrentStreak(displayStreak);
          setProfile(newProfile);
          setUsername(newProfile.username || '');
          setWeeklyGoal(newProfile.weekly_goal?.toString() || '');
          setLoading(false);
        });
      } catch (error) {
        console.error('[Profile] Error initializing profile:', error);
        setLoading(false);
      }
    }

    initializeProfile();

    return () => {
      isSubscribed = false;
      if (session?.user) {
        console.log('[Profile] Cleaning up subscription');
        realtimeDB.unsubscribe('profiles', () => {}, session.user.id);
      }
    };
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const currentSession = session;
      if (!currentSession?.user) throw new Error('No user on the session!');

      console.log('[Profile] Checking if profile exists');
      
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw error;
      }

      if (!data) {
        console.log('[Profile] Creating new profile');
        // Create a new profile if one doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: currentSession.user.id,
              username: `user_${currentSession.user.id.slice(0, 6)}`,
              email: currentSession.user.email,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              current_streak: 0,
              streak_count: 0,
              weekly_goal: 3, // Default weekly goal
              is_week_complete: false
            }
          ])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        console.log('[Profile] New profile created:', newProfile);
        setProfile(newProfile);
        setUsername(newProfile.username);
        setWeeklyGoal(newProfile.weekly_goal?.toString() || '3');
      } else {
        console.log('[Profile] Found existing profile:', data);
        setProfile(data);
        setUsername(data.username || '');
        setWeeklyGoal(data.weekly_goal?.toString() || '');
      }
    } catch (error) {
      console.error('[Profile] Error in getProfile:', error);
      if (error instanceof Error) {
        Alert.alert('Error', `Failed to load profile: ${error.message}`);
      }
      throw error; // Re-throw to handle in the caller
    }
  }

  // Add function to check if username exists
  async function checkUsernameExists(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', session?.user?.id || '')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
        console.error('Error checking username:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  // Add username change handler
  const handleUsernameChange = async (newUsername: string) => {
    // Limit username to 12 characters
    const truncatedUsername = newUsername.slice(0, 12);
    setUsername(truncatedUsername);
    setUsernameError(null);
    
    if (truncatedUsername !== profile?.username) {
      const exists = await checkUsernameExists(truncatedUsername);
      if (exists) {
        setUsernameError('This username is already taken');
      }
    }
  };

  const handleWeeklyGoalChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // Convert to number and validate
    const value = parseInt(numericValue);
    if (value < 1 || value > 7) {
      return; // Don't update if value is invalid
    }
    setWeeklyGoal(numericValue);
  };

  async function updateProfile() {
    try {
      if (!session?.user) throw new Error('No user on the session!');
      
      // Check if username exists before updating
      if (username !== profile?.username) {
        const exists = await checkUsernameExists(username);
        if (exists) {
          setUsernameError('This username is already taken');
          return;
        }
      }

      // Upload new image if one was selected
      let finalImageUrl = profile?.avatar_url;
      if (selectedImageUri) {
        const { url } = await uploadImage(selectedImageUri, 'avatars', session.user.id);
        finalImageUrl = url;

        // Delete old avatar if it exists
        if (profile?.avatar_url && profile.avatar_url.startsWith('http')) {
          try {
            await deleteImage(profile.avatar_url, 'avatars');
          } catch (error) {
            console.error('Error deleting old avatar:', error);
            // Don't throw here - we still want to complete the update
          }
        }
      }

      // Update profile data
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          weekly_goal: parseInt(weeklyGoal),
          avatar_url: finalImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      // Trigger a refresh of workout logs by updating the last workout log
      // This will cause the home screen to recalculate streaks and progress
      const { data: lastWorkout, error: workoutError } = await supabase
        .from('workout_logs')
        .select('id')
        .eq('user_id', session.user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (lastWorkout && !workoutError) {
        await supabase
          .from('workout_logs')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', lastWorkout.id);
      }

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      setUsernameError(null);
      setSelectedImageUri(null);
      setImageUrl('');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    }
  }

  const handleImageSelect = (uri: string) => {
    setSelectedImageUri(uri);
    setImageUrl(uri);
  };

  async function handleAvatarUpload() {
    try {
      if (!session?.user) throw new Error('No user on the session!');
      if (!profile) throw new Error('No profile data available!');

      // Store the old avatar URL before updating
      const oldAvatarUrl = profile.avatar_url;

      // Upload new image if one was selected
      let finalImageUrl = imageUrl;
      if (selectedImageUri) {
        const { url } = await uploadImage(selectedImageUri, 'avatars', session.user.id);
        finalImageUrl = url;
      }

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: finalImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // After successful update, delete the old avatar if it exists
      if (oldAvatarUrl && oldAvatarUrl.startsWith('http')) {
        try {
          await deleteImage(oldAvatarUrl, 'avatars');
        } catch (error) {
          console.error('Error deleting old avatar:', error);
          // Don't throw here - we still want to complete the update
        }
      }

      await getProfile();
      Alert.alert('Success', 'Avatar updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    }
  }

  const handleHelp = () => {
    Alert.alert(
      'Help & Contact',
      'Visit my website for more information or to get in touch.',
      [
        {
          text: 'Website',
          onPress: () => Linking.openURL('https://www.michaelbayouk.com')
        },
        {
          text: 'Contact',
          onPress: () => Linking.openURL('https://www.michaelbayouk.com/contact')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  const handleLogout = async () => {
    try {
      setShowSettings(false);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Reset the navigation stack and navigate to Landing
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    }
  };

  // Reset form when leaving edit mode
  const handleLeaveEditMode = () => {
    setIsEditing(false);
    setUsername(profile?.username || '');
    setWeeklyGoal(profile?.weekly_goal?.toString() || '');
    setSelectedImageUri(null);
    setImageUrl('');
    setUsernameError(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>No user data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          onPress={() => setShowSettings(true)}
          style={styles.settingsButton}
        >
          <Feather name="settings" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.imageContainer}>
            {isEditing ? (
              <ImageSelector 
                url={selectedImageUri || profile.avatar_url} 
                size={120} 
                onSelect={handleImageSelect}
                viewMode="avatar"
                placeholder={profile.username?.[0]?.toUpperCase() || '?'}
                style={styles.avatar}
              />
            ) : (
              <ImageViewer 
                url={profile.avatar_url} 
                size={120} 
                placeholder={profile.username?.[0]?.toUpperCase() || '?'}
                style={styles.avatar}
              />
            )}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              {isEditing ? (
                <View>
                  <TextInput
                    style={[
                      styles.input,
                      usernameError ? styles.inputError : null
                    ]}
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="Enter username"
                  />
                  {usernameError && (
                    <Text style={styles.errorText}>{usernameError}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.value}>{profile.username}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Login Provider</Text>
              <Text style={styles.value}>
                {session?.user?.app_metadata?.provider === 'google' ? 'Google' : 
                 session?.user?.app_metadata?.provider === 'apple' ? 'Apple' : 
                 'Unknown'}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weekly Goal (days)</Text>
              {isEditing ? (
                <View>
                  <TextInput
                    style={styles.input}
                    value={weeklyGoal}
                    onChangeText={handleWeeklyGoalChange}
                    placeholder="Enter weekly goal"
                    keyboardType="numeric"
                    maxLength={1}
                  />
                  <Text style={styles.helperText}>Value must be between 1-7 days</Text>
                </View>
              ) : (
                <Text style={styles.value}>{profile.weekly_goal} days</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Streak</Text>
              <Text style={styles.value}>{currentStreak} weeks</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {getLocalDate(new Date(profile.created_at)).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Updated</Text>
              <Text style={styles.value}>
                {getLocalDate(new Date(profile.updated_at)).toLocaleDateString()}
              </Text>
            </View>

            {isEditing ? (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleLeaveEditMode}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={updateProfile}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </ScrollView>

      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity 
              onPress={() => setShowSettings(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Card variant="elevated" style={styles.settingsCard}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={handleHelp}
              >
                <Text style={styles.settingText}>Help & Support</Text>
                <Feather name="chevron-right" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={handleLogout}
              >
                <Text style={styles.settingText}>Log Out</Text>
                <Feather name="chevron-right" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </Card>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    height: 120,
    width: 120,
    alignSelf: 'center',
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  image: {
    objectFit: 'cover',
    paddingTop: 0,
  },
  noImage: {
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary.main,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.default,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  value: {
    fontSize: 16,
    color: colors.text.primary,
  },
  input: {
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.neutral.grey800,
    padding: 12,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.primary.main,
  },
  saveButton: {
    backgroundColor: colors.primary.main,
  },
  cancelButton: {
    backgroundColor: colors.neutral.grey300,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.neutral.grey300,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.grey800,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  settingsButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.grey800,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  settingsCard: {
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.grey200,
  },
  settingText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  uploadingButton: {
    opacity: 0.7,
  },
  imagePlaceholderText: {
    fontSize: 48,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: colors.error?.main || '#ff0000',
    borderWidth: 1,
  },
  errorText: {
    color: colors.error?.main || '#ff0000',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
});