import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import { supabase } from '../../utils/supabase';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  current_streak: number;
}

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, current_streak')
        .order('current_streak', { ascending: false })
        .limit(50);

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = (user: User, index: number) => {
    const getRankStyle = () => {
      switch (index) {
        case 0:
          return styles.goldRank;
        case 1:
          return styles.silverRank;
        case 2:
          return styles.bronzeRank;
        default:
          return styles.regularRank;
      }
    };

    return (
      <Card
        key={user.id}
        variant="elevated"
        style={{ ...styles.userCard, ...getRankStyle() }}
      >
        <View style={styles.userContent}>
          <View style={styles.rankContainer}>
            <Text style={[styles.rankText, index < 3 && styles.topRankText]}>
              #{index + 1}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userImageContainer}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.userImage} />
              ) : (
                <View style={styles.userImagePlaceholder}>
                  <Text style={styles.userImagePlaceholderText}>
                    {user.username[0]}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.userName}>{user.username}</Text>
          </View>
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>{user.current_streak}</Text>
            <Text style={styles.streakLabel}>days</Text>
          </View>
        </View>
      </Card>
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
          <Text style={styles.subtitle}>Top Streaks</Text>
        </View>

        <View style={styles.leaderboardList}>
          {users.map((user, index) => renderUserItem(user, index))}
        </View>
      </ScrollView>
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
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 4,
  },
  leaderboardList: {
    gap: 12,
  },
  userCard: {
    padding: 16,
  },
  goldRank: {
    backgroundColor: '#FFD700',
  },
  silverRank: {
    backgroundColor: '#C0C0C0',
  },
  bronzeRank: {
    backgroundColor: '#CD7F32',
  },
  regularRank: {
    backgroundColor: colors.background.paper,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  topRankText: {
    color: colors.text.inverse,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  userImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImagePlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  streakContainer: {
    alignItems: 'flex-end',
  },
  streakText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  streakLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
}); 