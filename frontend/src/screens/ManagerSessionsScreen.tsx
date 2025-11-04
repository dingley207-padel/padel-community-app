import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../services/api';

interface Session {
  id: string;
  title: string;
  description?: string;
  datetime: string;
  location: string;
  max_players: number;
  price: number;
  status: string;
  booked_count: number;
  available_spots: number;
  community_name?: string;
}

interface ManagerSessionsScreenProps {
  onBack: () => void;
  onViewAttendees: (sessionId: string, sessionTitle: string) => void;
  initialTab?: 'active' | 'completed' | 'cancelled';
}

export default function ManagerSessionsScreen({
  onBack,
  onViewAttendees,
  initialTab = 'active',
}: ManagerSessionsScreenProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>(initialTab);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      // Fetch all sessions - we'll filter client-side by datetime
      const response = await api.getManagerSessions(undefined);
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
  };

  const formatDate = (dateString: string) => {
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Dubai',
    });
  };

  const formatTime = (dateString: string) => {
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Dubai',
    }) + ' GST';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#00D4AA';
      case 'completed':
        return '#999';
      case 'cancelled':
        return '#FF6B6B';
      default:
        return '#666';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return getStatusColor(status) + '20';
  };

  const handleCancelSession = async (sessionId: string, sessionTitle: string) => {
    Alert.alert(
      'Cancel Session',
      `Are you sure you want to cancel "${sessionTitle}"? All attendees will be notified.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.cancelSession(sessionId);
              Alert.alert('Success', 'Session cancelled successfully');
              loadSessions();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.response?.data?.error || 'Failed to cancel session'
              );
            }
          },
        },
      ]
    );
  };

  const renderSession = ({ item }: { item: Session }) => {
    const bookedPercentage = (item.booked_count / item.max_players) * 100;
    const isActive = item.status === 'active';

    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleRow}>
            <Text style={styles.sessionTitle}>{item.title}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBadgeColor(item.status) },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.sessionPrice}>AED {item.price}</Text>
        </View>

        {item.community_name && (
          <Text style={styles.sessionCommunity}>{item.community_name}</Text>
        )}

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionDate}>
            📅 {formatDate(item.datetime)} at {formatTime(item.datetime)}
          </Text>
          <Text style={styles.sessionLocation}>📍 {item.location}</Text>
        </View>

        {/* Booking Progress */}
        <View style={styles.bookingProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Bookings</Text>
            <Text style={styles.progressValue}>
              {item.booked_count} / {item.max_players}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${bookedPercentage}%`,
                  backgroundColor: bookedPercentage > 80 ? '#00D4AA' : '#4ECDC4',
                },
              ]}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.viewAttendeesButton}
            onPress={() => onViewAttendees(item.id, item.title)}
          >
            <Text style={styles.viewAttendeesButtonText}>
              👥 View Attendees ({item.booked_count})
            </Text>
          </TouchableOpacity>

          {isActive && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelSession(item.id, item.title)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const filteredSessions = sessions.filter((session) => {
    if (selectedStatus === 'cancelled') {
      return session.status === 'cancelled';
    }

    // For 'active' (Upcoming) and 'completed' (Past), filter by datetime
    const sessionDate = new Date(session.datetime.endsWith('Z') ? session.datetime : session.datetime + 'Z');
    const now = new Date();

    if (selectedStatus === 'active') {
      // Upcoming: future sessions that aren't cancelled
      return sessionDate >= now && session.status !== 'cancelled';
    } else if (selectedStatus === 'completed') {
      // Past: past sessions that aren't cancelled
      return sessionDate < now && session.status !== 'cancelled';
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Sessions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, selectedStatus === 'active' && styles.filterTabActive]}
          onPress={() => setSelectedStatus('active')}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedStatus === 'active' && styles.filterTabTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedStatus === 'completed' && styles.filterTabActive]}
          onPress={() => setSelectedStatus('completed')}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedStatus === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedStatus === 'cancelled' && styles.filterTabActive]}
          onPress={() => setSelectedStatus('cancelled')}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedStatus === 'cancelled' && styles.filterTabTextActive,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00D4AA" />
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#00D4AA"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No sessions found</Text>
              <Text style={styles.emptyText}>
                {selectedStatus === 'active'
                  ? 'Create your first session to get started'
                  : `No ${selectedStatus} sessions`}
              </Text>
            </View>
          }
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 60,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#00D4AA',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    marginBottom: 8,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sessionPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00D4AA',
  },
  sessionCommunity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sessionInfo: {
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  sessionLocation: {
    fontSize: 14,
    color: '#333',
  },
  bookingProgress: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D4AA',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewAttendeesButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#00D4AA',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAttendeesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FF6B6B20',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
