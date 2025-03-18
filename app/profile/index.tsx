import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Image,
} from 'react-native';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Feather from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';

interface User {
  id: string;
  name: string;
  email: string;
  activeDays: number;
  imageUri: string | null;
}

// Sample user data
const sampleUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  activeDays: 5,
  imageUri: null,
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User>(sampleUser);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setUser(prev => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, this would save to a backend
  };

  const renderSettingsModal = () => (
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
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Notifications</Text>
              <Feather name="chevron-right" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Privacy</Text>
              <Feather name="chevron-right" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Help & Support</Text>
              <Feather name="chevron-right" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Log Out</Text>
              <Feather name="chevron-right" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity 
            onPress={() => setShowSettings(true)}
            style={styles.settingsButton}
          >
            <Feather name="settings" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <Card variant="elevated" style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.imageContainer} 
            onPress={handleImagePick}
          >
            {user.imageUri ? (
              <Image source={{ uri: user.imageUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {user.name[0]}
                </Text>
              </View>
            )}
            <View style={styles.editImageButton}>
              <Feather name="camera" size={20} color={colors.text.inverse} />
            </View>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={user.name}
                onChangeText={(text) => setUser(prev => ({ ...prev, name: text }))}
                editable={isEditing}
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={user.email}
                onChangeText={(text) => setUser(prev => ({ ...prev, email: text }))}
                editable={isEditing}
                keyboardType="email-address"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Active Days per Week</Text>
              <View style={styles.activeDaysContainer}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      user.activeDays === day && styles.dayButtonActive,
                    ]}
                    onPress={() => isEditing && setUser(prev => ({ ...prev, activeDays: day }))}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        user.activeDays === day && styles.dayButtonTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isEditing ? (
              <Button
                title="Save Changes"
                onPress={handleSave}
                style={styles.saveButton}
              />
            ) : (
              <Button
                title="Edit Profile"
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              />
            )}
          </View>
        </Card>
      </ScrollView>

      {renderSettingsModal()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  settingsButton: {
    padding: 8,
  },
  profileCard: {
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
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
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text.secondary,
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
    borderColor: colors.background.paper,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
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
  saveButton: {
    marginTop: 8,
  },
  editButton: {
    marginTop: 8,
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
    borderBottomColor: colors.neutral.grey200,
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
}); 