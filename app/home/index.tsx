import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
} from 'react-native';
import Card from '../../components/Card';
import Calendar from '../../components/Calendar';
import ViewWorkoutModal from '../../components/ViewWorkoutModal';
import WeeklyProgress from '../../components/WeeklyProgress';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getStartOfToday } from '../../utils/dateUtils';
import { realtimeDB, Profile as ProfileType, WorkoutLog as WorkoutLogType } from '../../utils/RealtimeDB';
import { StreakHelper } from '../../utils/StreakHelper';


type WorkoutType = 'Boxing' | 'Climbing' | 'Cycling' | 'Hiking' | 'Other' | 'Running' | 'Sports' | 'Strength Training' | 'Swimming' | 'Walking' | 'Yoga';

interface Profile extends ProfileType {
  is_week_complete: boolean;
}
interface WorkoutLog extends Omit<WorkoutLogType, 'workout_type'> {
  workout_type: WorkoutType;
}

interface WeekData {
  startDate: Date;
  isComplete: boolean;
}

export default function HomeScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [showViewWorkoutModal, setShowViewWorkoutModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<{ dateString: string } | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const streakHelper = StreakHelper.getInstance();

  useEffect(() => {
    if (!session?.user) return;

    console.log('[Home] Setting up real-time subscriptions');

    // Subscribe to profile updates
    realtimeDB.subscribeToProfile(session.user.id, (newProfile: Profile) => {
      console.log('[Home] Received profile update');
      setProfile(newProfile);
      
      // Update display streak based on DB streak and week status
      const displayStreak = streakHelper.calculateDisplayStreak(
        newProfile.current_streak,
        newProfile.is_week_complete
      );
      setCurrentStreak(displayStreak);
    });

    // Subscribe to workout logs
    realtimeDB.subscribeToWorkoutLogs(session.user.id, (logs: WorkoutLog[]) => {
      console.log('[Home] Received workout logs update');
      setWorkoutLogs(logs);
    });

    return () => {
      console.log('[Home] Cleaning up subscriptions');
      realtimeDB.unsubscribe('profiles', () => {}, session.user.id);
      realtimeDB.unsubscribe('workout_logs', () => {}, session.user.id);
    };
  }, [session]);

  // Update calendar whenever profile or workout logs change
  useEffect(() => {
    if (workoutLogs.length > 0) {
      updateMarkedDates(workoutLogs, profile?.weekly_goal || 0);
    }
  }, [workoutLogs, profile]);

  // Separate effect for streak and week status updates
  useEffect(() => {
    if (!session?.user?.id || !profile?.weekly_goal || workoutLogs.length === 0) return;

    // Use a debounced function to prevent rapid updates
    const timeoutId = setTimeout(() => {
      // Check and update streak in DB if needed
      streakHelper.checkAndUpdateStreak(
        session.user.id,
        workoutLogs,
        profile.weekly_goal,
        profile.current_streak
      ).catch(error => {
        console.error('[Home] Error checking/updating streak:', error);
      });

      // Check and update week status
      streakHelper.checkAndUpdateWeekStatus(
        session.user.id,
        workoutLogs,
        profile.weekly_goal
      ).catch(error => {
        console.error('[Home] Error updating week status:', error);
      });
    }, 1000); // Wait 1 second before updating to prevent rapid updates

    return () => clearTimeout(timeoutId);
  }, [workoutLogs, profile?.weekly_goal, session?.user?.id]);

  function updateMarkedDates(logs: WorkoutLog[], weeklyGoal: number) {
    // Create marked dates for calendar
    const marked: { [date: string]: any } = {};
    const today = getStartOfToday();
    const todayStr = today.toISOString().split('T')[0];

    // Step 1: Mark individual workout days with dots
    logs.forEach(workout => {
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
    logs.forEach(workout => {
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
    workoutsByWeek.forEach((weekWorkouts, weekStart) => {
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);

      // Count non-rest day workouts for the week
      const nonRestWorkouts = weekWorkouts.filter(w => !w.is_rest_day);
      const weekWorkoutCount = nonRestWorkouts.length;
      const isWeekComplete = weekWorkoutCount >= weeklyGoal;

      // Only apply streak if week is complete and profile indicates it's a complete week
      if (isWeekComplete && profile?.is_week_complete) {
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

    setMarkedDates(marked);
  }

  const handleDayPress = (date: { dateString: string }) => {
    if (!session?.user?.id) return;

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Convert clicked date to Date object and set to midnight
    const clickedDate = new Date(date.dateString);
    clickedDate.setHours(0, 0, 0, 0);

    // Don't allow future dates
    if (clickedDate > today) {
      return;
    }

    // Find workouts for the selected date and current user
    const dayWorkouts = workoutLogs.filter(workout => {
      const workoutDate = new Date(workout.completed_at);
      // Convert to local time
      const localWorkoutDate = new Date(workoutDate.getTime() - (workoutDate.getTimezoneOffset() * 60000));
      // Compare date strings in YYYY-MM-DD format
      return localWorkoutDate.toISOString().split('T')[0] === date.dateString;
    });

    // Only show modal if there's a workout for that date
    if (dayWorkouts.length > 0) {
      setSelectedDate(date);
      setShowViewWorkoutModal(true);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Momentum</Text>
          </View>

          <View style={styles.streaksContainer}>
            <View style={styles.streakRow}>
              <View style={styles.emojiContainer}>
                <Text style={styles.streakEmoji}>
                  {currentStreak > 0 ? '🔥' : '💤'}
                </Text>
              </View>
              <Card variant="elevated" style={{ ...styles.streakCard, backgroundColor: colors.primary.main }}>
                <View style={styles.streakContent}>
                  <Text style={styles.streakValue}>
                    {currentStreak === 1 ? '1' : '0'} week streak
                  </Text>
                  {currentStreak > 0 ? (
                    <Text style={styles.streakSubtext}>Keep it up!</Text>
                  ) : (
                    <Text style={styles.streakSubtext}>Start your streak!</Text>
                  )}
                </View>
              </Card>
            </View>
          </View>

          {profile?.weekly_goal && (
            <WeeklyProgress weeklyGoal={profile.weekly_goal} />
          )}

          <View style={styles.calendarContainer}>
            <Text style={styles.calendarLabel}>Click the dates to view individual workout logs</Text>
            <Calendar
              markedDates={markedDates}
              onDayPress={handleDayPress}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <ViewWorkoutModal
        visible={showViewWorkoutModal}
        onClose={() => {
          setShowViewWorkoutModal(false);
          setSelectedDate(null);
        }}
        onUpdate={() => {}}
        workout={workoutLogs.find(w => {
          const workoutDate = new Date(w.completed_at);
          const localWorkoutDate = new Date(workoutDate.getTime() - (workoutDate.getTimezoneOffset() * 60000));
          return localWorkoutDate.toISOString().split('T')[0] === selectedDate?.dateString;
        })}
      />
    </>
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
  streaksContainer: {
    marginBottom: 24,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiContainer: {
    width: '25%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 4,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  streakContent: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  streakSubtext: {
    fontSize: 16,
    color: colors.text.primary,
    marginTop: 4,
    opacity: 0.9,
  },
  calendarLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarContainer: {
    marginBottom: 24,
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: 16,
  },
}); 