import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors } from '../theme/colors';
import Button from './Button';
import Card from './Card';
import Dropdown from './Dropdown';
import Toast from './Toast';
import ImageSelector from './ImageSelector';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateISO, getStartOfToday, getEndOfToday, getYesterday, getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';
import { uploadImage, deleteImage } from '../utils/imageUpload';

type WorkoutType = 'Strength Training' | 'Running' | 'Swimming' | 'Climbing' | 'Cycling' | 'Yoga' | 'Hiking' | 'Boxing' | 'Sports' | 'Other';

interface WorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  workout?: {
    id: string;
    workout_type: WorkoutType;
    duration: string;
    intensity: number;
    notes: string;
    image_url: string | null;
    completed_at: string;
    is_rest_day: boolean;
  };
}

export default function WorkoutModal({ visible, onClose, onUpdate, workout }: WorkoutModalProps) {
  const { session } = useAuth();
  const [workoutType, setWorkoutType] = useState<WorkoutType>(workout?.workout_type || 'Running');
  const [duration, setDuration] = useState(workout?.duration.replace(' minutes', '') || '');
  const [intensity, setIntensity] = useState(workout?.intensity || 5);
  const [notes, setNotes] = useState(workout?.notes || '');
  const [imageUrl, setImageUrl] = useState<string | null>(workout?.image_url || null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestDay, setIsRestDay] = useState(workout?.is_rest_day || false);

  const workoutTypes: WorkoutType[] = [
    'Strength Training',
    'Running',
    'Swimming', 
    'Climbing',
    'Cycling',
    'Hiking',
    'Boxing',
    'Sports',
    'Yoga',
    'Other'
  ];

  useEffect(() => {
    if (workout) {
      setWorkoutType(workout.workout_type);
      setDuration(workout.duration.replace(' minutes', ''));
      setIntensity(workout.intensity);
      setNotes(workout.notes || '');
      setImageUrl(workout.image_url);
      setIsRestDay(workout.is_rest_day || false);
    }
  }, [workout]);

  const handleImageSelect = (uri: string) => {
    setSelectedImageUri(uri);
    setImageUrl(uri);
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      setError('You must be logged in to log a workout');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const durationMinutes = parseInt(duration) || 0;
      const durationInterval = `${durationMinutes} minutes`;

      let finalImageUrl = imageUrl;

      // Handle image upload if a new image was selected
      if (selectedImageUri && selectedImageUri !== workout?.image_url) {
        // Delete old image if it exists
        if (workout?.image_url && !workout.image_url.startsWith('http')) {
          await deleteImage(workout.image_url, 'workout-images');
        }

        // Upload new image
        const { url } = await uploadImage(selectedImageUri, 'workout-images', session.user.id);
        finalImageUrl = url;
      }

      if (workout) {
        // Update existing workout
        const { error: updateError } = await supabase
          .from('workout_logs')
          .update({
            workout_type: workoutType,
            duration: durationInterval,
            intensity,
            notes,
            image_url: finalImageUrl,
            is_rest_day: isRestDay,
          })
          .eq('id', workout.id);

        if (updateError) throw updateError;
      } else {
        // Check if there's already a workout for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const { data: todayWorkout, error: todayError } = await supabase
          .from('workout_logs')
          .select('completed_at')
          .eq('user_id', session.user.id)
          .gte('completed_at', today.toISOString())
          .lte('completed_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (todayError) throw todayError;

        if (todayWorkout) {
          throw new Error('You have already logged a workout for today');
        }

        // Get current profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('current_streak, longest_streak, weekly_goal')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        // Get start and end of current week
        const startOfWeek = getStartOfWeek();
        const endOfWeek = getEndOfWeek();

        // Get all workouts for the current week
        const { data: weekWorkouts, error: weekError } = await supabase
          .from('workout_logs')
          .select('completed_at, is_rest_day')
          .eq('user_id', session.user.id)
          .gte('completed_at', startOfWeek.toISOString())
          .lte('completed_at', endOfWeek.toISOString());

        if (weekError) throw weekError;

        // Count non-rest day workouts for the week
        const weekWorkoutCount = weekWorkouts?.filter(w => !w.is_rest_day).length || 0;
        const newWeekWorkoutCount = weekWorkoutCount + (isRestDay ? 0 : 1);

        // Calculate new streak
        let newStreak = profileData.current_streak;
        let newLongestStreak = profileData.longest_streak;

        // If we've hit the weekly goal, increment the streak
        if (newWeekWorkoutCount >= profileData.weekly_goal) {
          newStreak = profileData.current_streak + 1;
          newLongestStreak = Math.max(newStreak, profileData.longest_streak);
        }

        // Create new workout first
        const { error: insertError } = await supabase
          .from('workout_logs')
          .insert({
            user_id: session.user.id,
            workout_type: workoutType,
            duration: durationInterval,
            intensity,
            notes,
            image_url: finalImageUrl,
            completed_at: new Date().toISOString(),
            is_rest_day: isRestDay,
          });

        if (insertError) throw insertError;

        // Then update the streak
        const { error: updateStreakError } = await supabase
          .from('profiles')
          .update({
            current_streak: newStreak,
            longest_streak: newLongestStreak,
          })
          .eq('id', session.user.id);

        if (updateStreakError) throw updateStreakError;
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving workout:', error);
      setError(error instanceof Error ? error.message : 'Failed to save workout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <Card variant="elevated" style={styles.modalContent}>
              <ScrollView>
                <View style={styles.header}>
                  <Text style={styles.title}>{workout ? 'Edit Workout' : 'Log Workout'}</Text>
                  <TouchableOpacity onPress={onClose}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.content}>
                  <TouchableOpacity
                    style={[styles.restDayToggle, isRestDay && styles.restDayToggleActive]}
                    onPress={() => setIsRestDay(!isRestDay)}
                  >
                    <Text style={[styles.restDayToggleText, isRestDay && styles.restDayToggleTextActive]}>
                      {isRestDay ? 'Rest Day' : 'Workout Day'}
                    </Text>
                  </TouchableOpacity>

                  {!isRestDay && (
                    <>
                      <Text style={styles.label}>Workout Type</Text>
                      <Dropdown
                        options={workoutTypes}
                        value={workoutType}
                        onSelect={(type) => setWorkoutType(type as WorkoutType)}
                        style={styles.dropdown}
                      />

                      <View style={styles.imageContainer}>
                        <ImageSelector 
                          url={imageUrl}
                          size={200}
                          onSelect={handleImageSelect}
                          viewMode="display"
                          placeholder=""
                          style={styles.workoutImage}
                        />
                      </View>

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
                    </>
                  )}

                  <View style={styles.buttonContainer}>
                    <Button
                      title={isLoading ? "Saving..." : "Log Workout"}
                      onPress={handleSubmit}
                      style={styles.submitButton}
                      disabled={isLoading}
                    />
                  </View>
                </View>
              </ScrollView>
            </Card>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  content: {
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
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  submitButton: {
    marginBottom: 8,
  },
  dropdown: {
    marginBottom: 16,
  },
  restDayToggle: {
    padding: 12,
    backgroundColor: colors.neutral.grey200,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  restDayToggleActive: {
    backgroundColor: colors.primary.main,
  },
  restDayToggleText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  restDayToggleTextActive: {
    color: colors.text.inverse,
  },
}); 