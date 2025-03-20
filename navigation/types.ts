import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
  MainApp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  Workout: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type NavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
  reset: (state: { index: number; routes: { name: keyof RootStackParamList }[] }) => void;
}; 