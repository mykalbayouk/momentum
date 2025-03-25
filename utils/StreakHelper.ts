import { supabase } from './supabase';
import { getStartOfWeek, getEndOfWeek, getStartOfToday } from './dateUtils';

export interface WorkoutLog {
  completed_at: string;
  is_rest_day: boolean;
}

export class StreakHelper {
  private static instance: StreakHelper;

  private constructor() {}

  public static getInstance(): StreakHelper {
    if (!StreakHelper.instance) {
      StreakHelper.instance = new StreakHelper();
    }
    return StreakHelper.instance;
  }

  public async updateStreakInDB(userId: string, currentStreak: number) {
    try {
      console.log('[StreakHelper] Updating streak in DB:', { currentStreak });
      const { error } = await supabase
        .from('profiles')
        .update({
          current_streak: currentStreak,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('[StreakHelper] Error updating streak:', error);
      throw error;
    }
  }

  public async updateWeekComplete(userId: string, isComplete: boolean) {
    try {
      console.log('[StreakHelper] Updating is_week_complete:', isComplete);
      const { error } = await supabase
        .from('profiles')
        .update({
          is_week_complete: isComplete,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('[StreakHelper] Error updating is_week_complete:', error);
      throw error;
    }
  }

  public calculateCurrentWeekStatus(logs: WorkoutLog[], weeklyGoal: number): boolean {
    if (!weeklyGoal) return false;

    const startOfWeek = getStartOfWeek(new Date());
    const endOfWeek = getEndOfWeek(new Date());

    // Filter logs for current week
    const currentWeekLogs = logs.filter(log => {
      const logDate = new Date(log.completed_at);
      return logDate >= startOfWeek && logDate <= endOfWeek;
    });

    // Count non-rest workouts
    const nonRestWorkouts = currentWeekLogs.filter(log => !log.is_rest_day);
    return nonRestWorkouts.length >= weeklyGoal;
  }

  public calculateDisplayStreak(dbStreak: number, isWeekComplete: boolean): number {
    return dbStreak + (isWeekComplete ? 1 : 0);
  }

  public async checkAndUpdateWeekStatus(userId: string, logs: WorkoutLog[], weeklyGoal: number) {
    try {
      const isCurrentWeekComplete = this.calculateCurrentWeekStatus(logs, weeklyGoal);
      await this.updateWeekComplete(userId, isCurrentWeekComplete);
      console.log('[StreakHelper] Updated week status:', isCurrentWeekComplete);
    } catch (error) {
      console.error('[StreakHelper] Error checking/updating week status:', error);
      throw error;
    }
  }

  public async checkAndUpdateStreak(userId: string, logs: WorkoutLog[], weeklyGoal: number, currentDBStreak: number) {
    try {
      const today = getStartOfToday();
      const endOfLastWeek = getStartOfWeek(today);
      endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
      const startOfLastWeek = getStartOfWeek(endOfLastWeek);

      // Filter logs for last week
      const lastWeekLogs = logs.filter(log => {
        const logDate = new Date(log.completed_at);
        return logDate >= startOfLastWeek && logDate <= endOfLastWeek;
      });

      // Count non-rest workouts for last week
      const nonRestWorkouts = lastWeekLogs.filter(log => !log.is_rest_day);
      const wasLastWeekComplete = nonRestWorkouts.length >= weeklyGoal;

      // If last week is complete and it hasn't been counted (current streak matches DB)
      if (wasLastWeekComplete) {
        const newCurrentStreak = currentDBStreak + 1;
        await this.updateStreakInDB(userId, newCurrentStreak);
        console.log('[StreakHelper] Updated streak for completed week:', { newCurrentStreak });
      } else if (!wasLastWeekComplete && currentDBStreak > 0) {
        // Reset streak if last week was incomplete
        await this.updateStreakInDB(userId, 0);
        console.log('[StreakHelper] Reset streak due to incomplete week');
      }

      // Always check and update current week status
      await this.checkAndUpdateWeekStatus(userId, logs, weeklyGoal);
    } catch (error) {
      console.error('[StreakHelper] Error in checkAndUpdateStreak:', error);
      throw error;
    }
  }
} 