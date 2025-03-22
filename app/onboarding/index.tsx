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
import ImageSelector from '../../components/ImageSelector';
import GroupCodeInput from '../../components/GroupCodeInput';
import { uploadImage } from '../../utils/imageUpload';

export default function OnboardingScreen({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  const [activeDays, setActiveDays] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageSelect = (uri: string) => {
    setSelectedImageUri(uri);
    setImageUrl(uri);
  };

  const handleSubmit = async () => {
    if (!session?.user) return;
    
    setIsLoading(true);
    setError(null);

    try {
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
      <ScrollView style={styles.scrollView}>
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

          <Text style={styles.label}>Weekly Goal</Text>
          <TextInput
            style={styles.input}
            value={activeDays}
            onChangeText={setActiveDays}
            placeholder="How many days per week do you want to work out?(between 1 and 7)"
            placeholderTextColor={colors.text.secondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Join a Group (Optional)</Text>
          <GroupCodeInput
            userId={session?.user?.id || ''}
            onJoinSuccess={() => {}}
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