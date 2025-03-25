import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/Toast';
import ImageSelector from '../../components/ImageSelector';
import GroupCodeInput from '../../components/GroupCodeInput';
import { uploadImage } from '../../utils/imageUpload';

export default function OnboardingScreen({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  const [activeDays, setActiveDays] = useState('5');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);

  const handleImageSelect = (uri: string) => {
    setSelectedImageUri(uri);
    setImageUrl(uri);
  };

  const handleSubmit = async () => {
    if (!session?.user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Validate username
      if (!username.trim()) {
        setError('Please enter a username');
        setIsLoading(false);
        return;
      }

      if (username.trim().length > 12) {
        setError('Username must be 12 characters or less');
        setIsLoading(false);
        return;
      }

      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw checkError;
      }

      if (existingUser) {
        setError('This username is already taken');
        setIsLoading(false);
        return;
      }

      let finalImageUrl = imageUrl;

      // Handle image upload if an image was selected
      if (selectedImageUri) {
        const { url } = await uploadImage(selectedImageUri, 'avatars', session.user.id);
        finalImageUrl = url;
      }

      // Update profile with onboarding data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          weekly_goal: parseInt(activeDays),
          has_completed_onboarding: true,
          avatar_url: finalImageUrl,
          username: username.trim(),
          current_streak: 0,
          longest_streak: 0,
          group_id: joinedGroupId,
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Navigate to main app
      navigation.replace('MainApp');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Momentum!</Text>
            <Text style={styles.subtitle}>Let's get you set up</Text>
          </View>

          <Card variant="elevated" style={styles.card}>
            <Text style={styles.label}>Profile Picture</Text>
            <View style={styles.imageContainer}>
              <ImageSelector 
                url={imageUrl}
                size={120}
                onSelect={handleImageSelect}
                viewMode="avatar"
                placeholder=""
                style={styles.avatar}
              />
            </View>

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              placeholderTextColor={colors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={12}
            />
            <Text style={[styles.description, username.length >= 12 && styles.warningText]}>
              {username.length}/12 characters
            </Text>
            <Text style={styles.description}>
              This username will be visible to other users. Choose something unique and memorable.
            </Text>

            <Text style={styles.label}>Weekly Goal</Text>
            <TextInput
              style={styles.input}
              value={activeDays}
              onChangeText={setActiveDays}
              placeholder="How many days per week do you want to work out?(between 1 and 7)"
              placeholderTextColor={colors.text.secondary}
              keyboardType="numeric"
            />
            <Text style={styles.description}>
              Your weekly goal determines how many days you need to work out each week to maintain your streak. For example, if you set your goal to 5 days:
              {'\n\n'}• You need to complete 5 workouts (excluding rest days) each week
              {'\n'}• Meeting this goal increases your streak by 1 week
              {'\n'}• Missing the goal breaks your streak
              {'\n\n'}Choose a goal that's challenging but achievable for your schedule.
            </Text>

            <Text style={styles.label}>Join a Group (Optional)</Text>
            <GroupCodeInput
              userId={session?.user?.id || ''}
              onJoinSuccess={(groupId) => {
                setJoinedGroupId(groupId);
                // Show success message
                setError('Successfully joined group!');
                // Clear error after 2 seconds
                setTimeout(() => setError(null), 2000);
              }}
            />

            <Button
              title={isLoading ? "Completing..." : "Complete Setup"}
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={isLoading}
            />
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
  scrollView: {
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  submitButton: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  warningText: {
    color: colors.error.main,
  },
}); 