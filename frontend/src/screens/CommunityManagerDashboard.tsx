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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Community {
  id: string;
  name: string;
  description?: string;
  location?: string;
}

interface Stats {
  upcomingSessions: number;
  pastSessions: number;
  totalBookings: number;
  totalRevenue: number;
  totalMembers: number;
  pendingCancellations: number;
}

interface CommunityManagerDashboardProps {
  onNavigateToCreateSession: () => void;
  onNavigateToProfile: () => void;
  onNavigateToViewSessions: (initialTab?: 'active' | 'completed' | 'cancelled') => void;
  onNavigateToMembers: () => void;
  onNavigateToCommunities?: () => void;
  onNavigateToAssignManager?: () => void;
  onNavigateToEditCommunity: (communityId: string) => void;
  onNavigateToSendNotification: () => void;
  onSwitchRole: () => void;
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
}: CommunityManagerDashboardProps) {
  const { user, userRoles, selectedRole } = useAuth();
  const [managedCommunities, setManagedCommunities] = useState<Community[]>([]);
  const [stats, setStats] = useState<Stats>({
    upcomingSessions: 0,
    pastSessions: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalMembers: 0,
    pendingCancellations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [communitiesData, statsData] = await Promise.all([
        api.getManagedCommunities(),
        api.getManagerStats(),
      ]);
      setManagedCommunities(communitiesData.communities || []);
      setStats(statsData.stats || {
        upcomingSessions: 0,
        pastSessions: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalMembers: 0,
        pendingCancellations: 0,
      });
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
        <View>
          <Text style={styles.headerSubtitle}>
            {selectedRole
              ? selectedRole.split('_').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
              : 'Dashboard'}
          </Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
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
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{user?.name}</Text>
          <Text style={styles.welcomeDescription}>
            Manage your communities and sessions
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToCreateSession}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>➕</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Create Session</Text>
              <Text style={styles.actionDescription}>
                Schedule a new padel session
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToViewSessions}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>📋</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>View Sessions</Text>
              <Text style={styles.actionDescription}>
                Manage your sessions
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          {onNavigateToCommunities && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateToCommunities}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>🏘️</Text>
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Manage Communities</Text>
                <Text style={styles.actionDescription}>
                  Create and manage communities
                </Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          )}

          {onNavigateToAssignManager && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateToAssignManager}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>👤</Text>
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Assign Manager</Text>
                <Text style={styles.actionDescription}>
                  Assign community managers
                </Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToSendNotification}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>📢</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Send Notification</Text>
              <Text style={styles.actionDescription}>
                Notify community members
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Managed Communities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Communities</Text>

          {managedCommunities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏘️</Text>
              <Text style={styles.emptyText}>No communities assigned</Text>
              <Text style={styles.emptySubtext}>
                Contact a super admin to get assigned to a community
              </Text>
            </View>
          ) : (
            managedCommunities.map((community) => (
              <View key={community.id} style={styles.communityCard}>
                <View style={styles.communityIcon}>
                  <Text style={styles.communityEmoji}>🏘️</Text>
                </View>
                <View style={styles.communityInfo}>
                  <Text style={styles.communityName}>{community.name}</Text>
                  {community.location && (
                    <Text style={styles.communityLocation}>
                      📍 {community.location}
                    </Text>
                  )}
                  {community.description && (
                    <Text style={styles.communityDescription}>
                      {community.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => onNavigateToEditCommunity(community.id)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => onNavigateToViewSessions('active')}
            >
              <Text style={styles.statValue}>{stats.upcomingSessions}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => onNavigateToViewSessions('completed')}
            >
              <Text style={styles.statValue}>{stats.pastSessions}</Text>
              <Text style={styles.statLabel}>Past</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={onNavigateToMembers}
            >
              <Text style={styles.statValue}>{stats.totalMembers}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>AED {stats.totalRevenue.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>

          {stats.pendingCancellations > 0 && (
            <TouchableOpacity style={styles.pendingCancellationsCard} onPress={() => {}}>
              <View style={styles.pendingCancellationsHeader}>
                <Text style={styles.pendingCancellationsIcon}>⏳</Text>
                <View style={styles.pendingCancellationsInfo}>
                  <Text style={styles.pendingCancellationsTitle}>
                    {stats.pendingCancellations} Pending Cancellation{stats.pendingCancellations > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.pendingCancellationsDescription}>
                    Review and approve conditional cancellation requests
                  </Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
              </View>
            </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
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
  content: {
    flex: 1,
  },
  welcomeCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#00D4AA',
    borderRadius: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: '#999',
  },
  actionArrow: {
    fontSize: 28,
    color: '#CCC',
    fontWeight: '300',
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  communityEmoji: {
    fontSize: 24,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  communityLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  communityDescription: {
    fontSize: 12,
    color: '#999',
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  pendingCancellationsCard: {
    marginTop: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  pendingCancellationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingCancellationsIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  pendingCancellationsInfo: {
    flex: 1,
  },
  pendingCancellationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  pendingCancellationsDescription: {
    fontSize: 13,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
