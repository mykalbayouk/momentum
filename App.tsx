import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import AppNavigator from './navigation/AppNavigator';
import { supabase } from './utils/supabase';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        {session && session.user ? (
          <AppNavigator initialRouteName="MainApp" />
        ) : (
          <AppNavigator initialRouteName="Landing" />
        )}
      </View>
    </AuthProvider>
  );
} 