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
  onEditSession: (sessionId: string) => void;
  onSendNotification: (sessionId: string, sessionTitle: string, attendeeCount: number) => void;
  initialTab?: 'active' | 'completed' | 'cancelled';
}

export default function ManagerSessionsScreen({
  onBack,
  onViewAttendees,
  onEditSession,
  onSendNotification,
  initialTab = 'active',
}: ManagerSessionsScreenProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>(initialTab);

  useEffect(() => {
    loadSessions();
  }, []);

  // Update selected status when initialTab changes
  useEffect(() => {
    setSelectedStatus(initialTab);
  }, [initialTab]);

  const loadSessions = async () => {
    try {
      // Fetch all sessions - we'll filter client-side by datetime
      const response = await api.getManagerSessions(undefined);
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load matches');
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
      'Cancel Match',
      `Are you sure you want to cancel "${sessionTitle}"? All attendees will be notified.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.cancelSession(sessionId);
              Alert.alert('Success', 'Match cancelled successfully');
              loadSessions();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.response?.data?.error || 'Failed to cancel match'
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
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.matchTitleRow}>
            <Text style={styles.matchTitle}>{item.title}</Text>
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
        </View>

        {item.community_name && (
          <Text style={styles.matchCommunity}>{item.community_name}</Text>
        )}

        <View style={styles.matchInfoContainer}>
          <View style={styles.matchInfoRow}>
            <Text style={styles.matchInfoIcon}>📅</Text>
            <Text style={styles.matchInfoText}>
              {formatDate(item.datetime)} at {formatTime(item.datetime)}
            </Text>
          </View>
          <View style={styles.matchInfoRow}>
            <Text style={styles.matchInfoIcon}>📍</Text>
            <Text style={styles.matchInfoText}>{item.location}</Text>
          </View>
          <View style={styles.matchInfoRow}>
            <Text style={styles.matchInfoIcon}>💰</Text>
            <Text style={styles.matchPriceText}>AED {item.price}</Text>
          </View>
        </View>

        {/* Booking Progress */}
        <View style={styles.bookingProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Players</Text>
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
        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={styles.viewAttendeesButton}
            onPress={() => onViewAttendees(item.id, item.title)}
          >
            <Text style={styles.viewAttendeesButtonText}>
              View Players ({item.booked_count})
            </Text>
          </TouchableOpacity>

          {isActive && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEditSession(item.id)}
              >
                <Text style={styles.editButtonText}>Edit Match</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelSession(item.id, item.title)}
              >
                <Text style={styles.cancelButtonText}>Cancel Match</Text>
              </TouchableOpacity>
            </View>
          )}

          {isActive && item.booked_count > 0 && (
            <TouchableOpacity
              style={styles.notifyButton}
              onPress={() => onSendNotification(item.id, item.title, item.booked_count)}
            >
              <Text style={styles.notifyButtonText}>Send Notification</Text>
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
      {/* Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Matches</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Pills/Chips */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterPill, selectedStatus === 'active' && styles.filterPillActive]}
          onPress={() => setSelectedStatus('active')}
        >
          <Text
            style={[
              styles.filterPillText,
              selectedStatus === 'active' && styles.filterPillTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, selectedStatus === 'completed' && styles.filterPillActive]}
          onPress={() => setSelectedStatus('completed')}
        >
          <Text
            style={[
              styles.filterPillText,
              selectedStatus === 'completed' && styles.filterPillTextActive,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, selectedStatus === 'cancelled' && styles.filterPillActive]}
          onPress={() => setSelectedStatus('cancelled')}
        >
          <Text
            style={[
              styles.filterPillText,
              selectedStatus === 'cancelled' && styles.filterPillTextActive,
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
              <Text style={styles.emptyIcon}>🎾</Text>
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptyText}>
                {selectedStatus === 'active'
                  ? 'Create your first match to get started'
                  : `No ${selectedStatus} matches`}
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
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 60,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterPillActive: {
    backgroundColor: '#00D4AA',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterPillTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  matchHeader: {
    marginBottom: 12,
  },
  matchTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  matchCommunity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  matchInfoContainer: {
    marginBottom: 16,
    gap: 8,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchInfoIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
  },
  matchInfoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  matchPriceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D4AA',
  },
  bookingProgress: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00D4AA',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  actionsColumn: {
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  viewAttendeesButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    alignItems: 'center',
  },
  viewAttendeesButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  editButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#4ECDC420',
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FF6B6B20',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  notifyButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FF9F4020',
    borderRadius: 12,
    alignItems: 'center',
  },
  notifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9F40',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
