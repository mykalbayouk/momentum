import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Feather from 'react-native-vector-icons/Feather';
import CreateGroupScreen from '../create-group/index';
import { supabase } from '../../utils/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import GroupCodeInput from '../../components/GroupCodeInput';
import ImageViewer from '../../components/ImageViewer';
import ProfileModal from '../../components/ProfileModal';

interface Profile {
  id: string;
  group_id: string | null;
  username: string;
  avatar_url: string | null;
  current_streak: number;
}

interface Group {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
  code: string;
}

interface GroupMember {
  id: string;
  username: string;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  weekly_goal: number;
  workout_logs: {
    completed_at: string;
    is_rest_day: boolean;
  }[];
}

interface CurrentGroup extends Group {
  members: GroupMember[];
}

interface GroupDetailsProps {
  group: CurrentGroup;
  showJoinButton?: boolean;
  onJoinPress?: () => void;
  onLeavePress?: () => void;
  showLeaveButton?: boolean;
  containerStyle?: any;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({
  group,
  showJoinButton = false,
  showLeaveButton = false,
  onJoinPress = () => {},
  onLeavePress = () => {},
  containerStyle,
}) => {
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

  return (
    <ScrollView style={[styles.scrollView, containerStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>{group.name}</Text>
        <View style={styles.headerButtons}>
          {showJoinButton && (
            <Button
              title="Join Group"
              onPress={onJoinPress}
              style={styles.joinGroupButton}
            />
          )}
          {showLeaveButton && (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={onLeavePress}
            >
              <Text style={styles.leaveButtonText}>Leave Group</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Card variant="elevated" style={styles.groupDetailsCard}>
        <View style={styles.currentGroupImageContainer}>
          <ImageViewer
            url={group.image_url}
            size={120}
            placeholder={group.name[0]}
          />
        </View>
        <Text style={styles.groupDescription}>{group.description}</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Group Code:</Text>
          <Text style={styles.codeText}>{group.code}</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Members</Text>
      <View style={styles.membersList}>
        {group.members
          .sort((a, b) => b.current_streak - a.current_streak)
          .map(member => (
            <TouchableOpacity
              key={member.id}
              onPress={() => setSelectedMember(member)}
            >
              <Card variant="elevated" style={styles.memberCard}>
                <View style={styles.memberContent}>
                  <ImageViewer
                    url={member.avatar_url}
                    size={48}
                    placeholder={member.username[0]}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.username}</Text>
                    <Text style={styles.streakText}>{member.current_streak} day streak</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        }
      </View>

      <ProfileModal
        visible={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        user={{
          username: selectedMember?.username || '',
          profilePicture: selectedMember?.avatar_url || undefined,
          currentStreak: selectedMember?.current_streak || 0,
          longestStreak: selectedMember?.longest_streak || 0,
          weekly_goal: selectedMember?.weekly_goal || 0,
          workouts: selectedMember?.workout_logs || [],
        }}
      />
    </ScrollView>
  );
};

export default function GroupsScreen({ onCreateGroupPress }: { onCreateGroupPress?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<CurrentGroup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CurrentGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial user and set up auth subscription
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        async (payload: RealtimePostgresChangesPayload<Profile>) => {
          const newProfile = payload.new as Profile;
          if (newProfile.group_id) {
            // User joined/switched groups
            const { data: groupData, error: groupError } = await supabase
              .from('groups')
              .select(`
                id,
                name,
                description,
                image_url,
                created_at,
                code,
                members:profiles!profiles_group_id_fkey(
                  id,
                  username,
                  avatar_url,
                  current_streak,
                  longest_streak,
                  weekly_goal,
                  workout_logs (
                    completed_at,
                    is_rest_day
                  )
                )
              `)
              .eq('id', newProfile.group_id)
              .single();

            if (!groupError && groupData) {
              setCurrentGroup(groupData);
              setGroups([]);
            }
          } else {
            // User left group
            setCurrentGroup(null);
            fetchAvailableGroups();
          }
        }
      )
      .subscribe();

    // Subscribe to group member changes when in a group
    let groupSubscription: RealtimeChannel | null = null;
    if (currentGroup) {
      groupSubscription = supabase
        .channel('group-member-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `group_id=eq.${currentGroup.id}`,
          },
          async () => {
            // Refresh group data when members change
            const { data: groupData, error: groupError } = await supabase
              .from('groups')
              .select(`
                id,
                name,
                description,
                image_url,
                created_at,
                code,
                members:profiles!profiles_group_id_fkey(
                  id,
                  username,
                  avatar_url,
                  current_streak,
                  longest_streak,
                  weekly_goal,
                  workout_logs (
                    completed_at,
                    is_rest_day
                  )
                )
              `)
              .eq('id', currentGroup.id)
              .single();

            if (!groupError && groupData) {
              setCurrentGroup(groupData);
            }
          }
        )
        .subscribe();
    }

    // Initial data fetch
    checkUserGroup();

    return () => {
      profileSubscription.unsubscribe();
      if (groupSubscription) {
        groupSubscription.unsubscribe();
      }
    };
  }, [userId, currentGroup?.id]);

  const fetchAvailableGroups = async () => {
    const { data: availableGroups, error: groupsError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        image_url,
        created_at,
        code,
        profiles!profiles_group_id_fkey(count)
      `)
      .order('created_at', { ascending: false });

    if (!groupsError) {
      setGroups(availableGroups || []);
    }
  };

  const checkUserGroup = async () => {
    try {
      if (!userId) return;

      // Get user's group_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (profile?.group_id) {
        // User is in a group, fetch group details and members
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select(`
            id,
            name,
            description,
            image_url,
            created_at,
            code,
            members:profiles!profiles_group_id_fkey(
              id,
              username,
              avatar_url,
              current_streak,
              longest_streak,
              weekly_goal,
              workout_logs (
                completed_at,
                is_rest_day
              )
            )
          `)
          .eq('id', profile.group_id)
          .single();

        if (groupError) throw groupError;
        setCurrentGroup(groupData);
      } else {
        await fetchAvailableGroups();
      }
    } catch (error) {
      console.error('Error checking user group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Search will be handled in the next update
  };

  const handleJoinGroup = async (group: Group) => {
    try {
      // Fetch full group details including members
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          image_url,
          created_at,
          code,
          members:profiles!profiles_group_id_fkey(
            id,
            username,
            avatar_url,
            current_streak,
            longest_streak,
            weekly_goal,
            workout_logs (
              completed_at,
              is_rest_day
            )
          )
        `)
        .eq('id', group.id)
        .single();

      if (groupError) throw groupError;
      setSelectedGroup(groupData);
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const handleConfirmJoin = async () => {
    if (!selectedGroup || !userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ group_id: selectedGroup.id })
        .eq('id', userId);

      if (error) throw error;
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ group_id: null })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleJoinGroup(item)}
    >
      <Card
        variant="elevated"
        style={styles.groupCard}
      >
        <View style={styles.groupContent}>
          <ImageViewer
            url={item.image_url}
            size={60}
            placeholder={item.name[0]}
          />
          <View style={styles.groupInfo}>
            <Text style={styles.groupTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.groupDescription} numberOfLines={2}>{item.description}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  if (currentGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <GroupDetails 
          group={currentGroup} 
          showLeaveButton={true}
          onLeavePress={handleLeaveGroup}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={onCreateGroupPress}
          >
            <View style={styles.createButtonContent}>
              <Feather name="plus" size={20} color={colors.text.primary} />
              <Text style={styles.createButtonText}>Create Group</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Card variant="elevated" style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.text.secondary}
          />
        </Card>

        <Card variant="elevated" style={styles.codeCard}>
          <Text style={styles.sectionTitle}>Have a Group Code?</Text>
          <GroupCodeInput
            userId={userId || ''}
            onJoinSuccess={() => {
              setSelectedGroup(null);
            }}
          />
        </Card>

        <Text style={styles.sectionTitle}>Available Groups</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary.main} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : groups === null || groups.length === 0 ? (
          <Card variant="elevated" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No available groups</Text>
            <Text style={styles.emptySubtext}>Create or join a group to get started</Text>
          </Card>
        ) : (
          groups.map(group => renderGroupItem({ item: group }))
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Group</Text>
            <TouchableOpacity 
              onPress={() => setShowCreateModal(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <CreateGroupScreen onClose={() => setShowCreateModal(false)} />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={!!selectedGroup}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Details</Text>
            <TouchableOpacity 
              onPress={() => setSelectedGroup(null)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          {selectedGroup && (
            <GroupDetails
              group={selectedGroup}
              showJoinButton={true}
              onJoinPress={handleConfirmJoin}
              containerStyle={styles.modalContent}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  createButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  searchCard: {
    marginBottom: 16,
    padding: 16,
  },
  searchInput: {
    fontSize: 16,
    color: colors.text.primary,
  },
  codeCard: {
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
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
  joinGroupButton: {
    minWidth: 120,
  },
  groupsList: {
    gap: 16,
  },
  groupCard: {
    padding: 16,
  },
  groupContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  groupImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.neutral.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  groupImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupImagePlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  groupInfo: {
    flex: 1,
    gap: 4,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.grey800,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 24,
  },
  // New styles for current group view
  groupDetailsCard: {
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  currentGroupImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    alignSelf: 'center',
    backgroundColor: colors.neutral.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentGroupImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  currentGroupImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.neutral.grey200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    padding: 12,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  memberImage: {
    width: '100%',
    height: '100%',
  },
  memberImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberImagePlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  streakText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: colors.semantic.error.main,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leaveButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  codeContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.primary.light,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.dark,
    marginRight: 8,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.main,
    letterSpacing: 3,
  },
}); 