import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ViewStyle,
  TextStyle,
  Dimensions
} from 'react-native';

interface CalendarProps {
  markedDates?: Record<string, { marked: boolean; type?: string; color?: string }>;
  onDayPress?: (date: { dateString: string; day: number; month: number; year: number; timestamp: number }) => void;
  initialDate?: string; // Format: YYYY-MM-DD
  minDate?: string;
  maxDate?: string;
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  dayStyle?: ViewStyle;
  dayTextStyle?: TextStyle;
  markedDayStyle?: ViewStyle;
  markedDayTextStyle?: TextStyle;
  monthTextStyle?: TextStyle;
  weekdayTextStyle?: TextStyle;
  disabledDayTextStyle?: TextStyle;
  streakIndicator?: boolean;
  currentStreakCount?: number;
  longestStreakCount?: number;
}

const Calendar: React.FC<CalendarProps> = ({
  markedDates = {},
  onDayPress,
  initialDate,
  minDate,
  maxDate,
  style,
  headerStyle,
  dayStyle,
  dayTextStyle,
  markedDayStyle,
  markedDayTextStyle,
  monthTextStyle,
  weekdayTextStyle,
  disabledDayTextStyle,
  streakIndicator = false,
  currentStreakCount = 0,
  longestStreakCount = 0,
}) => {
  const today = new Date();
  const initialDateObj = initialDate ? new Date(initialDate) : today;
  
  const [currentMonth, setCurrentMonth] = useState(initialDateObj.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDateObj.getFullYear());
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const formatDateString = (day: number, month: number, year: number) => {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };
  
  const isDateMarked = (dateString: string) => {
    return markedDates[dateString] && markedDates[dateString].marked;
  };
  
  const isDateInRange = (day: number, month: number, year: number) => {
    const dateString = formatDateString(day, month, year);
    const date = new Date(dateString);
    
    if (minDate) {
      const minDateObj = new Date(minDate);
      if (date < minDateObj) return false;
    }
    
    if (maxDate) {
      const maxDateObj = new Date(maxDate);
      if (date > maxDateObj) return false;
    }
    
    return true;
  };
  
  const isToday = (day: number, month: number, year: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };
  
  const handleDayPress = (day: number, month: number, year: number) => {
    if (!isDateInRange(day, month, year)) return;
    
    const dateString = formatDateString(day, month, year);
    const timestamp = new Date(dateString).getTime();
    
    if (onDayPress) {
      onDayPress({
        dateString,
        day,
        month: month + 1,
        year,
        timestamp,
      });
    }
  };
  
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateString(day, currentMonth, currentYear);
      const marked = isDateMarked(dateString);
      const inRange = isDateInRange(day, currentMonth, currentYear);
      const isCurrentDay = isToday(day, currentMonth, currentYear);
      
      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.dayCell,
            dayStyle,
            marked && [styles.markedDay, markedDayStyle],
            isCurrentDay && styles.today,
            !inRange && styles.disabledDay,
          ]}
          onPress={() => handleDayPress(day, currentMonth, currentYear)}
          disabled={!inRange}
        >
          <Text
            style={[
              styles.dayText,
              dayTextStyle,
              marked && [styles.markedDayText, markedDayTextStyle],
              isCurrentDay && styles.todayText,
              !inRange && [styles.disabledDayText, disabledDayTextStyle],
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };
  
  return (
    <View style={[styles.container, style]}>
      {streakIndicator && (
        <View style={styles.streakContainer}>
          <View style={styles.streakItem}>
            <Text style={styles.streakCount}>{currentStreakCount}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakItem}>
            <Text style={styles.streakCount}>{longestStreakCount}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>
      )}
      
      <View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'<'}</Text>
        </TouchableOpacity>
        
        <Text style={[styles.monthText, monthTextStyle]}>
          {months[currentMonth]} {currentYear}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.weekdaysContainer}>
        {weekdays.map((weekday, index) => (
          <Text key={index} style={[styles.weekdayText, weekdayTextStyle]}>
            {weekday}
          </Text>
        ))}
      </View>
      
      <View style={styles.daysContainer}>
        {renderDays()}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const cellSize = width / 7 - 8;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  streakItem: {
    alignItems: 'center',
  },
  streakCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5D5FEF',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D5FEF',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    width: cellSize,
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: cellSize,
    height: cellSize,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  dayText: {
    fontSize: 14,
    color: '#333333',
  },
  markedDay: {
    backgroundColor: '#E0E1FC',
    borderRadius: 100,
  },
  markedDayText: {
    color: '#5D5FEF',
    fontWeight: '600',
  },
  today: {
    borderWidth: 1,
    borderColor: '#5D5FEF',
    borderRadius: 100,
  },
  todayText: {
    color: '#5D5FEF',
    fontWeight: '600',
  },
  disabledDay: {
    opacity: 0.4,
  },
  disabledDayText: {
    color: '#999999',
  },
});

export default Calendar; 