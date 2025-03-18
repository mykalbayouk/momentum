import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';

// Sample data for leaderboard
const sampleUsers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    streak: 45,
    imageUri: null,
  },
  {
    id: '2',
    name: 'Mike Chen',
    streak: 38,
    imageUri: null,
  },
  {
    id: '3',
    name: 'Emma Davis',
    streak: 32,
    imageUri: null,
  },
  {
    id: '4',
    name: 'Alex Thompson',
    streak: 28,
    imageUri: null,
  },
  {
    id: '5',
    name: 'Lisa Wong',
    streak: 25,
    imageUri: null,
  },
];

export default function LeaderboardScreen() {
  const renderUserItem = (user: typeof sampleUsers[0], index: number) => {
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
              {user.imageUri ? (
                <Image source={{ uri: user.imageUri }} style={styles.userImage} />
              ) : (
                <View style={styles.userImagePlaceholder}>
                  <Text style={styles.userImagePlaceholderText}>
                    {user.name[0]}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>{user.streak}</Text>
            <Text style={styles.streakLabel}>days</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
        </View>

        <View style={styles.leaderboardList}>
          {sampleUsers.map((user, index) => renderUserItem(user, index))}
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