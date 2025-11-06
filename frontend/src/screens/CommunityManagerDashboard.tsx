import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Community {
  id: string;
  name: string;
  description?: string;
  location?: string;
}

interface CommunityManagerDashboardProps {
  onNavigateToCreateSession: () => void;
  onNavigateToProfile: () => void;
  onNavigateToViewSessions: (initialTab?: 'active' | 'completed' | 'cancelled') => void;
  onNavigateToMembers: (communityId: string) => void;
  onNavigateToCommunities?: () => void;
  onNavigateToAssignManager?: () => void;
  onNavigateToEditCommunity: (communityId: string) => void;
  onNavigateToSendNotification: (communityId: string, communityName: string) => void;
  onSwitchRole: () => void;
  onNavigateToSubCommunities: (communityId: string, communityName: string) => void;
  onNavigateToSessionTemplates: (communityId: string, communityName: string) => void;
  onNavigateToManageManagers?: (communityId: string, communityName: string) => void;
}

export default function CommunityManagerDashboard({
  onNavigateToCreateSession,
  onNavigateToProfile,
  onNavigateToViewSessions,
  onNavigateToMembers,
  onNavigateToCommunities,
  onNavigateToAssignManager,
  onNavigateToEditCommunity,
  onNavigateToSendNotification,
  onSwitchRole,
  onNavigateToSubCommunities,
  onNavigateToSessionTemplates,
  onNavigateToManageManagers,
}: CommunityManagerDashboardProps) {
  const { user, selectedRole, logout } = useAuth();
  const [managedCommunities, setManagedCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const communitiesData = await api.getManagedCommunities();
      const communities = communitiesData.communities || [];
      setManagedCommunities(communities);

      // Auto-select first community if available
      if (communities.length > 0 && !selectedCommunity) {
        setSelectedCommunity(communities[0]);
      }
    } catch (error) {
      console.error('Error loading manager data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setShowMenu(false);
          },
        },
      ]
    );
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
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSubtitle}>
            {selectedRole
              ? selectedRole.split('_').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
              : 'Dashboard'}
          </Text>
          <Text style={styles.headerTitle}>Welcome, {user?.name}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={onSwitchRole}
            style={styles.switchRoleButton}
          >
            <Text style={styles.switchRoleButtonText}>Switch Role</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNavigateToProfile}
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            style={styles.menuButton}
          >
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
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
        {/* Community Selector */}
        {managedCommunities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Community</Text>
            <TouchableOpacity
              style={styles.communitySelector}
              onPress={() => managedCommunities.length > 1 && setShowCommunitySelector(true)}
              disabled={managedCommunities.length <= 1}
            >
              <View style={styles.communitySelectorLeft}>
                <Text style={styles.communitySelectorEmoji}>🏘️</Text>
                <View>
                  <Text style={styles.communitySelectorName}>
                    {selectedCommunity?.name || 'Select Community'}
                  </Text>
                  {selectedCommunity?.location && (
                    <Text style={styles.communitySelectorLocation}>
                      📍 {selectedCommunity.location}
                    </Text>
                  )}
                </View>
              </View>
              {managedCommunities.length > 1 && (
                <Text style={styles.dropdownArrow}>▼</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions - Larger Buttons */}
        {selectedCommunity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.largeActionButton}
              onPress={onNavigateToCreateSession}
              activeOpacity={0.7}
            >
              <Text style={styles.largeActionEmoji}>➕</Text>
              <Text style={styles.largeActionTitle}>Create Match</Text>
              <Text style={styles.largeActionDescription}>
                Schedule a new padel match
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.largeActionButton}
              onPress={() => onNavigateToViewSessions()}
              activeOpacity={0.7}
            >
              <Text style={styles.largeActionEmoji}>📋</Text>
              <Text style={styles.largeActionTitle}>View Matches</Text>
              <Text style={styles.largeActionDescription}>
                Manage your matches
              </Text>
            </TouchableOpacity>

            {onNavigateToCommunities && (
              <TouchableOpacity
                style={styles.largeActionButton}
                onPress={onNavigateToCommunities}
                activeOpacity={0.7}
              >
                <Text style={styles.largeActionEmoji}>🏘️</Text>
                <Text style={styles.largeActionTitle}>Manage Communities</Text>
                <Text style={styles.largeActionDescription}>
                  Create and manage communities
                </Text>
              </TouchableOpacity>
            )}

            {onNavigateToAssignManager && (
              <TouchableOpacity
                style={styles.largeActionButton}
                onPress={onNavigateToAssignManager}
                activeOpacity={0.7}
              >
                <Text style={styles.largeActionEmoji}>👤</Text>
                <Text style={styles.largeActionTitle}>Assign Manager</Text>
                <Text style={styles.largeActionDescription}>
                  Assign community managers
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Community Management - Grid Layout */}
        {selectedCommunity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Community Management</Text>

            <View style={styles.gridContainer}>
              <TouchableOpacity
                style={styles.gridButton}
                onPress={() => onNavigateToSubCommunities(selectedCommunity.id, selectedCommunity.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.gridButtonEmoji}>📍</Text>
                <Text style={styles.gridButtonText}>Sub-Communities</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridButton}
                onPress={() => onNavigateToSessionTemplates(selectedCommunity.id, selectedCommunity.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.gridButtonEmoji}>📅</Text>
                <Text style={styles.gridButtonText}>Match Templates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridButton}
                onPress={() => onNavigateToMembers(selectedCommunity.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.gridButtonEmoji}>👤</Text>
                <Text style={styles.gridButtonText}>Members</Text>
              </TouchableOpacity>

              {onNavigateToManageManagers && (
                <TouchableOpacity
                  style={styles.gridButton}
                  onPress={() => onNavigateToManageManagers(selectedCommunity.id, selectedCommunity.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.gridButtonEmoji}>🔐</Text>
                  <Text style={styles.gridButtonText}>Permissions</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.gridButton}
                onPress={() => onNavigateToSendNotification(selectedCommunity.id, selectedCommunity.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.gridButtonEmoji}>📢</Text>
                <Text style={styles.gridButtonText}>Send Notification</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridButton}
                onPress={() => onNavigateToEditCommunity(selectedCommunity.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.gridButtonEmoji}>✏️</Text>
                <Text style={styles.gridButtonText}>Edit Community</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Empty State */}
        {managedCommunities.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏘️</Text>
            <Text style={styles.emptyText}>No communities assigned</Text>
            <Text style={styles.emptySubtext}>
              {onNavigateToCommunities
                ? 'Get started by creating your first community'
                : 'Contact a super admin to get assigned to a community'}
            </Text>
            {onNavigateToCommunities && (
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={onNavigateToCommunities}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyActionText}>Manage Communities</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Community Selector Modal */}
      <Modal
        visible={showCommunitySelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommunitySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Community</Text>
              <TouchableOpacity
                onPress={() => setShowCommunitySelector(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {managedCommunities.map((community) => (
                <TouchableOpacity
                  key={community.id}
                  style={[
                    styles.modalCommunityItem,
                    selectedCommunity?.id === community.id && styles.modalCommunityItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCommunity(community);
                    setShowCommunitySelector(false);
                  }}
                >
                  <Text style={styles.modalCommunityEmoji}>🏘️</Text>
                  <View style={styles.modalCommunityInfo}>
                    <Text style={styles.modalCommunityName}>{community.name}</Text>
                    {community.location && (
                      <Text style={styles.modalCommunityLocation}>
                        📍 {community.location}
                      </Text>
                    )}
                  </View>
                  {selectedCommunity?.id === community.id && (
                    <Text style={styles.modalCommunityCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={styles.menuItemText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  switchRoleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  switchRoleButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  profileButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#00D4AA',
    borderRadius: 8,
  },
  profileButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContent: {
    backgroundColor: 'white',
    marginTop: 60,
    marginRight: 20,
    borderRadius: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  communitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  communitySelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  communitySelectorEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  communitySelectorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  communitySelectorLocation: {
    fontSize: 13,
    color: '#666',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#999',
  },
  largeActionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  largeActionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  largeActionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  largeActionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gridButton: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridButtonEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  gridButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  modalScroll: {
    padding: 16,
  },
  modalCommunityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
  },
  modalCommunityItemSelected: {
    backgroundColor: '#00D4AA20',
    borderWidth: 2,
    borderColor: '#00D4AA',
  },
  modalCommunityEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  modalCommunityInfo: {
    flex: 1,
  },
  modalCommunityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  modalCommunityLocation: {
    fontSize: 13,
    color: '#666',
  },
  modalCommunityCheck: {
    fontSize: 24,
    color: '#00D4AA',
    fontWeight: 'bold',
  },
});
