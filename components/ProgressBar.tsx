import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  style?: ViewStyle;
  color?: string;
  backgroundColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  style,
  color = colors.primary.main,
  backgroundColor = colors.neutral.grey200,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const width = `${clampedProgress * 100}%`;

  return (
    <View 
      style={[
        styles.container,
        { height, backgroundColor },
        style
      ]}
    >
      <View 
        style={[
          styles.progress,
          { width, backgroundColor: color }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  } as ViewStyle,
  progress: {
    height: '100%',
    borderRadius: 4,
  } as ViewStyle,
});

export default ProgressBar; 