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

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  weekly_goal: number;
  workout_logs: {
    completed_at: string;
    is_rest_day: boolean;
  }[];
}

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    // Subscribe to profile changes
    const subscription = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          // Refresh leaderboard data when any profile changes
          fetchLeaderboard();
        }
      )
      .subscribe();

    // Initial data fetch
    fetchLeaderboard();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      console.log('Fetching leaderboard data...');
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          current_streak,
          longest_streak,
          weekly_goal,
          workout_logs (
            completed_at,
            is_rest_day
          )
        `)
        .not('current_streak', 'is', null)
        .order('current_streak', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
      }

      console.log('Leaderboard data received:', data);
      if (data) {
        // Ensure all required fields are present
        const validUsers = data.filter(user => 
          user.id && 
          user.username && 
          typeof user.current_streak === 'number'
        );
        console.log('Valid users:', validUsers);
        setUsers(validUsers);
      }
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const renderPodium = () => {
    if (users.length < 3) return null;
    const [first, second, third] = users;

    return (
      <View style={styles.podiumContainer}>
        {/* Second Place */}
        <View style={styles.podiumItem}>
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
        </View>

        {/* First Place */}
        <View style={[styles.podiumItem, styles.firstPlace]}>
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
        </View>

        {/* Third Place */}
        <View style={styles.podiumItem}>
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
        </View>
      </View>
    );
  };

  const renderListItem = (user: User, index: number) => {
    if (index < 3) return null; // Skip top 3 as they're in podium
    
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
          longestStreak: selectedUser?.longest_streak || 0,
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
    maxWidth: 100,
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  listItem: {
    padding: 12,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankAndUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listRank: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    width: 32,
  },
  listUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  listScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
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