import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../theme/colors';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/Toast';
import ImageUpload from '../../components/ImageUpload';

export default function OnboardingScreen({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  const [activeDays, setActiveDays] = useState('5');
  const [groupCode, setGroupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarUpload = async (filePath: string) => {
    try {
      if (!session?.user) throw new Error('No user on the session!');

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

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Update profile with onboarding data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          weekly_goal: parseInt(activeDays),
          has_completed_onboarding: true,
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Join group if code provided
      if (groupCode.trim()) {
        const { error: groupError } = await supabase
          .from('group_members')
          .insert({
            user_id: session.user.id,
            group_code: groupCode.trim(),
          });

        if (groupError) {
          console.error('Error joining group:', groupError);
          // Don't throw error here, just log it
        }
      }

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
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Momentum!</Text>
          <Text style={styles.subtitle}>Let's get you set up</Text>
        </View>

        <Card variant="elevated" style={styles.card}>
          <Text style={styles.label}>Profile Picture</Text>
          <View style={styles.imageContainer}>
            <ImageUpload 
              url={null}
              size={120}
              onUpload={handleAvatarUpload}
              bucket="avatars"
              aspect={[1, 1]}
              placeholder="?"
              style={styles.avatar}
            />
          </View>

          <Text style={styles.label}>Weekly Goal</Text>
          <TextInput
            style={styles.input}
            value={activeDays}
            onChangeText={setActiveDays}
            placeholder="How many days per week do you want to work out?"
            placeholderTextColor={colors.text.secondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Join a Group (Optional)</Text>
          <TextInput
            style={styles.input}
            value={groupCode}
            onChangeText={setGroupCode}
            placeholder="Enter group code if you have one"
            placeholderTextColor={colors.text.secondary}
          />

          <Button
            title={isLoading ? "Completing..." : "Complete Setup"}
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={isLoading}
          />
        </Card>
      </ScrollView>
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
    marginBottom: 24,
  },
  avatar: {
    borderRadius: 60,
  },
  submitButton: {
    marginTop: 8,
  },
}); 