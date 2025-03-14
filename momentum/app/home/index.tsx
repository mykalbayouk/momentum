import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Image
} from 'react-native';
import { router } from 'expo-router';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import Calendar from '../../components/Calendar';

export default function HomeScreen() {
  const [currentStreak, setCurrentStreak] = useState(5);
  const [longestStreak, setLongestStreak] = useState(12);
  const [progress, setProgress] = useState(0.7);
  
  // Sample data for marked dates (workouts completed)
  const markedDates = {
    '2023-05-01': { marked: true },
    '2023-05-02': { marked: true },
    '2023-05-03': { marked: true },
    '2023-05-04': { marked: true },
    '2023-05-05': { marked: true },
    '2023-05-08': { marked: true },
    '2023-05-09': { marked: true },
  };

  const handleDayPress = (date: { dateString: string }) => {
    console.log('Selected date:', date.dateString);
  };

  const handleLogWorkout = () => {
    console.log('Log workout pressed');
    // In a real app, this would save the workout to the database
    // and update the streak
    setCurrentStreak(currentStreak + 1);
    if (currentStreak + 1 > longestStreak) {
      setLongestStreak(currentStreak + 1);
    }
    setProgress(Math.min(1, progress + 0.1));
  };

  const handleCreateGroup = () => {
    console.log('Create group pressed');
    // In a real app, this would navigate to a group creation screen
  };

  const handleJoinGroup = () => {
    console.log('Join group pressed');
    // In a real app, this would navigate to a group joining screen
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Momentum</Text>
          <TouchableOpacity onPress={() => {
            console.log('Profile button pressed');
          }}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>M</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Card
          variant="elevated"
          style={styles.streakCard}
          content={
            <View style={styles.streakContent}>
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>Current Streak</Text>
                <View style={styles.streakBadgeContainer}>
                  <Badge 
                    value={currentStreak} 
                    variant="primary" 
                    size="large" 
                  />
                  <Text style={styles.streakLabel}>days</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>Longest Streak</Text>
                <View style={styles.streakBadgeContainer}>
                  <Badge 
                    value={longestStreak} 
                    variant="success" 
                    size="large" 
                  />
                  <Text style={styles.streakLabel}>days</Text>
                </View>
              </View>
            </View>
          }
          footer={
            <Button
              title="Log Today's Workout"
              onPress={handleLogWorkout}
              style={styles.logButton}
            />
          }
        />

        <Card
          title="Weekly Progress"
          variant="elevated"
          style={styles.progressCard}
          content={
            <View style={styles.progressContent}>
              <ProgressBar 
                progress={progress} 
                height={16}
                showPercentage
                label="Week Goal"
              />
              <Text style={styles.progressText}>
                You're {Math.round(progress * 100)}% of the way to your weekly goal!
              </Text>
            </View>
          }
        />

        <Text style={styles.sectionTitle}>Workout Calendar</Text>
        <Calendar 
          markedDates={markedDates}
          onDayPress={handleDayPress}
          streakIndicator
          currentStreakCount={currentStreak}
          longestStreakCount={longestStreak}
        />

        <Text style={styles.sectionTitle}>Social</Text>
        <View style={styles.socialButtons}>
          <Button
            title="Create Group"
            onPress={handleCreateGroup}
            variant="outline"
            style={styles.socialButton}
          />
          <Button
            title="Join Group"
            onPress={handleJoinGroup}
            style={styles.socialButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5D5FEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakCard: {
    marginBottom: 16,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  streakInfo: {
    flex: 1,
    alignItems: 'center',
  },
  streakTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  streakBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  logButton: {
    marginTop: 8,
  },
  progressCard: {
    marginBottom: 24,
  },
  progressContent: {
    paddingVertical: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 