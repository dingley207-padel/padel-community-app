import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import api from '../services/api';

interface Manager {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_phone?: string;
  user_profile_image?: string;
  role_name: string;
  assigned_at: string;
  assigned_by: string;
  assigned_by_name?: string;
}

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ManageManagersScreenProps {
  communityId: string;
  communityName: string;
  onGoBack: () => void;
}

export default function ManageManagersScreen({
  communityId,
  communityName,
  onGoBack,
}: ManageManagersScreenProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadManagers();
  }, [communityId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const loadManagers = async () => {
    try {
      const response = await api.getCommunityManagers(communityId);
      setManagers(response.managers || []);
    } catch (error: any) {
      console.error('Error loading managers:', error);
      Alert.alert('Error', 'Failed to load managers');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const searchUsers = async () => {
    if (searchTerm.trim().length < 2) return;

    setIsSearching(true);
    try {
      const response = await api.searchUsersForManager(communityId, searchTerm.trim());
      setSearchResults(response.users || []);
    } catch (error: any) {
      console.error('Error searching users:', error);
      if (error.response?.status === 403) {
        Alert.alert('Permission Denied', 'Only community owners can add managers');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssignManager = async (userId: string, userName: string) => {
    Alert.alert(
      'Assign Manager',
      `Assign ${userName} as a community manager?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: async () => {
            try {
              await api.assignCommunityManager(communityId, userId);
              Alert.alert('Success', `${userName} has been assigned as a manager`);
              setSearchTerm('');
              setSearchResults([]);
              loadManagers();
            } catch (error: any) {
              console.error('Error assigning manager:', error);
              const message = error.response?.data?.error || 'Failed to assign manager';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const handleRevokeManager = async (userId: string, userName: string, roleName: string) => {
    if (roleName === 'community_owner') {
      Alert.alert('Cannot Revoke', 'Community owners cannot be removed. Only super admins can revoke owner roles.');
      return;
    }

    Alert.alert(
      'Revoke Manager',
      `Remove ${userName} as a community manager?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.revokeCommunityManager(communityId, userId);
              Alert.alert('Success', `${userName} has been removed as a manager`);
              loadManagers();
            } catch (error: any) {
              console.error('Error revoking manager:', error);
              const message = error.response?.data?.error || 'Failed to revoke manager';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadManagers();
  };

  const formatRoleName = (roleName: string) => {
    return roleName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerSubtitle}>{communityName}</Text>
          <Text style={styles.headerTitle}>Manage Managers</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#00D4AA"
          />
        }
      >
        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Manager</Text>
          <Text style={styles.sectionDescription}>
            Search by name, email, or phone to add a community manager
          </Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
            />
            {isSearching && (
              <ActivityIndicator
                size="small"
                color="#00D4AA"
                style={styles.searchLoader}
              />
            )}
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.searchResultItem}
                  onPress={() => handleAssignManager(user.id, user.name)}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{user.name}</Text>
                    {user.email && (
                      <Text style={styles.searchResultDetail}>{user.email}</Text>
                    )}
                    {user.phone && (
                      <Text style={styles.searchResultDetail}>{user.phone}</Text>
                    )}
                  </View>
                  <Text style={styles.addButton}>+ Add</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Current Managers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Current Managers ({managers.length})
          </Text>
          <Text style={styles.sectionDescription}>
            Community owners and managers who can manage sessions
          </Text>

          {managers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No managers assigned yet
              </Text>
            </View>
          ) : (
            <View style={styles.managersList}>
              {managers.map((manager) => (
                <View key={manager.id} style={styles.managerCard}>
                  <View style={styles.managerHeader}>
                    <View style={styles.managerInfo}>
                      <Text style={styles.managerName}>{manager.user_name}</Text>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          {formatRoleName(manager.role_name)}
                        </Text>
                      </View>
                    </View>
                    {manager.role_name === 'community_manager' && (
                      <TouchableOpacity
                        style={styles.revokeButton}
                        onPress={() =>
                          handleRevokeManager(
                            manager.user_id,
                            manager.user_name,
                            manager.role_name
                          )
                        }
                      >
                        <Text style={styles.revokeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {(manager.user_email || manager.user_phone) && (
                    <View style={styles.managerContact}>
                      {manager.user_email && (
                        <Text style={styles.managerContactText}>
                          {manager.user_email}
                        </Text>
                      )}
                      {manager.user_phone && (
                        <Text style={styles.managerContactText}>
                          {manager.user_phone}
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={styles.managerMeta}>
                    <Text style={styles.managerMetaText}>
                      Assigned: {formatDate(manager.assigned_at)}
                    </Text>
                    {manager.assigned_by_name && (
                      <Text style={styles.managerMetaText}>
                        By: {manager.assigned_by_name}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  searchLoader: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  searchResults: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  searchResultDetail: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
  },
  managersList: {
    gap: 12,
  },
  managerCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  managerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  revokeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  revokeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  managerContact: {
    marginTop: 8,
  },
  managerContactText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  managerMeta: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  managerMetaText: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
