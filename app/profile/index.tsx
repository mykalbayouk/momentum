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
import { NavigationProp } from '../../navigation/types';
import { Session } from '@supabase/supabase-js';
import ImageUpload from '../../components/ImageUpload';

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  current_streak: number;
  longest_streak: number;
  streak_count: number;
  weekly_goal: number;
  weekly_progress: number;
}


export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');

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

    // Subscribe to profile changes
    const subscription = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`,
        },
        async (payload) => {
          const newProfile = payload.new as Profile;
          setProfile(newProfile);
          setUsername(newProfile.username || '');
        }
      )
      .subscribe();

    // Initial data fetch
    getProfile();

    return () => {
      subscription.unsubscribe();
    };
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      if (!session?.user) throw new Error('No user on the session!');

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setIsEditing(false);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    }
  }

  async function handleAvatarUpload(filePath: string) {
    try {
      if (!session?.user) throw new Error('No user on the session!');
      if (!profile) throw new Error('No profile data available!');

      // Store the old avatar URL before updating
      const oldAvatarUrl = profile.avatar_url;

      // Get the public URL for the new avatar
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // After successful update, delete the old avatar if it exists
      if (oldAvatarUrl && oldAvatarUrl.startsWith('http')) {
        try {
          const urlParts = oldAvatarUrl.split('/');
          const oldFilePath = urlParts[urlParts.length - 1];
          await supabase.storage
            .from('avatars')
            .remove([oldFilePath]);
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
        routes: [{ name: 'Landing' }],
      });
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    }
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
            <ImageUpload 
              url={profile.avatar_url} 
              size={120} 
              onUpload={handleAvatarUpload}
              bucket="avatars"
              aspect={[1, 1]}
              placeholder={profile.username?.[0]?.toUpperCase() || '?'}
              style={styles.avatar}
            />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                />
              ) : (
                <Text style={styles.value}>{profile.username}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile.email}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Streak</Text>
              <Text style={styles.value}>{profile.current_streak} days</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Longest Streak</Text>
              <Text style={styles.value}>{profile.longest_streak} days</Text>
            </View>            

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weekly Goal Progress</Text>
              <Text style={styles.value}>{Math.round((profile.weekly_progress || 0) * 100)}%</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Updated</Text>
              <Text style={styles.value}>
                {new Date(profile.updated_at).toLocaleDateString()}
              </Text>
            </View>

            {isEditing ? (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsEditing(false)}
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
              {/* <TouchableOpacity style={styles.settingItem}
              >
                <Text style={styles.settingText}>Notifications</Text>
                <Feather name="chevron-right" size={20} color={colors.text.secondary} />
              </TouchableOpacity> */}
              {/* <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Privacy</Text>
                <Feather name="chevron-right" size={20} color={colors.text.secondary} />
              </TouchableOpacity> */}
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
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 180,
    width: 120,
    
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
});