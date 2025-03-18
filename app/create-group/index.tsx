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
} from 'react-native';
import { colors } from '../../theme/colors';
import Button from '../../components/Button';
import Card from '../../components/Card';
import * as ImagePicker from 'expo-image-picker';

interface CreateGroupScreenProps {
  onClose: () => void;
}

export default function CreateGroupScreen({ onClose }: CreateGroupScreenProps) {
  const [groupTitle, setGroupTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeDays, setActiveDays] = useState(4);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleCreateGroup = () => {
    // Create a group object
    const group = {
      id: Math.random().toString(36).substr(2, 9), // Generate a random ID
      title: groupTitle,
      description,
      activeDays,
      imageUri,
      createdAt: new Date().toISOString(),
      members: 1, // Start with 1 member (the creator)
    };

    console.log('Created group:', group);
    // In a real app, this would save to a backend
    onClose();
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
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
            <Text style={styles.label}>Group Title</Text>
            <TextInput
              style={styles.input}
              value={groupTitle}
              onChangeText={setGroupTitle}
              placeholder="Enter group title"
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

            <Text style={styles.label}>Active Days per Week</Text>
            <View style={styles.activeDaysContainer}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    activeDays === day && styles.dayButtonActive,
                  ]}
                  onPress={() => setActiveDays(day)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      activeDays === day && styles.dayButtonTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Create Group"
            onPress={handleCreateGroup}
            style={styles.createButton}
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
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
  activeDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  dayButtonText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  dayButtonTextActive: {
    color: colors.text.inverse,
  },
  createButton: {
    marginTop: 24,
  },
}); 