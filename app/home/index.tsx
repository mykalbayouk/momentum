import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  ViewStyle,
  Alert,
} from 'react-native';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Calendar from '../../components/Calendar';
import ViewWorkoutModal from '../../components/ViewWorkoutModal';
import WeeklyProgress from '../../components/WeeklyProgress';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getStartOfToday, getStartOfWeek, getEndOfWeek } from '../../utils/dateUtils';


type WorkoutType = 'Strength Training' | 'Running' | 'Swimming' | 'Climbing' | 'Cycling' | 'Yoga' | 'Hiking' | 'Boxing' | 'Sports' | 'Other';

interface WorkoutLog {
  id: string;
  completed_at: string;
  workout_type: WorkoutType;
  duration: string;
  intensity: number;
  notes: string;
  image_url: string | null;
  is_rest_day: boolean;
}

interface Profile {
  id: string;
  username: string;
  current_streak: number;
  longest_streak: number;
  streak_count: number;
  weekly_goal: number;
  weekly_progress: number;
}

export default function HomeScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [showViewWorkoutModal, setShowViewWorkoutModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<{ dateString: string } | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel('home-profile-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`,
        },
        async (payload) => {
          const newProfile = payload.new as Profile;
          setProfile(newProfile);
        }
      )
      .subscribe();

    // Subscribe to workout log changes
    const workoutSubscription = supabase
      .channel('home-workout-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_logs',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          // Refresh workout logs when changes occur
          loadWorkoutLogs();
        }
      )
      .subscribe();

    // Initial data fetch
    loadProfileData();
    loadWorkoutLogs();

    return () => {
      profileSubscription.unsubscribe();
      workoutSubscription.unsubscribe();
    };
  }, [session]);

  async function loadProfileData() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkoutLogs() {
    try {
      if (!session?.user?.id) return;

      // First, get the profile data to get the weekly goal
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('weekly_goal')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      const weeklyGoal = profileData?.weekly_goal || 0;

      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, completed_at, workout_type, duration, intensity, notes, image_url, is_rest_day')
        .eq('user_id', session.user.id)
        .order('completed_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setWorkoutLogs(data);
        
        // Create marked dates for calendar
        const marked: { [date: string]: any } = {};
        const today = getStartOfToday();
        const todayStr = today.toISOString().split('T')[0];

        // Step 1: Mark individual workout days with dots
        data.forEach(workout => {
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
        data.forEach(workout => {
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

        // Calculate streaks
        const weeks = Array.from(workoutsByWeek.keys()).sort();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Process weeks from most recent to oldest
        for (let i = weeks.length - 1; i >= 0; i--) {
          const weekKey = weeks[i];
          const weekWorkouts = workoutsByWeek.get(weekKey) || [];
          const nonRestWorkouts = weekWorkouts.filter(w => !w.is_rest_day);
          const isWeekComplete = nonRestWorkouts.length >= weeklyGoal;

          if (isWeekComplete) {
            tempStreak++;
            if (i === weeks.length - 1) {
              currentStreak = tempStreak;
            }
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }

        // Update profile with new streak values
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            current_streak: currentStreak,
            longest_streak: longestStreak
          })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating streaks:', updateError);
        }

        // Step 3: Process each week for streaks
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

        setMarkedDates(marked);
      }
    } catch (error) {
      console.error('Error loading workout logs:', error);
    }
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
            <Text style={styles.title}>Morementum</Text>
          </View>

          <View style={styles.streaksContainer}>
            <Card variant="elevated" style={{ ...styles.streakCard, backgroundColor: colors.primary.main }}>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakValue}>{profile?.current_streak || 0} weeks</Text>
            </Card>
            <Card variant="elevated" style={styles.streakCard}>
              <Text style={styles.streakLabel}>Longest Streak</Text>
              <Text style={styles.streakValue}>{profile?.longest_streak || 0} weeks</Text>
            </Card>
          </View>

          {profile?.weekly_goal && (
            <WeeklyProgress weeklyGoal={profile.weekly_goal} />
          )}

          <View style={styles.calendarContainer}>
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
        onUpdate={loadWorkoutLogs}
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
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  streakCard: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background.paper,
  },
  streakLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  calendarContainer: {
    marginBottom: 24,
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: 16,
  },
}); 