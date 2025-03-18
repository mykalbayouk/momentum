import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import Calendar from '../../components/Calendar';
import WorkoutModal from '../../components/WorkoutModal';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';

type WorkoutType = 'running' | 'cycling' | 'swimming' | 'yoga' | 'strength_training' | 'hiit' | 'walking' | 'dancing' | 'sports' | 'other';

interface WorkoutLog {
  id: string;
  completed_at: string;
  workout_type: WorkoutType;
  duration: string;
  intensity: number;
  notes: string;
  image_url: string | null;
}

interface Profile {
  current_streak: number;
  longest_streak: number;
}

export default function HomeScreen() {
  const { session } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [progress, setProgress] = useState(0.7);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutLog | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadProfileData();
      loadWorkoutLogs();
    }
  }, [session]);

  async function loadProfileData() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentStreak(data.current_streak);
        setLongestStreak(data.longest_streak);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  }

  async function loadWorkoutLogs() {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, completed_at, workout_type, duration, intensity, notes, image_url')
        .eq('user_id', session?.user.id)
        .order('completed_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setWorkoutLogs(data);
        
        // Create marked dates for calendar
        const marked: { [date: string]: any } = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        // First, collect all workout dates
        const workoutDates = data.map(workout => {
          const date = new Date(workout.completed_at);
          date.setHours(0, 0, 0, 0);
          return date.toISOString().split('T')[0];
        }).sort();

        // Find streaks
        let streakStart = null;
        let i = 0;
        
        while (i < workoutDates.length) {
          const currentDate = new Date(workoutDates[i]);
          
          if (!streakStart) {
            streakStart = workoutDates[i];
          }
          
          // Check if this is the last date or if next date breaks the streak
          const isLastDate = i === workoutDates.length - 1;
          const nextDate = !isLastDate ? new Date(workoutDates[i + 1]) : null;
          const isStreakBroken = nextDate && 
            (nextDate.getTime() - currentDate.getTime()) !== (24 * 60 * 60 * 1000);
          
          if (isLastDate || isStreakBroken) {
            // End of a streak (or single date)
            const streakEnd = workoutDates[i];
            const isStreak = streakStart !== streakEnd;
            
            // Mark all dates in the streak
            let markDate = new Date(streakStart);
            const endDate = new Date(streakEnd);
            
            while (markDate <= endDate) {
              const dateStr = markDate.toISOString().split('T')[0];
              marked[dateStr] = {
                startingDay: dateStr === streakStart,
                endingDay: dateStr === streakEnd,
                color: colors.semantic.success.main,
                textColor: colors.text.inverse
              };
              markDate.setDate(markDate.getDate() + 1);
            }
            
            streakStart = null;
          }
          
          i++;
        }

        // Handle today's date
        if (!marked[todayStr]) {
          // Today without workout
          marked[todayStr] = {
            startingDay: true,
            endingDay: true,
            color: colors.primary.main,
            textColor: colors.text.inverse
          };
        }

        setMarkedDates(marked);
      }
    } catch (error) {
      console.error('Error loading workout logs:', error);
    }
  }

  const handleDayPress = (date: { dateString: string }) => {
    // Find workouts for the selected date
    const dayWorkouts = workoutLogs.filter(
      workout => workout.completed_at.split('T')[0] === date.dateString
    );
    
    if (dayWorkouts.length > 0) {
      setSelectedWorkout(dayWorkouts[0]);
      setIsModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Momentum</Text>
        </View>

        <View style={styles.streaksContainer}>
          <Card variant="elevated" style={{ ...styles.streakCard, backgroundColor: colors.primary.main }}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakValue}>{currentStreak} days</Text>
          </Card>
          <Card variant="elevated" style={styles.streakCard}>
            <Text style={styles.streakLabel}>Longest Streak</Text>
            <Text style={styles.streakValue}>{longestStreak} days</Text>
          </Card>
        </View>

        <Card
          title="Weekly Progress"
          variant="elevated"
          style={styles.progressCard}
          content={
            <View style={styles.progressContent}>
              <ProgressBar 
                progress={progress} 
                height={8}
              />
              <Text style={styles.progressText}>
                You're {Math.round(progress * 100)}% of the way to your weekly goal!
              </Text>
            </View>
          }
        />

        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDayPress}
            onDayLongPress={(day) => {
              console.log('Long pressed day:', day);
            }}
            onMonthChange={(month) => {
              console.log('Month changed:', month);
            }}
          />
        </View>
      </ScrollView>

      <WorkoutModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedWorkout(null);
        }}
        onUpdate={loadWorkoutLogs}
        workout={selectedWorkout || undefined}
      />
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
  progressCard: {
    marginBottom: 24,
  },
  progressContent: {
    paddingVertical: 8,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  calendarContainer: {
    marginBottom: 24,
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: 16,
  },
}); 