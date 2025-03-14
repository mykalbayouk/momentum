import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  FlatList, 
  TouchableOpacity,
  Animated
} from 'react-native';
import { router, Link } from 'expo-router';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  image: any;
}

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    title: 'Track Your Workouts',
    description: 'Log your daily workouts and build a consistent routine to achieve your fitness goals.',
    image: require('../assets/images/placeholder1.png'),
  },
  {
    id: '2',
    title: 'Build Your Streak',
    description: 'Stay motivated by maintaining your workout streak. The longer your streak, the more rewards you earn!',
    image: require('../assets/images/placeholder2.png'),
  },
  {
    id: '3',
    title: 'Compete With Friends',
    description: 'Create groups, invite friends, and compete to see who can maintain the longest workout streak.',
    image: require('../assets/images/placeholder3.png'),
  },
  {
    id: '4',
    title: 'Upgrade Your Experience',
    description: 'Unlock premium features based on your performance. The better you do, the more you get!',
    image: require('../assets/images/placeholder4.png'),
  },
];

export default function LandingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0].index);
    console.log('Current slide index:', viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
      console.log('Scrolling to next slide:', currentIndex + 1);
    }
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => {
    return (
      <View style={styles.slide}>
        <Image 
          source={item.image} 
          style={styles.image}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const renderDots = () => {
    const dotPosition = Animated.divide(scrollX, width);
    
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, i) => {
          const opacity = dotPosition.interpolate({
            inputRange: [i - 1, i, i + 1],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const width = dotPosition.interpolate({
            inputRange: [i - 1, i, i + 1],
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i.toString()}
              style={[
                styles.dot,
                { opacity, width },
                i === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          );
        })}
      </View>
    );
  };

  const handleLogin = () => {
    console.log('Login button pressed');
  };

  const handleSignup = () => {
    console.log('Sign up button pressed');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />
      
      {renderDots()}
      
      <View style={styles.buttonContainer}>
        {currentIndex === onboardingData.length - 1 ? (
          <View style={styles.authButtons}>
            <Link href="/login" asChild>
              <Button 
                title="Login" 
                onPress={handleLogin} 
                variant="outline"
                style={styles.loginButton}
              />
            </Link>
            <Link href="/signup" asChild>
              <Button 
                title="Sign Up" 
                onPress={handleSignup} 
                style={styles.signupButton}
              />
            </Link>
          </View>
        ) : (
          <Button 
            title="Next" 
            onPress={scrollTo} 
            style={styles.nextButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 30,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 120,
    width: '100%',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#5D5FEF',
  },
  inactiveDot: {
    backgroundColor: '#E0E1FC',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 20,
  },
  nextButton: {
    width: '100%',
  },
  authButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loginButton: {
    flex: 1,
    marginRight: 10,
  },
  signupButton: {
    flex: 1,
    marginLeft: 10,
  },
});
