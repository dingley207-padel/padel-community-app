import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import api from '../services/api';

interface User {
  name: string;
  email: string;
  phone: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

interface Booking {
  id: string;
  user_id: string;
  session_id: string;
  booked_at: string;
  status: string;
  users: User;
  payments: Payment[];
}

interface Session {
  id: string;
  title: string;
  datetime: string;
  location: string;
  max_players: number;
  price: number;
}

interface SessionAttendeesScreenProps {
  sessionId: string;
  sessionTitle: string;
  onBack: () => void;
  onSendNotifications?: (sessionId: string, bookings: Booking[]) => void;
}

export default function SessionAttendeesScreen({
  sessionId,
  sessionTitle,
  onBack,
  onSendNotifications,
}: SessionAttendeesScreenProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    try {
      const [bookingsData, sessionData] = await Promise.all([
        api.getSessionBookings(sessionId),
        api.getSession(sessionId),
      ]);

      setBookings(bookingsData.bookings || []);
      setSession(sessionData.session);
    } catch (error) {
      console.error('Error loading attendees:', error);
      Alert.alert('Error', 'Failed to load match attendees');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getPaymentStatus = (payments: Payment[]) => {
    if (!payments || payments.length === 0) return 'No Payment';
    const latestPayment = payments[0];
    return latestPayment.status === 'succeeded' ? 'Paid' : 'Pending';
  };

  const getPaymentStatusColor = (payments: Payment[]) => {
    if (!payments || payments.length === 0) return '#999';
    const latestPayment = payments[0];
    return latestPayment.status === 'succeeded' ? '#00D4AA' : '#FF6B6B';
  };

  const handleSendNotifications = () => {
    if (onSendNotifications && bookings.length > 0) {
      Alert.alert(
        'Send Notifications',
        `Send notification to all ${bookings.length} attendees?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: () => onSendNotifications(sessionId, bookings),
          },
        ]
      );
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.attendeeCard}>
      <View style={styles.attendeeHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.users?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.attendeeInfo}>
          <Text style={styles.attendeeName}>{item.users?.name || 'Unknown'}</Text>
          <Text style={styles.attendeePhone}>{item.users?.phone}</Text>
        </View>
        <View
          style={[
            styles.paymentBadge,
            { backgroundColor: getPaymentStatusColor(item.payments) + '15' },
          ]}
        >
          <Text
            style={[
              styles.paymentText,
              { color: getPaymentStatusColor(item.payments) },
            ]}
          >
            {getPaymentStatus(item.payments)}
          </Text>
        </View>
      </View>

      <View style={styles.attendeeDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Booked</Text>
          <Text style={styles.detailValue}>
            {formatDate(item.booked_at)} at {formatTime(item.booked_at)}
          </Text>
        </View>

        {item.payments && item.payments.length > 0 && item.payments[0].status === 'succeeded' && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>AED {item.payments[0].amount}</Text>
          </View>
        )}

        {item.users?.email && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{item.users.email}</Text>
          </View>
        )}
      </View>
    </View>
  );

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
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Attendees</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Match Info Card */}
      <View style={styles.matchInfoCard}>
        <Text style={styles.matchTitle}>{sessionTitle}</Text>
        {session && (
          <>
            <View style={styles.matchDetailsRow}>
              <Text style={styles.matchDetail}>
                {formatDate(session.datetime)} at {formatTime(session.datetime)}
              </Text>
              <Text style={styles.matchDetailSeparator}>•</Text>
              <Text style={styles.matchDetail}>{session.location}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{bookings.length}</Text>
                <Text style={styles.statLabel}>Booked</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{session.max_players}</Text>
                <Text style={styles.statLabel}>Capacity</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {session.max_players - bookings.length}
                </Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {bookings.length * session.price}
                </Text>
                <Text style={styles.statLabel}>Revenue (AED)</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Large Action Button */}
      {onSendNotifications && bookings.length > 0 && (
        <TouchableOpacity
          onPress={handleSendNotifications}
          style={styles.notifyButton}
        >
          <Text style={styles.notifyButtonText}>Send Notifications to All</Text>
        </TouchableOpacity>
      )}

      {/* Attendees Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {bookings.length} {bookings.length === 1 ? 'Attendee' : 'Attendees'}
        </Text>
      </View>

      {/* Attendees List */}
      <FlatList
        data={bookings}
        renderItem={renderBooking}
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
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Attendees Yet</Text>
            <Text style={styles.emptyText}>
              Attendees will appear here once they book this match
            </Text>
          </View>
        }
      />
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

  // Compact Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  headerRight: {
    width: 50,
  },

  // Match Info Card
  matchInfoCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  matchDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  matchDetail: {
    fontSize: 14,
    color: '#666',
  },
  matchDetailSeparator: {
    fontSize: 14,
    color: '#CCC',
    marginHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00D4AA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Large Action Button
  notifyButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // List Content
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // Modern Attendee Cards
  attendeeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  attendeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  attendeePhone: {
    fontSize: 14,
    color: '#666',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Attendee Details
  attendeeDetails: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // Empty State
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
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
