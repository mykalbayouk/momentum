import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ProgressBarProps {
  progress: number; // Value between 0 and 1
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
  showPercentage?: boolean;
  percentageStyle?: TextStyle;
  style?: ViewStyle;
  animated?: boolean;
  label?: string;
  labelStyle?: TextStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 10,
  backgroundColor = '#E0E0E0',
  fillColor = '#5D5FEF',
  borderRadius = 5,
  showPercentage = false,
  percentageStyle,
  style,
  animated = true,
  label,
  labelStyle,
}) => {
  // Ensure progress is between 0 and 1
  const validProgress = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(validProgress * 100);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      
      <View 
        style={[
          styles.progressContainer, 
          { 
            height, 
            backgroundColor, 
            borderRadius 
          }
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: fillColor,
              borderRadius,
            },
            animated && styles.animated,
          ]}
        />
      </View>
      
      {showPercentage && (
        <Text style={[styles.percentage, percentageStyle]}>
          {percentage}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  } as ViewStyle,
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  } as TextStyle,
  progressContainer: {
    width: '100%',
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  } as ViewStyle,
  animated: {
    width: '100%',
  } as ViewStyle,
  percentage: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    color: '#666',
    textAlign: 'right',
  } as TextStyle,
});

export default ProgressBar; 