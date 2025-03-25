import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Text } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';
import HomeScreen from '../app/home';
import GroupsScreen from '../app/groups';
import LeaderboardScreen from '../app/leaderboard';
import ProfileScreen from '../app/profile';
import CreateGroupScreen from '../app/create-group';
import WorkoutModal from '../components/WorkoutModal';
import { getStartOfToday, getEndOfToday } from '../utils/dateUtils';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const Tab = createBottomTabNavigator();

function GroupsScreenWrapper() {
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  return (
    <>
      <GroupsScreen onCreateGroupPress={() => setShowCreateGroupModal(true)} />
      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateGroupModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Group</Text>
            <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
              <Text style={[styles.closeButton, { color: colors.text.primary }]}>X</Text>
            </TouchableOpacity>
          </View>
          <CreateGroupScreen onClose={() => setShowCreateGroupModal(false)} />
        </SafeAreaView>
      </Modal>
    </>
  );
}

export default function TabNavigator() {
  const { session } = useAuth();
  const [showLogWorkoutModal, setShowLogWorkoutModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWorkoutPress = async () => {
    if (!session?.user?.id) {
      setError('You must be logged in to log a workout');
      return;
    }

    try {
      // Check if there's already a workout for today
      const todayStart = getStartOfToday();
      const todayEnd = getEndOfToday();

      const { data: todayWorkout, error: todayError } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', session.user.id)
        .gte('completed_at', todayStart.toISOString())
        .lte('completed_at', todayEnd.toISOString())
        .maybeSingle();

      if (todayError) throw todayError;

      if (todayWorkout) {
        setError('You have already logged a workout for today');
        return;
      }

      setShowLogWorkoutModal(true);
    } catch (error) {
      console.error('Error checking today\'s workout:', error);
      setError('Failed to check today\'s workout');
    }
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary.main,
          tabBarInactiveTintColor: colors.neutral.grey400,
          tabBarShowLabel: false,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Groups"
          component={GroupsScreenWrapper}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="users" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Workout"
          component={View}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TouchableOpacity 
                style={styles.plusButton}
                onPress={handleWorkoutPress}
              >
                <View style={styles.plusButtonContainer}>
                  <Feather name="plus" size={24} color={colors.text.primary} />
                </View>
              </TouchableOpacity>
            ),
            tabBarLabel: () => null,
          }}
        />
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="award" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <WorkoutModal
        visible={showLogWorkoutModal}
        onClose={() => {
          setShowLogWorkoutModal(false);
          setError(null);
        }}
        onUpdate={() => setShowLogWorkoutModal(false)}
      />
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 84,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.grey800,
    elevation: 0,
    shadowOpacity: 0,
  },
  plusButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButtonContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.grey200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
    fontSize: 16,
  },
}); 