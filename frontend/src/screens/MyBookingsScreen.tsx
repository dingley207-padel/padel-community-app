import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';
import CancelIcon from '../components/CancelIcon';

interface Community {
  name: string;
  location?: string;
}

interface Session {
  id: string;
  title: string;
  description?: string;
  datetime: string;
  location: string;
  google_maps_url?: string;
  price: number;
  status: string;
  communities?: Community;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Booking {
  id: string;
  user_id: string;
  session_id: string;
  payment_status: string;
  timestamp: string;
  cancelled_at: string | null;
  cancellation_status?: string;
  sessions: Session;
  payments: Payment[];
}

interface MyBookingsScreenProps {
  onBack: () => void;
  onOpenMenu?: () => void;
}

export default function MyBookingsScreen({ onBack, onOpenMenu }: MyBookingsScreenProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  // Reload bookings when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadBookings();
    }, [])
  );

  const loadBookings = async () => {
    try {
      const response = await api.getUserBookings();
      console.log('[MyBookings] Loaded bookings:', response.bookings?.length || 0);
      if (response.bookings && response.bookings.length > 0) {
        console.log('[MyBookings] First booking:', JSON.stringify(response.bookings[0], null, 2));
      }
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBookings();
  };

  const formatDate = (dateString: string) => {
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const isUpcoming = (session: Session) => {
    // Ensure datetime is treated as UTC by adding 'Z' if not present
    const utcDateString = session.datetime.endsWith('Z') ? session.datetime : session.datetime + 'Z';
    const sessionDate = new Date(utcDateString);
    const now = new Date();

    // Compare using timestamps to ensure consistent timezone handling
    return sessionDate.getTime() > now.getTime() && session.status === 'active';
  };

  const isPast = (session: Session) => {
    // Ensure datetime is treated as UTC by adding 'Z' if not present
    const utcDateString = session.datetime.endsWith('Z') ? session.datetime : session.datetime + 'Z';
    const sessionDate = new Date(utcDateString);
    const now = new Date();

    // Compare using timestamps to ensure consistent timezone handling
    return sessionDate.getTime() <= now.getTime() || session.status === 'completed';
  };

  const getStatusColor = (booking: Booking) => {
    // Pending conditional cancellation - orange/yellow
    if (booking.cancellation_status === 'pending_replacement') return '#FF9500';
    // Fully cancelled with refund - red
    if (booking.cancelled_at) return Colors.red;
    // Upcoming - neon green
    if (isUpcoming(booking.sessions)) return Colors.brand;
    // Completed - grey
    return '#999999';
  };

  const getStatusBadgeColor = (booking: Booking) => {
    return getStatusColor(booking) + '20';
  };

  const getStatusText = (booking: Booking) => {
    // Pending conditional cancellation
    if (booking.cancellation_status === 'pending_replacement') return 'Pending';
    // Fully cancelled with refund
    if (booking.cancelled_at) return 'Refunded';
    // Upcoming session
    if (isUpcoming(booking.sessions)) return 'Upcoming';
    // Past session
    if (isPast(booking.sessions)) return 'Completed';
    return 'Active';
  };

  const openGoogleMaps = (session: Session) => {
    if (!session.google_maps_url) return;

    const url = session.google_maps_url.startsWith('http')
      ? session.google_maps_url
      : `https://${session.google_maps_url}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open Google Maps');
      }
    });
  };

  const handleCancelBooking = async (booking: Booking) => {
    // Check if session is too close
    // Ensure datetime is treated as UTC by adding 'Z' if not present
    const utcDateString = booking.sessions.datetime.endsWith('Z')
      ? booking.sessions.datetime
      : booking.sessions.datetime + 'Z';
    const sessionTime = new Date(utcDateString);
    const now = new Date();
    const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const freeCancellationHours = 24; // Default to 24 hours - should match session config

    // Session has already started
    if (hoursUntilSession < 0) {
      Alert.alert(
        'Cannot Cancel',
        'Cannot cancel a session that has already started.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Within free cancellation window
    if (hoursUntilSession >= freeCancellationHours) {
      Alert.alert(
        'Free Cancellation',
        `Cancel your booking for "${booking.sessions.title}"?\n\nYou will receive a full refund of AED ${booking.sessions.price}.`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await api.cancelBooking(booking.id);
                Alert.alert('Success', response.message);
                loadBookings();
              } catch (error: any) {
                Alert.alert(
                  'Error',
                  error?.response?.data?.error || 'Failed to cancel booking'
                );
              }
            },
          },
        ]
      );
      return;
    }

    // Outside free cancellation window - offer conditional cancellation
    Alert.alert(
      'Conditional Cancellation',
      `The free cancellation period (${freeCancellationHours}h before) has ended.\n\nYou can request cancellation, but you'll only receive a refund of AED ${booking.sessions.price} if someone else takes your spot.\n\nDo you want to request cancellation?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Request Cancellation',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.cancelBooking(booking.id, false);
              Alert.alert(
                response.type === 'immediate' ? 'Cancelled' : 'Request Submitted',
                response.message
              );
              loadBookings();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.response?.data?.error || 'Failed to cancel booking'
              );
            }
          },
        },
      ]
    );
  };

  const filterBookings = (bookings: Booking[]) => {
    const isCancelled = (b: Booking) =>
      b.cancelled_at !== null || b.cancellation_status === 'pending_replacement';

    let filtered: Booking[];
    switch (selectedFilter) {
      case 'upcoming':
        filtered = bookings.filter(b => {
          const isNotCancelled = !isCancelled(b);
          const upcoming = isUpcoming(b.sessions);
          console.log(`[Filter] Booking ${b.id}: cancelled=${!isNotCancelled}, upcoming=${upcoming}, status=${b.sessions.status}, datetime=${b.sessions.datetime}`);
          return isNotCancelled && upcoming;
        });
        break;
      case 'past':
        filtered = bookings.filter(b => !isCancelled(b) && isPast(b.sessions));
        break;
      case 'cancelled':
        filtered = bookings.filter(b => isCancelled(b));
        break;
      default:
        filtered = bookings;
    }
    console.log(`[Filter] ${selectedFilter}: ${filtered.length} of ${bookings.length} bookings`);
    return filtered;
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const canCancel = !item.cancelled_at &&
                      item.cancellation_status !== 'pending_replacement' &&
                      isUpcoming(item.sessions);

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingTitleRow}>
            <Text style={styles.bookingTitle} numberOfLines={1}>
              {item.sessions.title}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {getStatusText(item)}
              </Text>
            </View>
          </View>

          {item.sessions.communities && (
            <View style={styles.communityBadge}>
              <Text style={styles.communityName}>{item.sessions.communities.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionDate}>
            📅 {formatDate(item.sessions.datetime)} at {formatTime(item.sessions.datetime)}
          </Text>
          {item.sessions.google_maps_url ? (
            <TouchableOpacity
              onPress={() => openGoogleMaps(item.sessions)}
              style={styles.locationButton}
            >
              <Text style={styles.sessionLocationClickable}>📍 {item.sessions.location}</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.blue} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.sessionLocation}>📍 {item.sessions.location}</Text>
          )}
        </View>

        <View style={styles.bookingFooter}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Payment:</Text>
            <Text style={styles.paymentAmount}>AED {item.sessions.price}</Text>
          </View>
        </View>

        <View style={styles.bookingMetadata}>
          <Text style={styles.bookingTime}>
            Booked on {formatDate(item.timestamp)}
          </Text>
          <View style={styles.idPlaceholder}>
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButtonPosition}
                onPress={() => handleCancelBooking(item)}
              >
                <CancelIcon size={30} color={Colors.red} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const filteredBookings = filterBookings(bookings);

  return (
    <View style={styles.container}>
      {/* Green Header with My Bookings Title */}
      <View style={styles.brandHeader}>
        <Text style={styles.pageTitle}>My Bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'upcoming' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('upcoming')}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedFilter === 'upcoming' && styles.filterTabTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'past' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('past')}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedFilter === 'past' && styles.filterTabTextActive,
            ]}
          >
            Played
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'cancelled' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('cancelled')}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedFilter === 'cancelled' && styles.filterTabTextActive,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.brand}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'upcoming'
                  ? 'Book your first session to get started!'
                  : selectedFilter === 'cancelled'
                  ? 'No cancelled bookings'
                  : selectedFilter === 'past'
                  ? 'No past bookings yet'
                  : 'You have not made any bookings yet'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',  // White background like home page
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // BRAND HEADER - NEON GREEN BACKGROUND WITH BLACK TEXT
  brandHeader: {
    backgroundColor: '#8FFE09',  // Neon green background
    paddingTop: 60,  // Extra space for status bar
    paddingBottom: Spacing.md,  // Reduced gap below logo
    paddingHorizontal: Spacing.xl,
    alignItems: 'flex-start',
    borderTopLeftRadius: BorderRadius.xxl,  // Only top corners curved
    borderTopRightRadius: BorderRadius.xxl,
    borderBottomLeftRadius: 0,  // Straight bottom corners
    borderBottomRightRadius: 0,
    position: 'relative',
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  backButtonText: {
    ...TextStyles.body,
    color: Colors.green,
    fontWeight: '600',
  },
  headerTitle: {
    ...TextStyles.title3,
    color: Colors.primary,
  },
  placeholder: {
    width: 60,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
  },
  filterTabActive: {
    backgroundColor: '#8FFE09',
    borderColor: '#000000',
    borderWidth: 2,
  },
  filterTabText: {
    ...TextStyles.subheadline,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: Spacing.md,  // Only vertical padding, no horizontal
  },
  bookingCard: {
    backgroundColor: '#F5F5F5',  // Light grey background
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#000000',  // Black outline
    padding: Spacing.md,
    marginBottom: Spacing.md,  // Reduced spacing between cards
    marginHorizontal: Spacing.md,  // Add spacing from screen edges
  },
  bookingHeader: {
    marginBottom: Spacing.sm,
  },
  bookingTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs / 2,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '700',  // Bold text
    color: '#000000',  // Black text
    flex: 1,
    marginRight: Spacing.xs,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusColumn: {
    alignItems: 'center',
    gap: 3,  // Minimal space between status badge and cancel button
  },
  statusBadge: {
    backgroundColor: '#000000',  // Solid black background
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,  // Rounded corners
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',  // White text on black background
  },
  cancelBadge: {
    backgroundColor: '#000000',  // Solid black background like status badge
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,  // Reduced padding to match
    borderRadius: 12,  // Rounded corners
  },
  cancelBadgeText: {
    fontSize: 11,  // Slightly smaller to match
    fontWeight: '700',
    color: '#FFFFFF',  // White text on black background
  },
  cancelIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelIconButton: {
    padding: 4,
  },
  cancelButtonAbsolute: {
    position: 'absolute',
    top: 24,  // Position below the status badge
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 2,
  },
  communityBadge: {
    backgroundColor: '#000000',  // Solid black background
    borderRadius: 16,  // Rounded corners
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',  // Fit content width
    marginTop: 4,
  },
  communityName: {
    fontSize: 13,
    fontWeight: '700',  // Bold text
    color: Colors.brand,  // Neon green text on black background
  },
  sessionInfo: {
    marginBottom: Spacing.sm,
  },
  sessionDate: {
    fontSize: 12,
    fontWeight: '700',  // Bold text
    color: '#000000',  // Black text
    marginBottom: Spacing.xs / 2,
  },
  sessionLocation: {
    fontSize: 12,
    fontWeight: '700',  // Bold text
    color: '#000000',  // Black text
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionLocationClickable: {
    fontSize: 12,
    fontWeight: '700',  // Bold text
    color: Colors.blue,
  },
  bookingFooter: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',  // Light grey divider
    marginBottom: Spacing.xs,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999999',  // Grey text
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',  // Bold
    color: '#000000',  // Black
  },
  paymentStatusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs / 3,
    borderRadius: BorderRadius.sm,
  },
  paymentStatusText: {
    ...TextStyles.caption2,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.red + '20',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TextStyles.body,
    fontWeight: '600',
    color: Colors.red,
  },
  bookingMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingTime: {
    fontSize: 11,
    fontWeight: '400',
    color: '#999999',  // Grey text
  },
  bookingId: {
    fontSize: 10,
    fontWeight: '400',
    color: '#CCCCCC',  // Light grey text
    fontFamily: 'monospace',
  },
  idPlaceholder: {
    height: 12,  // Same height as the ID text to maintain card size
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',  // Allow icon to extend beyond container
  },
  cancelButtonPosition: {
    // Cancel button fits within the placeholder
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999999',  // Grey text
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999999',  // Grey text
    textAlign: 'center',
  },
});
