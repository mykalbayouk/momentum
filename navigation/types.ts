import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Workout: undefined;
};

export type NavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
}; 