import React from 'react';
import { Text, ViewStyle } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { colors } from '../theme/colors';

interface CalendarProps {
  markedDates: {
    [date: string]: {
      selected?: boolean;
      selectedColor?: string;
      selectedTextColor?: string;
      backgroundColor?: string;
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
      firstDay={1}
      enableSwipeMonths={true}
      markingType="custom"
      markedDates={markedDates}
      renderArrow={(direction: 'left' | 'right') => <Arrow direction={direction} />}
      theme={{
        backgroundColor: colors.background.paper,
        calendarBackground: colors.background.paper,
        selectedDayBackgroundColor: colors.primary.light,
        selectedDayTextColor: colors.primary.main,
        todayBackgroundColor: colors.semantic.success.light,
        todayTextColor: colors.semantic.success.main,
        arrowColor: colors.primary.main,
        monthTextColor: colors.text.primary,
        textDayFontSize: 14,
        textMonthFontSize: 16,
        textMonthFontWeight: 'bold',
        textDayHeaderFontSize: 14,
        dayTextColor: colors.text.primary,
        textSectionTitleColor: colors.text.secondary,
        'stylesheet.calendar.period': {
          base: {
            overflow: 'hidden',
            height: 34,
            alignItems: 'center',
            width: '100%'
          },
          fillers: {
            position: 'absolute',
            height: 34,
            flexDirection: 'row',
            left: 0,
            right: 0
          },
          leftFiller: {
            height: 34,
            flex: 1
          },
          rightFiller: {
            height: 34,
            flex: 1
          }
        }
      }}
      style={style}
    />
  );
} 