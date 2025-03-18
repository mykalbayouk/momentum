import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  MainApp: undefined;
  Workout: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
};

export type NavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
}; 