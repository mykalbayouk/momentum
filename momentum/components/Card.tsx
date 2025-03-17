import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  TouchableOpacity
} from 'react-native';

type CardVariant = 'default' | 'elevated' | 'outlined';

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
  
  const CardContainer = onPress ? TouchableOpacity : View;
  
  return (
    <CardContainer 
      style={getCardStyle()} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
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
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  } as ViewStyle,
  elevatedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  outlinedCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  } as ViewStyle,
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  } as TextStyle,
  content: {
    fontSize: 14,
    color: '#333333',
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
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  } as ViewStyle,
});

export default Card; 