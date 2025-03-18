import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  ViewStyle
} from 'react-native';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import Calendar from '../../components/Calendar';
import { colors } from '../../theme/colors';

export default function HomeScreen() {
  const [currentStreak, setCurrentStreak] = useState(5);
  const [longestStreak, setLongestStreak] = useState(12);
  const [progress, setProgress] = useState(0.7);
  

  const today = new Date().toISOString().split('T')[0];
  
  // Sample data for marked dates (workouts completed)
  const markedDates = {
    '2025-03-01': { 
      selected: true,
      selectedColor: colors.primary.light,
      selectedTextColor: colors.primary.main
    },
    '2025-03-02': { 
      selected: true,
      selectedColor: colors.primary.light,
      selectedTextColor: colors.primary.main
    },
    '2025-03-03': { 
      selected: true,
      selectedColor: colors.primary.light,
      selectedTextColor: colors.primary.main
    },
    '2025-03-04': { 
      selected: true,
      selectedColor: colors.primary.light,
      selectedTextColor: colors.primary.main
    },
    '2025-03-05': { 
      selected: true,
      selectedColor: colors.primary.light,
      selectedTextColor: colors.primary.main
    },
    '2025-03-08': { 
      selected: true,
      selectedColor: colors.primary.light,
      selectedTextColor: colors.primary.main
    },
    '2025-03-09': { 
      selected: true,
      selectedColor: colors.primary.light,
      selectedTextColor: colors.primary.main
    },
    [today]: {
      selected: true,
      selectedColor: colors.semantic.success.light,
      selectedTextColor: colors.semantic.success.main
    }
  };

  const handleDayPress = (date: { dateString: string }) => {
    console.log('Selected date:', date.dateString);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Momentum</Text>
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
                    label={currentStreak.toString()} 
                    variant="default"
                    size="medium"
                  />
                  <Text style={styles.streakLabel}>days</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>Longest Streak</Text>
                <View style={styles.streakBadgeContainer}>
                  <Badge 
                    label={longestStreak.toString()} 
                    variant="success"
                    size="large"
                  />
                  <Text style={styles.streakLabel}>days</Text>
                </View>
              </View>
            </View>
          }
        />

        <Card
          title="Weekly Progress"
          variant="elevated"
          style={styles.progressCard}
          content={
            <View style={styles.progressContent}>
              <ProgressBar 
                progress={0.75} 
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
    color: colors.text.primary,
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
    color: colors.text.secondary,
    marginBottom: 8,
  },
  streakBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.neutral.grey200,
    marginHorizontal: 16,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  calendarContainer: {
    marginBottom: 24,
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: 16,
  } as ViewStyle,
}); 