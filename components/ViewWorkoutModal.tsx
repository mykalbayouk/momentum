import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';
import ImageSelector from './ImageSelector';
import ImageViewer from './ImageViewer';
import { Picker } from '@react-native-picker/picker';
import Card from './Card';
import Feather from 'react-native-vector-icons/Feather';
import Dropdown from './Dropdown';
import { uploadImage, deleteImage } from '../utils/imageUpload';

interface ViewWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  workout: {
    id: string;
    completed_at: string;
    workout_type: string;
    duration: string;
    intensity: number;
    notes: string;
    image_url: string | null;
    is_rest_day: boolean;
  } | undefined;
}

const WORKOUT_TYPES = [
  'Strength Training',
  'Running',
  'Swimming',
  'Climbing',
  'Cycling',
  'Yoga',
  'Hiking',
  'Boxing',
  'Sports',
  'Other'
];

export default function ViewWorkoutModal({ visible, onClose, onUpdate, workout }: ViewWorkoutModalProps) {
  const { session } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedWorkout, setEditedWorkout] = useState(workout);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setEditedWorkout(workout);
    setSelectedImageUri(null);
  }, [workout]);

  const isCurrentWeek = () => {
    if (!workout) return false;
    
    const workoutDate = new Date(workout.completed_at);
    const startOfWeek = getStartOfWeek();
    const endOfWeek = getEndOfWeek();
    
    return workoutDate >= startOfWeek && workoutDate <= endOfWeek;
  };

  const handleEdit = () => {
    if (!isCurrentWeek()) {
      Alert.alert('Cannot Edit', 'You can only edit workouts from the current week.');
      return;
    }
    setIsEditing(true);
  };

  const handleImageSelect = (uri: string) => {
    setSelectedImageUri(uri);
    setEditedWorkout(prev => prev ? { ...prev, image_url: uri } : undefined);
  };

  const handleSave = async () => {
    if (!editedWorkout || !session?.user) return;

    try {
      // If switching from workout to rest day, delete the image
      if (workout && !workout.is_rest_day && editedWorkout.is_rest_day && workout.image_url) {
        await deleteImage(workout.image_url, 'workout-images');
      }

      // If there's a new image selected, upload it
      let finalImageUrl = editedWorkout.image_url;
      if (selectedImageUri && selectedImageUri !== workout?.image_url) {
        // Delete old image if it exists
        if (workout?.image_url && !workout.image_url.startsWith('http')) {
          await deleteImage(workout.image_url, 'workout-images');
        }

        // Upload new image
        const { url } = await uploadImage(selectedImageUri, 'workout-images', session.user.id);
        finalImageUrl = url;
      }

      const { error } = await supabase
        .from('workout_logs')
        .update({
          workout_type: editedWorkout.workout_type,
          duration: editedWorkout.duration,
          intensity: editedWorkout.intensity,
          notes: editedWorkout.notes,
          image_url: editedWorkout.is_rest_day ? null : finalImageUrl,
          is_rest_day: editedWorkout.is_rest_day,
        })
        .eq('id', editedWorkout.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to update workout');
    }
  };

  const toggleRestDay = () => {
    Animated.spring(rotateAnim, {
      toValue: editedWorkout?.is_rest_day ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
    setEditedWorkout(prev => prev ? { ...prev, is_rest_day: !prev.is_rest_day } : undefined);
    setIsEditing(true); // Automatically enter edit mode when toggling
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!workout) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Card variant="elevated" style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {new Date(workout.completed_at).toLocaleDateString()}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    editedWorkout?.is_rest_day && { backgroundColor: colors.calendar.streak.dot.rest },
                    !isCurrentWeek() && styles.toggleButtonDisabled
                  ]}
                  onPress={toggleRestDay}
                  disabled={!isCurrentWeek()}
                >
                  <Animated.View style={[styles.toggleContent, { transform: [{ rotate }] }]}>
                    <Feather 
                      name={editedWorkout?.is_rest_day ? "moon" : "activity"} 
                      size={24} 
                      color={editedWorkout?.is_rest_day ? colors.text.inverse : colors.text.primary} 
                    />
                  </Animated.View>
                </TouchableOpacity>
                <Text style={styles.toggleLabel}>
                  {editedWorkout?.is_rest_day ? 'Rest Day' : 'Workout Day'}
                </Text>
              </View>

              {!editedWorkout?.is_rest_day && (
                <>
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Workout Details</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.imageContainer}>
                        {isEditing && isCurrentWeek() ? (
                          <ImageSelector
                            url={editedWorkout?.image_url || null}
                            onSelect={handleImageSelect}
                            viewMode="display"
                            editable={true}
                            style={styles.workoutImage}
                          />
                        ) : (
                          <ImageViewer
                            url={workout.image_url}
                            size={200}
                            style={styles.workoutImage}
                          />
                        )}
                      </View>

                      <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Workout Type</Text>
                        {isEditing ? (
                          <Dropdown
                            options={WORKOUT_TYPES}
                            value={editedWorkout?.workout_type || ''}
                            onSelect={(value) => 
                              setEditedWorkout(prev => prev ? { ...prev, workout_type: value } : undefined)
                            }
                          />
                        ) : (
                          <Text style={styles.value}>{workout.workout_type}</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Additional Details</Text>
                      <TouchableOpacity
                        style={styles.optionalToggle}
                        onPress={() => setShowOptionalFields(!showOptionalFields)}
                      >
                        <Text style={styles.optionalToggleText}>
                          {showOptionalFields ? 'Hide Details' : 'Show Details'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {showOptionalFields && (
                      <View style={styles.sectionContent}>
                        <View style={styles.fieldContainer}>
                          <Text style={styles.label}>Duration (minutes)</Text>
                          {isEditing ? (
                            <TextInput
                              style={styles.input}
                              value={editedWorkout?.duration}
                              onChangeText={(text) => 
                                setEditedWorkout(prev => prev ? { ...prev, duration: text } : undefined)
                              }
                              placeholder="Enter duration in minutes"
                              keyboardType="numeric"
                            />
                          ) : (
                            <Text style={styles.value}>{workout.duration}</Text>
                          )}
                        </View>

                        <View style={styles.fieldContainer}>
                          <Text style={styles.label}>Intensity (1-10)</Text>
                          {isEditing ? (
                            <View style={styles.intensityContainer}>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                                <TouchableOpacity
                                  key={level}
                                  style={[
                                    styles.intensityButton,
                                    editedWorkout?.intensity === level && styles.intensityButtonActive,
                                  ]}
                                  onPress={() => setEditedWorkout(prev => prev ? { ...prev, intensity: level } : undefined)}
                                >
                                  <Text
                                    style={[
                                      styles.intensityButtonText,
                                      editedWorkout?.intensity === level && styles.intensityButtonTextActive,
                                    ]}
                                  >
                                    {level}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          ) : (
                            <Text style={styles.value}>{workout.intensity}/10</Text>
                          )}
                        </View>

                        <View style={styles.fieldContainer}>
                          <Text style={styles.label}>Notes</Text>
                          {isEditing ? (
                            <TextInput
                              style={[styles.input, styles.textArea]}
                              value={editedWorkout?.notes}
                              onChangeText={(text) => 
                                setEditedWorkout(prev => prev ? { ...prev, notes: text } : undefined)
                              }
                              placeholder="Add any notes about your workout"
                              multiline
                              numberOfLines={4}
                            />
                          ) : (
                            <Text style={styles.value}>{workout.notes || 'No notes'}</Text>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                </>
              )}

              <View style={styles.footer}>
                {isCurrentWeek() ? (
                  <>
                    {!isEditing ? (
                      <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                        <Text style={styles.editButtonText}>Edit Day</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={styles.readOnlyText}>View Only - Past Week</Text>
                )}
              </View>
            </View>
          </ScrollView>
        </Card>
      </View>
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
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.neutral.grey300,
  },
  toggleContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  section: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral.grey200,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.neutral.grey800,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.grey900,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionContent: {
    padding: 16,
    gap: 16,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  workoutImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    alignSelf: 'center',
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  value: {
    fontSize: 16,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background.paper,
    minHeight: 50,
  },
  picker: {
    height: 50,
    color: colors.text.primary,
    backgroundColor: colors.background.paper,
    width: '100%',
  },
  optionalToggle: {
    padding: 6,
    backgroundColor: colors.neutral.grey200,
    borderRadius: 8,
  },
  optionalToggleText: {
    color: colors.primary.main,
    fontSize: 13,
    fontWeight: '500',
  },
  intensityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
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
  footer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.grey200,
  },
  editButton: {
    backgroundColor: colors.primary.main,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.semantic.success.main,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  readOnlyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: 14,
  },
}); 