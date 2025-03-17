import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import LandingPage from '../app/index';
import LoginScreen from '../app/login/index';
import SignupScreen from '../app/signup/index';
import HomeScreen from '../app/home/index';
import WorkoutScreen from '../app/workout/index';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            gestureEnabled: false // Disable swipe-back gesture for Home screen
          }}
        />
        <Stack.Screen name="Workout" component={WorkoutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 