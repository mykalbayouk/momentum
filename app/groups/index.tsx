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
  Image,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Feather from 'react-native-vector-icons/Feather';
import CreateGroupScreen from '../create-group/index';
import { supabase } from '../../utils/supabase';

interface Group {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

interface GroupMember {
  id: string;
  username: string;
  avatar_url: string | null;
  current_streak: number;
}

interface CurrentGroup extends Group {
  members: GroupMember[];
}

interface GroupDetailsProps {
  group: CurrentGroup;
  showJoinButton?: boolean;
  onJoinPress?: () => void;
  containerStyle?: any;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({
  group,
  showJoinButton = false,
  onJoinPress = () => {},
  containerStyle,
}) => {
  return (
    <ScrollView style={[styles.scrollView, containerStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>{group.name}</Text>
        {showJoinButton && (
          <Button
            title="Join Group"
            onPress={onJoinPress}
            style={styles.joinGroupButton}
          />
        )}
      </View>

      <Card variant="elevated" style={styles.groupDetailsCard}>
        <View style={styles.groupImageContainer}>
          {group.image_url ? (
            <Image 
              source={{ uri: group.image_url }} 
              style={styles.currentGroupImage} 
            />
          ) : (
            <View style={styles.currentGroupImagePlaceholder}>
              <Text style={styles.groupImagePlaceholderText}>
                {group.name[0]}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.groupDescription}>{group.description}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Members</Text>
      <View style={styles.membersList}>
        {group.members
          .sort((a, b) => b.current_streak - a.current_streak)
          .map(member => (
            <Card key={member.id} variant="elevated" style={styles.memberCard}>
              <View style={styles.memberContent}>
                <View style={styles.memberImageContainer}>
                  {member.avatar_url ? (
                    <Image source={{ uri: member.avatar_url }} style={styles.memberImage} />
                  ) : (
                    <View style={styles.memberImagePlaceholder}>
                      <Text style={styles.memberImagePlaceholderText}>
                        {member.username[0]}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.streakText}>{member.current_streak} day streak</Text>
                </View>
              </View>
            </Card>
          ))
        }
      </View>
    </ScrollView>
  );
};

export default function GroupsScreen({ onCreateGroupPress }: { onCreateGroupPress: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<CurrentGroup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CurrentGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserGroup();
  }, []);

  const checkUserGroup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Get user's group_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', user.id)
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
            members:profiles!profiles_group_id_fkey(
              id,
              username,
              avatar_url,
              current_streak
            )
          `)
          .eq('id', profile.group_id)
          .single();

        if (groupError) throw groupError;
        setCurrentGroup(groupData);
      } else {
        // User is not in a group, fetch available groups
        const { data: availableGroups, error: groupsError } = await supabase
          .from('groups')
          .select(`
            id,
            name,
            description,
            image_url,
            created_at,
            profiles!profiles_group_id_fkey(count)
          `)
          .order('created_at', { ascending: false });

        if (groupsError) throw groupsError;
        setGroups(availableGroups || []);
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

  const handleJoinWithCode = () => {
    // Join with code will be handled in the next update
    console.log('Attempting to join with code:', groupCode);
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
          members:profiles!profiles_group_id_fkey(
            id,
            username,
            avatar_url,
            current_streak
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
    if (!selectedGroup) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update({ group_id: selectedGroup.id })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh the screen
      setSelectedGroup(null);
      checkUserGroup();
    } catch (error) {
      console.error('Error joining group:', error);
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
          <View style={styles.groupImageContainer}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.groupImage} />
            ) : (
              <View style={styles.groupImagePlaceholder}>
                <Text style={styles.groupImagePlaceholderText}>
                  {item.name[0]}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupTitle}>{item.name}</Text>
            <Text style={styles.groupDescription}>{item.description}</Text>
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
        <GroupDetails group={currentGroup} />
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
              <Feather name="plus" size={20} color={colors.text.inverse} />
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
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter group code"
              value={groupCode}
              onChangeText={setGroupCode}
              placeholderTextColor={colors.text.secondary}
            />
            <Button
              title="Join"
              onPress={handleJoinWithCode}
              style={styles.joinButton}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Available Groups</Text>
        <View style={styles.groupsList}>
          {groups.length === 0 ? (
            <Card variant="elevated" style={styles.emptyCard}>
              <Text style={styles.emptyText}>No groups available</Text>
            </Card>
          ) : (
            groups.map(group => renderGroupItem({ item: group }))
          )}
        </View>
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
    color: colors.text.inverse,
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
    gap: 16,
  },
  groupImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
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
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
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
    borderBottomColor: colors.neutral.grey200,
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
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  // New styles for current group view
  groupDetailsCard: {
    padding: 16,
    marginBottom: 24,
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
}); 