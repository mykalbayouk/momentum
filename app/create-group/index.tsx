import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import Button from '../../components/Button';
import Card from '../../components/Card';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../utils/supabase';
import { decode } from 'base64-arraybuffer';

interface CreateGroupScreenProps {
  onClose: () => void;
}

export default function CreateGroupScreen({ onClose }: CreateGroupScreenProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
            const path = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('group-images')
              .upload(path, decode(base64Data), {
                contentType: `image/${fileExt}`,
              });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('group-images')
              .getPublicUrl(path);

            resolve(publicUrl);
          } catch (error) {
            console.error('Error uploading image:', error);
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error preparing image:', error);
      return null;
    }
  };

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      let image_url = null;
      if (imageUri) {
        image_url = await uploadImage(imageUri);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('groups')
        .insert([
          {
            name: name.trim(),
            description: description.trim(),
            image_url,
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update the creator's profile with the group_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ group_id: data.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      Alert.alert('Success', 'Group created successfully!');
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card variant="elevated" style={styles.formCard}>
          <TouchableOpacity style={styles.imageContainer} onPress={handleImagePick}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.groupImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>Add Group Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter group name"
              placeholderTextColor={colors.text.secondary}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter group description"
              placeholderTextColor={colors.text.secondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <Button
            title={loading ? "Creating..." : "Create Group"}
            onPress={handleCreateGroup}
            style={styles.createButton}
            disabled={loading}
          />
        </Card>
      </ScrollView>
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
  formCard: {
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  groupImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.neutral.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  inputContainer: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    marginTop: 24,
  },
}); 