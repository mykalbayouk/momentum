import React from 'react';
import { Text, ViewStyle } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { colors } from '../theme/colors';

interface CalendarProps {
  markedDates: {
    [date: string]: {
      startingDay?: boolean;
      endingDay?: boolean;
      color?: string;
      textColor?: string;
    };
  };
  onDayPress: (date: { dateString: string }) => void;
  onDayLongPress?: (date: { dateString: string }) => void;
  onMonthChange?: (month: { month: number; year: number }) => void;
  style?: ViewStyle;
}

const Arrow = ({ direction }: { direction: 'left' | 'right' }) => (
  <Text style={{ fontSize: 20, color: colors.primary.main }}>
    {direction === 'left' ? '←' : '→'}
  </Text>
);

export default function Calendar({
  markedDates,
  onDayPress,
  onDayLongPress,
  onMonthChange,
  style,
}: CalendarProps) {
  return (
    <RNCalendar
      initialDate={new Date().toISOString()}
      minDate={new Date(new Date().getFullYear(), 0, 1).toISOString()}
      maxDate={new Date(new Date().getFullYear(), 11, 31).toISOString()}
      onDayPress={onDayPress}
      onDayLongPress={onDayLongPress}
      monthFormat={'MMMM yyyy'}
      onMonthChange={onMonthChange}
      hideExtraDays={true}
      firstDay={0}
      enableSwipeMonths={false}
      markingType="period"
      markedDates={markedDates}
      renderArrow={(direction: 'left' | 'right') => <Arrow direction={direction} />}
      theme={{
        backgroundColor: colors.background.paper,
        calendarBackground: colors.background.paper,
        selectedDayBackgroundColor: colors.primary.light,
        selectedDayTextColor: colors.primary.main,
        todayBackgroundColor: 'transparent',
        todayTextColor: colors.text.primary,
        arrowColor: colors.primary.main,
        monthTextColor: colors.text.primary,
        textDayFontSize: 14,
        textMonthFontSize: 16,
        textMonthFontWeight: 'bold',
        textDayHeaderFontSize: 14,
        dayTextColor: colors.text.primary,
        textSectionTitleColor: colors.text.secondary
      }}
      style={style}
    />
  );
} 