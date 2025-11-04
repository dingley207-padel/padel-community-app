import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface Community {
  id: string;
  name: string;
  location?: string;
}

interface Manager {
  user_id: string;
  user_name: string;
  user_email: string;
}

interface AssignManagerScreenProps {
  onBack: () => void;
}

export default function AssignManagerScreen({ onBack }: AssignManagerScreenProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      loadManagers(selectedCommunity);
    }
  }, [selectedCommunity]);

  const loadCommunities = async () => {
    try {
      const response = await api.getAllCommunities();
      const allComms = response.communities || response.data?.communities || [];
      setCommunities(allComms);
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  };

  const loadManagers = async (communityId: string) => {
    try {
      setIsLoadingManagers(true);
      const response = await api.getCommunityManagers(communityId);
      setManagers(response.managers || []);
    } catch (error) {
      console.error('Error loading managers:', error);
    } finally {
      setIsLoadingManagers(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedCommunity) {
      Alert.alert('Validation Error', 'Please select a community');
      return;
    }

    if (!userEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter a user email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setIsAssigning(true);
    try {
      await api.assignRole(userEmail.trim(), 'community_manager', selectedCommunity);

      Alert.alert(
        'Success',
        `${userEmail} has been assigned as Community Manager`,
        [
          {
            text: 'OK',
            onPress: () => {
              setUserEmail('');
              loadManagers(selectedCommunity);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error assigning manager:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to assign manager. Please try again.'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveManager = (manager: Manager) => {
    Alert.alert(
      'Remove Manager',
      `Are you sure you want to remove ${manager.user_name} as Community Manager?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeRole(manager.user_id, 'community_manager', selectedCommunity);
              Alert.alert('Success', 'Manager removed successfully');
              loadManagers(selectedCommunity);
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to remove manager'
              );
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Manager</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Community Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Community *</Text>
          {communities.map((community) => (
            <TouchableOpacity
              key={community.id}
              style={[
                styles.communityOption,
                selectedCommunity === community.id && styles.communityOptionSelected,
              ]}
              onPress={() => setSelectedCommunity(community.id)}
            >
              <View style={styles.radioButton}>
                {selectedCommunity === community.id && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{community.name}</Text>
                {community.location && (
                  <Text style={styles.communityLocation}>📍 {community.location}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Managers */}
        {selectedCommunity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Managers</Text>
            {isLoadingManagers ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : managers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No managers assigned yet</Text>
              </View>
            ) : (
              managers.map((manager) => (
                <View key={manager.user_id} style={styles.managerCard}>
                  <View style={styles.managerIcon}>
                    <Ionicons name="person" size={24} color="#10B981" />
                  </View>
                  <View style={styles.managerInfo}>
                    <Text style={styles.managerName}>{manager.user_name}</Text>
                    <Text style={styles.managerEmail}>{manager.user_email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveManager(manager)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Assign New Manager */}
        {selectedCommunity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assign New Manager</Text>
            <Text style={styles.helpText}>
              Enter the email address of the user you want to assign as Community Manager
            </Text>

            <TextInput
              style={styles.input}
              value={userEmail}
              onChangeText={setUserEmail}
              placeholder="user@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.assignButton, isAssigning && styles.assignButtonDisabled]}
              onPress={handleAssignManager}
              disabled={isAssigning}
            >
              {isAssigning ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="#FFFFFF" />
                  <Text style={styles.assignButtonText}>Assign as Manager</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#111827',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  communityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  communityOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#065F46',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  communityLocation: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  managerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#065F46',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  managerEmail: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  removeButton: {
    padding: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
    marginBottom: 16,
  },
  assignButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  assignButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
