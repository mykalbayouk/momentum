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
import Dropdown from '../../components/Dropdown';
import * as ImagePicker from 'expo-image-picker';

type WorkoutType = 'running' | 'cycling' | 'strength' | 'yoga' | 'swimming' | 'hiking' | 'other';

interface LogWorkoutScreenProps {
  onClose: () => void;
}

export default function LogWorkoutScreen({ onClose }: LogWorkoutScreenProps) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>('running');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const workoutTypes: WorkoutType[] = ['running', 'cycling', 'strength', 'yoga', 'swimming', 'hiking', 'other'];

  const handleLogWorkout = () => {
    // Create a workout object
    const workout = {
      id: Math.random().toString(36).substr(2, 9),
      type: workoutType,
      duration: parseInt(duration),
      intensity,
      notes,
      imageUri,
      date: new Date().toISOString(),
    };

    console.log('Logged workout:', workout);
    // In a real app, this would save to a backend
    onClose();
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
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
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Workout Type</Text>
            <Dropdown
              options={workoutTypes}
              value={workoutType}
              onSelect={(type) => setWorkoutType(type as WorkoutType)}
              style={styles.dropdown}
            />

            <TouchableOpacity style={styles.imageContainer} onPress={handleImagePick}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.workoutImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Add Workout Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionalToggle}
              onPress={() => setShowOptionalFields(!showOptionalFields)}
            >
              <Text style={styles.optionalToggleText}>
                {showOptionalFields ? 'Hide Optional Fields' : 'Show Optional Fields'}
              </Text>
            </TouchableOpacity>

            {showOptionalFields && (
              <View style={styles.optionalSection}>
                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="Enter duration in minutes"
                  placeholderTextColor={colors.text.secondary}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Intensity (1-10)</Text>
                <View style={styles.intensityContainer}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.intensityButton,
                        intensity === level && styles.intensityButtonActive,
                      ]}
                      onPress={() => setIntensity(level)}
                    >
                      <Text
                        style={[
                          styles.intensityButtonText,
                          intensity === level && styles.intensityButtonTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about your workout"
                  placeholderTextColor={colors.text.secondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          </View>

          <Button
            title="Log Workout"
            onPress={handleLogWorkout}
            style={styles.logButton}
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
    width: '100%',
  },
  workoutImage: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 12,
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
  optionalToggle: {
    padding: 10,
    backgroundColor: colors.neutral.grey200,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionalToggleText: {
    color: colors.primary.main,
    fontSize: 13,
    textAlign: 'center',
  },
  optionalSection: {
    gap: 16,
  },
  intensityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  intensityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  intensityButtonText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  intensityButtonTextActive: {
    color: colors.text.inverse,
  },
  logButton: {
    marginTop: 24,
  },
  dropdown: {
    marginBottom: 16,
  },
}); 