import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/types';
import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
import { colors } from '../../theme/colors';
import * as ImagePicker from 'expo-image-picker';

type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';

interface WorkoutForm {
  type: WorkoutType;
  image: string | null;
  duration?: string;
  notes?: string;
  tags?: string[];
  sets?: number;
  reps?: number;
  weight?: number;
}

export default function LogWorkoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [form, setForm] = useState<WorkoutForm>({
    type: 'strength',
    image: null,
  });
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setForm(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const handleSubmit = () => {
    if (!form.type || !form.image) {
      // Show error message
      return;
    }
    console.log('Form submitted:', form);
    // Handle form submission
    navigation.goBack();
  };

  const workoutTypes: WorkoutType[] = ['strength', 'cardio', 'flexibility', 'sports', 'other'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Workout</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Required Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required</Text>
            
            {/* Workout Type */}
            <Text style={styles.label}>Workout Type</Text>
            <Dropdown
              options={workoutTypes}
              value={form.type}
              onSelect={(type) => setForm(prev => ({ ...prev, type: type as WorkoutType }))}
              style={styles.dropdown}
            />

            {/* Workout Picture */}
            <Text style={styles.label}>Workout Picture</Text>
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
              {form.image ? (
                <Image source={{ uri: form.image }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Tap to add picture</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Optional Fields Toggle */}
          <TouchableOpacity
            style={styles.optionalToggle}
            onPress={() => setShowOptionalFields(!showOptionalFields)}
          >
            <Text style={styles.optionalToggleText}>
              {showOptionalFields ? 'Hide Optional Fields' : 'Show Optional Fields'}
            </Text>
          </TouchableOpacity>

          {/* Optional Fields */}
          {showOptionalFields && (
            <View style={styles.section}>
              
              {/* Duration */}
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={form.duration}
                onChangeText={(text) => setForm(prev => ({ ...prev, duration: text }))}
                keyboardType="numeric"
                placeholder="Enter duration"
                placeholderTextColor={colors.text.secondary}
              />

              {/* Notes */}
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.notes}
                onChangeText={(text) => setForm(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={4}
                placeholder="Add workout notes"
                placeholderTextColor={colors.text.secondary}
              />

              {/* Sets and Reps */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    value={form.sets?.toString()}
                    onChangeText={(text) => setForm(prev => ({ ...prev, sets: parseInt(text) || undefined }))}
                    keyboardType="numeric"
                    placeholder="Sets"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    value={form.reps?.toString()}
                    onChangeText={(text) => setForm(prev => ({ ...prev, reps: parseInt(text) || undefined }))}
                    keyboardType="numeric"
                    placeholder="Reps"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>
              </View>

              {/* Weight */}
              <Text style={styles.label}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={form.weight?.toString()}
                onChangeText={(text) => setForm(prev => ({ ...prev, weight: parseFloat(text) || undefined }))}
                keyboardType="numeric"
                placeholder="Enter weight"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          )}
        </View>

        <Button
          title="Log Workout"
          onPress={handleSubmit}
          style={styles.submitButton}
        />
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
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.grey200,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 8,
  },
  dropdown: {
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.neutral.grey200,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: colors.text.secondary,
    fontSize: 16,
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
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    marginLeft: 16,
    marginRight: 16,

  },
}); 