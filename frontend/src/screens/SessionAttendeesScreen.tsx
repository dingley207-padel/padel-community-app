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
      Alert.alert('Error', 'Failed to load session attendees');
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
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.attendeeIcon}>
          <Text style={styles.attendeeInitial}>
            {item.users?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.attendeeInfo}>
          <Text style={styles.attendeeName}>{item.users?.name || 'Unknown'}</Text>
          <Text style={styles.attendeeContact}>{item.users?.phone}</Text>
          {item.users?.email && (
            <Text style={styles.attendeeContact}>{item.users.email}</Text>
          )}
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booked:</Text>
          <Text style={styles.detailValue}>
            {formatDate(item.booked_at)} at {formatTime(item.booked_at)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment:</Text>
          <View
            style={[
              styles.paymentBadge,
              { backgroundColor: getPaymentStatusColor(item.payments) + '20' },
            ]}
          >
            <Text
              style={[
                styles.paymentStatus,
                { color: getPaymentStatusColor(item.payments) },
              ]}
            >
              {getPaymentStatus(item.payments)}
              {item.payments && item.payments.length > 0 && item.payments[0].status === 'succeeded'
                ? ` (AED ${item.payments[0].amount})`
                : ''}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booking ID:</Text>
          <Text style={styles.detailValueSmall}>{item.id.slice(0, 8)}...</Text>
        </View>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Attendees
        </Text>
        {onSendNotifications && bookings.length > 0 && (
          <TouchableOpacity
            onPress={handleSendNotifications}
            style={styles.notifyButton}
          >
            <Text style={styles.notifyButtonText}>📢 Notify</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sessionInfoCard}>
        <Text style={styles.sessionTitle}>{sessionTitle}</Text>
        {session && (
          <>
            <Text style={styles.sessionDetail}>
              📅 {formatDate(session.datetime)} at {formatTime(session.datetime)}
            </Text>
            <Text style={styles.sessionDetail}>📍 {session.location}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{bookings.length}</Text>
                <Text style={styles.statLabel}>Booked</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{session.max_players}</Text>
                <Text style={styles.statLabel}>Capacity</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {session.max_players - bookings.length}
                </Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  AED {bookings.length * session.price}
                </Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {bookings.length} {bookings.length === 1 ? 'Attendee' : 'Attendees'}
        </Text>
      </View>

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
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>
              Attendees will appear here once they book this session
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
    flex: 1,
    textAlign: 'center',
  },
  notifyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#00D4AA',
    borderRadius: 8,
  },
  notifyButtonText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
  },
  sessionInfoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sessionDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  attendeeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendeeInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  attendeeContact: {
    fontSize: 13,
    color: '#666',
  },
  bookingDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
  },
  detailValueSmall: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '600',
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
