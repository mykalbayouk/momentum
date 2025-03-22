import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import Card from './Card';
import ProgressBar from './ProgressBar';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';

interface WeeklyProgressProps {
  weeklyGoal: number;
}

export default function WeeklyProgress({ weeklyGoal }: WeeklyProgressProps) {
  const { session } = useAuth();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    // Subscribe to workout log changes
    const subscription = supabase
      .channel('weekly-progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_logs',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          // Refresh progress when changes occur
          loadWeeklyProgress();
        }
      )
      .subscribe();

    // Initial data fetch
    loadWeeklyProgress();

    return () => {
      subscription.unsubscribe();
    };
  }, [session]);

  async function loadWeeklyProgress() {
    try {
      if (!session?.user) return;

      const startOfWeek = getStartOfWeek();
      const endOfWeek = getEndOfWeek();

      // Get all workouts for the current week
      const { data: workouts, error } = await supabase
        .from('workout_logs')
        .select('completed_at, is_rest_day')
        .eq('user_id', session.user.id)
        .gte('completed_at', startOfWeek.toISOString())
        .lte('completed_at', endOfWeek.toISOString());

      if (error) throw error;

      // Calculate unique non-rest day workout days
      const uniqueWorkoutDays = new Set(
        workouts?.filter(w => !w.is_rest_day).map(workout => {
          const date = new Date(workout.completed_at);
          return date.toISOString().split('T')[0];
        }) || []
      );

      // Calculate progress as ratio of unique workout days to weekly goal
      const progress = Math.min(uniqueWorkoutDays.size / weeklyGoal, 1);
      setProgress(progress);
    } catch (error) {
      console.error('Error loading weekly progress:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title="Weekly Progress"
      variant="elevated"
      style={styles.card}
      content={
        <View style={styles.content}>
          <ProgressBar 
            progress={progress} 
            height={8}
          />
          <Text style={styles.text}>
            You're {Math.round(progress * 100)}% of the way to your weekly goal!
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
  },
  content: {
    paddingVertical: 8,
  },
  text: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
}); 