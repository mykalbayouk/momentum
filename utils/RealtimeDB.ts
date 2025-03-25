import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  current_streak: number;
  longest_streak: number;
  streak_count: number;
  weekly_goal: number;
  is_week_complete: boolean;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  completed_at: string;
  workout_type: string;
  duration: string;
  intensity: number;
  notes: string;
  image_url: string | null;
  is_rest_day: boolean;
}

type TableName = 'profiles' | 'workout_logs';
type Listener = (data: any) => void;

class RealtimeDB {
  private static instance: RealtimeDB;
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();
  private profiles: Map<string, Profile> = new Map();
  private workoutLogs: Map<string, WorkoutLog[]> = new Map();

  private constructor() {
    console.log('[RealtimeDB] Initializing singleton instance');
  }

  public static getInstance(): RealtimeDB {
    if (!RealtimeDB.instance) {
      RealtimeDB.instance = new RealtimeDB();
    }
    return RealtimeDB.instance;
  }

  private getChannelKey(table: TableName, userId?: string): string {
    return userId ? `${table}-${userId}` : table;
  }

  public async subscribeToProfile(userId: string, listener: Listener) {
    console.log(`[RealtimeDB] Subscribing to profile updates for user ${userId}`);
    const channelKey = this.getChannelKey('profiles', userId);

    // Add listener
    if (!this.listeners.has(channelKey)) {
      this.listeners.set(channelKey, new Set());
    }
    this.listeners.get(channelKey)?.add(listener);

    // Create channel if it doesn't exist
    if (!this.channels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          async (payload) => {
            console.log('[RealtimeDB] Profile update received:', {
              event: payload.eventType,
              timestamp: new Date().toISOString(),
            });

            const profile = payload.new as Profile;
            this.profiles.set(userId, profile);
            
            // Notify all listeners
            this.listeners.get(channelKey)?.forEach(l => l(profile));
          }
        )
        .subscribe();

      this.channels.set(channelKey, channel);

      // Initial fetch
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        this.profiles.set(userId, data);
        listener(data);
      }
    } else {
      // If channel exists, send cached data immediately
      const cachedProfile = this.profiles.get(userId);
      if (cachedProfile) {
        listener(cachedProfile);
      }
    }
  }

  public async subscribeToWorkoutLogs(userId: string, listener: Listener) {
    console.log(`[RealtimeDB] Subscribing to workout logs for user ${userId}`);
    const channelKey = this.getChannelKey('workout_logs', userId);

    // Add listener
    if (!this.listeners.has(channelKey)) {
      this.listeners.set(channelKey, new Set());
    }
    this.listeners.get(channelKey)?.add(listener);

    // Create channel if it doesn't exist
    if (!this.channels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workout_logs',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            console.log('[RealtimeDB] Workout logs update received:', {
              event: payload.eventType,
              timestamp: new Date().toISOString(),
            });

            // Fetch all workout logs after any change
            const { data, error } = await supabase
              .from('workout_logs')
              .select('*')
              .eq('user_id', userId)
              .order('completed_at', { ascending: false });

            if (!error && data) {
              this.workoutLogs.set(userId, data);
              // Notify all listeners
              this.listeners.get(channelKey)?.forEach(l => l(data));
            }
          }
        )
        .subscribe();

      this.channels.set(channelKey, channel);

      // Initial fetch
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (!error && data) {
        this.workoutLogs.set(userId, data);
        listener(data);
      }
    } else {
      // If channel exists, send cached data immediately
      const cachedLogs = this.workoutLogs.get(userId);
      if (cachedLogs) {
        listener(cachedLogs);
      }
    }
  }

  public async subscribeToLeaderboard(listener: Listener) {
    console.log('[RealtimeDB] Subscribing to leaderboard updates');
    const channelKey = this.getChannelKey('profiles');

    // Add listener
    if (!this.listeners.has(channelKey)) {
      this.listeners.set(channelKey, new Set());
    }
    this.listeners.get(channelKey)?.add(listener);

    // Create channel if it doesn't exist
    if (!this.channels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
          },
          async () => {
            console.log('[RealtimeDB] Leaderboard update received');
            
            // Fetch all profiles with workout logs for leaderboard
            const { data, error } = await supabase
              .from('profiles')
              .select(`
                *,
                workout_logs (
                  completed_at,
                  is_rest_day
                )
              `)
              .order('current_streak', { ascending: false });

            if (!error && data) {
              // Notify all listeners
              this.listeners.get(channelKey)?.forEach(l => l(data));
            }
          }
        )
        .subscribe();

      this.channels.set(channelKey, channel);

      // Initial fetch
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          workout_logs (
            completed_at,
            is_rest_day
          )
        `)
        .order('current_streak', { ascending: false });

      if (!error && data) {
        listener(data);
      }
    }
  }

  public unsubscribe(table: TableName, listener: Listener, userId?: string) {
    const channelKey = this.getChannelKey(table, userId);
    
    // Remove specific listener
    this.listeners.get(channelKey)?.delete(listener);

    // If no more listeners, remove channel
    if (this.listeners.get(channelKey)?.size === 0) {
      const channel = this.channels.get(channelKey);
      if (channel) {
        channel.unsubscribe();
        this.channels.delete(channelKey);
      }
      this.listeners.delete(channelKey);
    }
  }
}

export const realtimeDB = RealtimeDB.getInstance(); 