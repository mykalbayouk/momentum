import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  TouchableOpacity,
  Platform
} from 'react-native';
import { colors } from '../theme/colors';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  title?: string;
  subtitle?: string;
  content?: string | React.ReactNode;
  footer?: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  contentStyle?: TextStyle | ViewStyle;
  onPress?: () => void;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  content,
  footer,
  variant = 'default',
  style,
  titleStyle,
  subtitleStyle,
  contentStyle,
  onPress,
  children
}) => {
  const getCardStyle = () => {
    const baseStyle: ViewStyle[] = [styles.card];
    
    if (variant === 'elevated') {
      baseStyle.push(styles.elevatedCard);
    } else if (variant === 'outlined') {
      baseStyle.push(styles.outlinedCard);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };
  
  const renderContent = () => (
    <>
      {title && (
        <Text style={[styles.title, titleStyle]}>{title}</Text>
      )}
      
      {subtitle && (
        <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
      )}
      
      {content && (
        typeof content === 'string' ? (
          <Text style={[styles.content, contentStyle as TextStyle]}>{content}</Text>
        ) : (
          <View style={[styles.contentContainer, contentStyle as ViewStyle]}>
            {content}
          </View>
        )
      )}
      
      {children && (
        <View style={styles.childrenContainer}>
          {children}
        </View>
      )}
      
      {footer && (
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        style={getCardStyle()} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={getCardStyle()}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  } as ViewStyle,
  elevatedCard: {
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  } as ViewStyle,
  outlinedCard: {
    borderWidth: 1,
    borderColor: colors.neutral.grey200,
  } as ViewStyle,
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text.primary,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  } as TextStyle,
  content: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  } as TextStyle,
  contentContainer: {
    marginVertical: 8,
  } as ViewStyle,
  childrenContainer: {
    marginTop: 8,
  } as ViewStyle,
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.grey200,
    paddingTop: 12,
  } as ViewStyle,
});

export default Card; 