import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { colors } from '../../theme/colors';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { supabase } from '../../utils/supabase';
import ImageSelector from '../../components/ImageSelector';
import { uploadImage } from '../../utils/imageUpload';

interface CreateGroupScreenProps {
  onClose: () => void;
}

export default function CreateGroupScreen({ onClose }: CreateGroupScreenProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleImageSelect = (uri: string) => {
    setSelectedImageUri(uri);
    setImageUrl(uri);
  };

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (name.trim().length > 18) {
      Alert.alert('Error', 'Group name must be 18 characters or less');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      let finalImageUrl = imageUrl;

      // Handle image upload if an image was selected
      if (selectedImageUri) {
        const { url } = await uploadImage(selectedImageUri, 'group-images', user.id);
        finalImageUrl = url;
      }

      const { data, error } = await supabase
        .from('groups')
        .insert([
          {
            name: name.trim(),
            description: description.trim(),
            image_url: finalImageUrl,
            created_by: user.id,
            is_private: isPrivate
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card variant="elevated" style={styles.formCard}>
          <View style={styles.imageContainer}>
            <ImageSelector 
              url={selectedImageUri || imageUrl}
              size={120}
              onSelect={handleImageSelect}
              viewMode="avatar"
              placeholder=""
              style={styles.groupImage}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter group name"
              placeholderTextColor={colors.text.secondary}
              maxLength={18}
            />
            <Text style={styles.helperText}>
              Title can only be 18 characters ({18 - name.length} remaining)
            </Text>

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

            <View style={styles.toggleContainer}>
              <Text style={styles.label}>Private Group</Text>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: colors.neutral.grey300, true: colors.primary.main }}
              />
            </View>
            <Text style={styles.helperText}>
              Private groups can only be joined with a group code
            </Text>
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
    height: 120,
    width: 120,
    alignSelf: 'center',
  },
  groupImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  helperText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
}); 