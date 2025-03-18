import React, { useState } from 'react';
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
} from 'react-native';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Feather from 'react-native-vector-icons/Feather';
import CreateGroupScreen from '../create-group/index';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/types';

// Sample data for existing groups
const sampleGroups = [
  {
    id: '1',
    title: 'Morning Runners',
    description: 'Early morning running group',
    members: 12,
    activeDays: 5,
    imageUri: null,
  },
  {
    id: '2',
    title: 'Weekend Warriors',
    description: 'Weekend workout enthusiasts',
    members: 8,
    activeDays: 2,
    imageUri: null,
  },
  {
    id: '3',
    title: 'Daily Fitness',
    description: 'Daily workout motivation group',
    members: 15,
    activeDays: 7,
    imageUri: null,
  },
];

interface GroupsScreenProps {
  onCreateGroupPress: () => void;
}

export default function GroupsScreen({ onCreateGroupPress }: GroupsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [groups, setGroups] = useState(sampleGroups);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filteredGroups = sampleGroups.filter(group =>
      group.title.toLowerCase().includes(text.toLowerCase())
    );
    setGroups(filteredGroups);
  };

  const handleJoinWithCode = () => {
    console.log('Attempting to join with code:', groupCode);
  };

  const handleJoinGroup = (group: typeof sampleGroups[0]) => {
    console.log('Joining group:', group);
  };

  const renderGroupItem = ({ item }: { item: typeof sampleGroups[0] }) => (
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
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.groupImage} />
            ) : (
              <View style={styles.groupImagePlaceholder}>
                <Text style={styles.groupImagePlaceholderText}>
                  {item.title[0]}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupTitle}>{item.title}</Text>
            <Text style={styles.groupDescription}>{item.description}</Text>
            <View style={styles.groupStats}>
              <Text style={styles.groupStat}>
                {item.members} members • {item.activeDays} active days
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

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
          {groups.map(group => renderGroupItem({ item: group }))}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
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
  groupsList: {
    gap: 16,
  },
  groupCard: {
    marginBottom: 8,
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
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupStat: {
    fontSize: 12,
    color: colors.text.secondary,
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
  },
}); 