import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import { supabase } from '../../utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import ImageViewer from '../../components/ImageViewer';
import ProfileModal from '../../components/ProfileModal';
import { FontAwesome5 } from '@expo/vector-icons';
import { realtimeDB } from '../../utils/RealtimeDB';
import { StreakHelper } from '../../utils/StreakHelper';

interface WorkoutLog {
  completed_at: string;
  is_rest_day: boolean;
}

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  weekly_goal: number;
  current_streak: number;
  longest_streak: number;
  workout_logs: WorkoutLog[];
  is_week_complete: boolean;
}

interface WeekData {
  startDate: Date;
  isComplete: boolean;
}

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const streakHelper = StreakHelper.getInstance();

  useEffect(() => {
    console.log('[Leaderboard] Setting up subscription');
    realtimeDB.subscribeToLeaderboard((users: User[]) => {
      console.log('[Leaderboard] Received users update');
      const validUsers = users.filter(user => user && user.username);
      const usersWithCalculatedStreaks = validUsers.map((user: User) => {
        const displayStreak = streakHelper.calculateDisplayStreak(
          user.current_streak,
          user.is_week_complete
        );
        return {
          ...user,
          current_streak: displayStreak
        };
      });
      setUsers(usersWithCalculatedStreaks);
      setLoading(false);
    });

    return () => {
      console.log('[Leaderboard] Cleaning up subscription');
      realtimeDB.unsubscribe('profiles', () => {});
    };
  }, []);

  const renderPodium = () => {
    if (users.length === 0) return null;
    
    // If we have less than 3 users, only show what we have
    const podiumUsers = users.slice(0, 3);
    const [first, second, third] = podiumUsers;

    return (
      <View style={styles.podiumContainer}>
        {/* Second Place */}
        {second && (
          <TouchableOpacity
            style={styles.podiumItem}
            onPress={() => setSelectedUser(second)}
          >
            <ImageViewer
              url={second.avatar_url}
              size={60}
              placeholder={second.username[0]}
            />
            <View style={styles.podiumRank}>
              <Text style={styles.podiumNumber}>2</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{second.username}</Text>
            <Text style={styles.podiumScore}>{second.current_streak}</Text>
          </TouchableOpacity>
        )}

        {/* First Place */}
        {first && (
          <TouchableOpacity
            style={[styles.podiumItem, styles.firstPlace]}
            onPress={() => setSelectedUser(first)}
          >
            <View style={styles.crownContainer}>
              <FontAwesome5 name="crown" size={24} color={colors.primary.main} />
            </View>
            <ImageViewer
              url={first.avatar_url}
              size={80}
              placeholder={first.username[0]}
            />
            <View style={[styles.podiumRank, styles.firstRank]}>
              <Text style={styles.podiumNumber}>1</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{first.username}</Text>
            <Text style={styles.podiumScore}>{first.current_streak}</Text>
          </TouchableOpacity>
        )}

        {/* Third Place */}
        {third && (
          <TouchableOpacity
            style={styles.podiumItem}
            onPress={() => setSelectedUser(third)}
          >
            <ImageViewer
              url={third.avatar_url}
              size={60}
              placeholder={third.username[0]}
            />
            <View style={styles.podiumRank}>
              <Text style={styles.podiumNumber}>3</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{third.username}</Text>
            <Text style={styles.podiumScore}>{third.current_streak}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderListItem = (user: User, index: number) => {
    // Only skip if we have 3 or more users and this is one of the top 3
    if (users.length >= 3 && index < 3) return null;
    
    return (
      <TouchableOpacity
        key={user.id}
        onPress={() => setSelectedUser(user)}
      >
        <Card variant="elevated" style={styles.listItem}>
          <View style={styles.listItemContent}>
            <View style={styles.rankAndUser}>
              <Text style={styles.listRank}>#{index + 1}</Text>
              <ImageViewer
                url={user.avatar_url}
                size={40}
                placeholder={user.username[0]}
              />
              <Text style={styles.listUsername}>{user.username}</Text>
            </View>
            <Text style={styles.listScore}>{user.current_streak}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
        </View>

        {users.length === 0 ? (
          <Card variant="elevated" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No users found</Text>
          </Card>
        ) : (
          <>
            {renderPodium()}
            <View style={styles.listContainer}>
              {users.map((user, index) => renderListItem(user, index))}
            </View>
          </>
        )}
      </ScrollView>

      <ProfileModal
        visible={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={{
          username: selectedUser?.username || '',
          profilePicture: selectedUser?.avatar_url || undefined,
          currentStreak: selectedUser?.current_streak || 0,
          weekly_goal: selectedUser?.weekly_goal || 0,
          workouts: selectedUser?.workout_logs || [],
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 32,
    height: 200,
  },
  podiumItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  firstPlace: {
    marginBottom: 20,
  },
  crownContainer: {
    position: 'absolute',
    top: -30,
    zIndex: 1,
  },
  podiumRank: {
    backgroundColor: colors.primary.main,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 45,
    right: 25,
  },
  firstRank: {
    top: 60,
    right: 30,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  podiumNumber: {
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 12,
  },
  podiumName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  listItem: {
    padding: 16,
    marginBottom: 4,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankAndUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  listRank: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.secondary,
    width: 40,
    textAlign: 'center',
  },
  listUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    maxWidth: 200,
  },
  listScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginLeft: 16,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
}); 