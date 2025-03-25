import React from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { colors } from '../theme/colors';
import Calendar from './Calendar';
import { getLocalDate, getStartOfToday } from '../utils/dateUtils';

interface WorkoutLog {
  completed_at: string;
  is_rest_day: boolean;
}

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    username: string;
    profilePicture?: string;
    currentStreak: number;
    weekly_goal: number;
    workouts: WorkoutLog[];
  };
}

export default function ProfileModal({ visible, onClose, user }: ProfileModalProps) {
  // Create marked dates for calendar
  const marked: { [date: string]: any } = {};
  const today = getStartOfToday();
  const todayStr = today.toISOString().split('T')[0];

  // Step 1: Mark individual workout days with dots
  user.workouts.forEach(workout => {
    const workoutDate = new Date(workout.completed_at);
    const localWorkoutDate = new Date(workoutDate.getTime() - (workoutDate.getTimezoneOffset() * 60000));
    const dateStr = localWorkoutDate.toISOString().split('T')[0];
    
    marked[dateStr] = {
      marked: true,
      dotColor: workout.is_rest_day ? colors.calendar.streak.dot.rest : colors.calendar.streak.dot.active
    };
  });

  // Step 2: Group workouts by week
  const workoutsByWeek = new Map<string, WorkoutLog[]>();
  user.workouts.forEach(workout => {
    const workoutDate = new Date(workout.completed_at);
    // Get the Sunday of the week
    const weekStart = new Date(workoutDate);
    weekStart.setDate(workoutDate.getDate() - (workoutDate.getDay() - 1));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!workoutsByWeek.has(weekKey)) {
      workoutsByWeek.set(weekKey, []);
    }
    workoutsByWeek.get(weekKey)?.push(workout);
  });

  // Step 3: Process each week for streaks
  const weeklyGoal = user.weekly_goal || 0;
  workoutsByWeek.forEach((weekWorkouts, weekStart) => {
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    // Count non-rest day workouts for the week
    const nonRestWorkouts = weekWorkouts.filter(w => !w.is_rest_day);
    const weekWorkoutCount = nonRestWorkouts.length;
    const isWeekComplete = weekWorkoutCount >= weeklyGoal;

    // Log week information
    console.log(`Week starting ${weekStart}:`);
    console.log(`- Total workouts: ${weekWorkouts.length}`);
    console.log(`- Non-rest day workouts: ${weekWorkoutCount}`);
    console.log(`- Weekly goal: ${weeklyGoal}`);
    console.log(`- Week complete: ${isWeekComplete}`);
    console.log('-------------------');

    // Only apply streak if week is complete
    if (isWeekComplete) {
      const startYear = weekStartDate.getFullYear();
      const startMonth = String(weekStartDate.getMonth() + 1).padStart(2, '0');
      const startDay = String(weekStartDate.getDate()).padStart(2, '0');
      const startDateStr = `${startYear}-${startMonth}-${startDay}`;

      const endYear = weekEndDate.getFullYear();
      const endMonth = String(weekEndDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(weekEndDate.getDate()).padStart(2, '0');
      const endDateStr = `${endYear}-${endMonth}-${endDay}`;

      // Mark the streak period
      marked[startDateStr] = {
        ...marked[startDateStr],
        startingDay: true,
        color: colors.calendar.streak.background,
        textColor: colors.calendar.streak.text
      };

      marked[endDateStr] = {
        ...marked[endDateStr],
        endingDay: true,
        color: colors.calendar.streak.background,
        textColor: colors.calendar.streak.text
      };

      // Mark days in between
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + 1); // Start from Monday
      while (currentDate < weekEndDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Preserve workout day markers while adding streak background
        marked[dateStr] = {
          ...marked[dateStr],
          color: colors.calendar.streak.background,
          textColor: colors.calendar.streak.text
        };

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  });

  // Step 4: Mark today in red if not logged yet
  if (!marked[todayStr]) {
    marked[todayStr] = {
      marked: true,
      dotColor: colors.semantic.error.main
    };
  }

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
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>

              <View style={styles.profileHeader}>
                <View style={styles.profilePictureContainer}>
                  {user.profilePicture ? (
                    <Image
                      source={{ uri: user.profilePicture }}
                      style={styles.profilePicture}
                    />
                  ) : (
                    <View style={styles.defaultAvatar}>
                      <Text style={styles.defaultAvatarText}>
                        {user.username[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.username}>{user.username}</Text>
              </View>

              <View style={styles.streakInfo}>
                <View style={styles.streakItem}>
                  <Text style={styles.streakLabel}>Current Streak</Text>
                  <Text style={styles.streakValue}>{user.currentStreak} weeks</Text>
                </View>
              </View>

              <View style={styles.calendarContainer}>
                <Calendar
                  markedDates={marked}
                  onDayPress={() => {}} // Disabled as per requirements
                  style={styles.calendar}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.text.primary,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 48,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  streakInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 5,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  calendarContainer: {
    marginTop: 10,
  },
  calendar: {
    borderRadius: 10,
  },
}); 