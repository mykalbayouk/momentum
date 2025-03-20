import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import Button from './Button';
import { supabase } from '../utils/supabase';

interface GroupCodeInputProps {
  onJoinSuccess: (groupId: string) => void;
  userId: string;
  containerStyle?: any;
}

export default function GroupCodeInput({ onJoinSuccess, userId, containerStyle }: GroupCodeInputProps) {
  const [groupCode, setGroupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinWithCode = async () => {
    if (!userId || !groupCode.trim()) return;

    // Validate code format
    if (groupCode.trim().length !== 5) {
      Alert.alert('Invalid Code', 'Group code must be 5 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Find group by code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('code', groupCode.trim())
        .single();

      if (groupError) {
        Alert.alert('Error', 'Invalid group code');
        return;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('profiles')
        .update({ group_id: group.id })
        .eq('id', userId);

      if (joinError) {
        Alert.alert('Error', 'Failed to join group');
        return;
      }

      setGroupCode('');
      onJoinSuccess(group.id);
    } catch (error) {
      console.error('Error joining group by code:', error);
      Alert.alert('Error', 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = () => {
    if (groupCode.trim().length === 5) {
      handleJoinWithCode();
    }
  };

  return (
    <View style={[styles.codeInputContainer, containerStyle]}>
      <TextInput
        style={styles.codeInput}
        placeholder="Enter group code"
        value={groupCode}
        onChangeText={setGroupCode}
        placeholderTextColor={colors.text.secondary}
        maxLength={5}
        autoCapitalize="characters"
        onSubmitEditing={handleCodeSubmit}
        returnKeyType="go"
      />
      <Button
        title="Join"
        onPress={handleJoinWithCode}
        style={styles.joinButton}
        disabled={groupCode.trim().length !== 5 || isLoading}
        loading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  codeInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  joinButton: {
    minWidth: 80,
  },
}); 