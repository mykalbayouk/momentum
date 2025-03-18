import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import LandingPage from '../app/index';
import LoginScreen from '../app/login/index';
import SignupScreen from '../app/signup/index';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

interface AppNavigatorProps {
  initialRouteName: string;
}

export default function AppNavigator({ initialRouteName }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen 
          name="MainApp" 
          component={TabNavigator}
          options={{
            gestureEnabled: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 