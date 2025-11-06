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
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { Session } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePaymentSheet } from '../components/PaymentSheet';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

interface Community {
  id: string;
  name: string;
  location?: string;
}

interface SessionsScreenProps {
  onNavigateToProfile?: () => void;
  onNavigateToMyBookings?: () => void;
  onNavigateToCommunities?: () => void;
  onSwitchRole?: () => void;
  onViewCommunity?: (communityId: string) => void;
  onBack?: () => void;
  onOpenMenu?: () => void;
  route?: any;
}

export default function SessionsScreen({ onNavigateToProfile, onNavigateToMyBookings, onNavigateToCommunities, onSwitchRole, onViewCommunity, onBack, onOpenMenu, route }: SessionsScreenProps) {
  const { userRoles } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Reset selectedCommunity when screen loses focus or when navigating back
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus, check if communityId is passed
      const communityId = route?.params?.communityId;
      const sessionId = route?.params?.sessionId;
      const openBookingModal = route?.params?.openBookingModal;

      if (communityId) {
        setSelectedCommunity(communityId);
      } else {
        setSelectedCommunity(null);
      }

      // If we should auto-open the booking modal for a specific session
      if (sessionId && openBookingModal && sessions.length > 0) {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          console.log('[SessionsScreen] Auto-opening booking modal for session:', sessionId);
          // Small delay to ensure UI is ready
          setTimeout(() => {
            handleSessionPress(session);
          }, 300);
        }
      }

      return () => {
        // When screen loses focus, reset selectedCommunity
        setSelectedCommunity(null);
      };
    }, [route?.params?.communityId, route?.params?.sessionId, route?.params?.openBookingModal, sessions])
  );

  // Payment hook
  const { initializePaymentSheet, openPaymentSheet, loading: paymentSheetLoading } = usePaymentSheet();

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [selectedCommunity]);

  const loadCommunities = async () => {
    try {
      const response = await api.getUserCommunities();
      const userCommunities = response.communities || response.data?.communities || [];
      setCommunities(userCommunities);
    } catch (error) {
      console.error('Error loading communities:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await api.getAvailableSessions(selectedCommunity || undefined);
      setSessions(response.sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCommunitySelect = (communityId: string | null) => {
    setSelectedCommunity(communityId);
    setShowCommunityPicker(false);
  };

  const getSelectedCommunityName = () => {
    if (!selectedCommunity) return 'All Communities';
    const community = communities.find(c => c.id === selectedCommunity);
    return community?.name || 'All Communities';
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
  };

  const formatDate = (dateString: string) => {
    // Ensure datetime is treated as UTC by adding 'Z' if not present
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
    // Ensure datetime is treated as UTC by adding 'Z' if not present
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Dubai',
    }) + ' GST';
  };

  const handleBooking = async (session: Session) => {
    try {
      setIsProcessingPayment(true);

      // Initialize payment sheet
      console.log('[Booking] Initializing payment sheet for session:', session.id);
      const initResult = await initializePaymentSheet(session.id);

      if (!initResult.success) {
        throw new Error('Failed to initialize payment');
      }

      console.log('[Booking] Payment intent ID:', initResult.paymentIntentId);

      // Present payment sheet
      console.log('[Booking] Opening payment sheet...');
      const result = await openPaymentSheet();
      console.log('[Booking] Payment sheet result:', result);

      if (result.cancelled) {
        console.log('[Booking] Payment cancelled by user');
        setIsProcessingPayment(false);
        return;
      }

      if (result.success) {
        // Payment successful - now confirm the booking on backend
        const paymentIntentId = result.paymentIntentId || initResult.paymentIntentId;

        if (!paymentIntentId) {
          throw new Error('Payment intent ID not found');
        }

        console.log('[Booking] Confirming booking with payment intent:', paymentIntentId);
        const response = await api.confirmBooking(session.id, paymentIntentId);
        console.log('[Booking] Booking confirmed:', response);

        Alert.alert(
          '🎉 Booking Confirmed!',
          `Your booking has been successfully created.\n\nSession: ${session.title}\nPrice: AED ${response.payment.amount}\nBooking ID: ${response.booking.id}`,
          [{
            text: 'View My Bookings',
            onPress: () => {
              loadSessions();
              // Navigate to My Bookings page
              if (onNavigateToMyBookings) {
                onNavigateToMyBookings();
              }
            }
          }]
        );
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error: any) {
      console.error('[Booking] Error:', error);
      Alert.alert(
        'Booking Failed',
        error.response?.data?.error || error.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsProcessingPayment(false);
    }
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

  const handleSessionPress = (session: Session) => {
    const availableSpots = session.max_players - (session.booked_count || 0);

    Alert.alert(
      session.title,
      `${session.description || 'Join this session!'}\n\nDate: ${formatDate(session.datetime)} at ${formatTime(session.datetime)}\nLocation: ${session.location}\nPrice: AED ${session.price}\n\nSpots: ${availableSpots} / ${session.max_players} available`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => handleBooking(session)
        }
      ]
    );
  };

  const renderSession = ({ item }: { item: Session }) => {
    const availableSpots = item.max_players - (item.booked_count || 0);

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleSessionPress(item)}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleRow}>
            <Text style={styles.sessionTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {availableSpots > 0 ? 'Available' : 'Full'}
              </Text>
            </View>
          </View>

        {item.community_name && (
          <View style={styles.communityBadge}>
            <Text style={styles.communityName}>{item.community_name}</Text>
          </View>
        )}
      </View>

      <View style={styles.sessionInfo}>
        <Text style={styles.sessionDate}>
          📅 {formatDate(item.datetime)} at {formatTime(item.datetime)}
        </Text>
        {item.google_maps_url ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              openGoogleMaps(item);
            }}
            style={styles.locationButton}
          >
            <Text style={styles.sessionLocationClickable}>📍 {item.location}</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.blue} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.sessionLocation}>📍 {item.location}</Text>
        )}
      </View>

      <View style={styles.sessionFooter}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentLabel}>Payment:</Text>
          <Text style={styles.paymentAmount}>AED {item.price}</Text>
        </View>
      </View>

        <View style={styles.sessionMetadata}>
          <Text style={styles.sessionSpots}>
            {availableSpots} / {item.max_players} spots available
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  // Check if user has multiple roles
  const hasMultipleRoles = userRoles.length > 1;

  return (
    <View style={styles.container}>
      {/* Green Header with Logo */}
      <View style={styles.brandHeader}>
        {/* Close button in top right */}
        {onBack && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={32} color="#000000" />
          </TouchableOpacity>
        )}

        <View style={styles.appNameRow}>
          {/* B text - black */}
          <Text style={styles.appName}>B</Text>

          {/* First tennis ball icon (replaces first o) - black, sized to match lowercase letters */}
          <Ionicons name="tennisball" size={24} color="#000000" style={styles.ballIconSmall} />

          {/* Second tennis ball icon (replaces second o) - black, sized to match lowercase letters */}
          <Ionicons name="tennisball" size={24} color="#000000" style={styles.ballIconSmallSecond} />

          {/* k Matches text - black */}
          <Text style={styles.appName}>k Matches</Text>
        </View>
      </View>

      <FlatList
        data={sessions}
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
            <Text style={styles.emptyText}>No sessions available</Text>
          </View>
        }
      />

      {isProcessingPayment && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>Processing payment...</Text>
          </View>
        </View>
      )}

      {/* Community Picker Modal */}
      <Modal
        visible={showCommunityPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommunityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Community</Text>
              <TouchableOpacity onPress={() => setShowCommunityPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {/* All Communities Option */}
              <TouchableOpacity
                style={[
                  styles.communityOption,
                  !selectedCommunity && styles.communityOptionSelected,
                ]}
                onPress={() => handleCommunitySelect(null)}
              >
                <View style={styles.radioButton}>
                  {!selectedCommunity && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.communityOptionText}>All Communities</Text>
              </TouchableOpacity>

              {/* Individual Communities */}
              {communities.map((community) => (
                <TouchableOpacity
                  key={community.id}
                  style={[
                    styles.communityOption,
                    selectedCommunity === community.id && styles.communityOptionSelected,
                  ]}
                  onPress={() => handleCommunitySelect(community.id)}
                >
                  <View style={styles.radioButton}>
                    {selectedCommunity === community.id && <View style={styles.radioButtonInner} />}
                  </View>
                  <View style={styles.communityOptionInfo}>
                    <Text style={styles.communityOptionText}>{community.name}</Text>
                    {community.location && (
                      <Text style={styles.communityOptionLocation}>{community.location}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',  // White background like bookings
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  closeButton: {
    position: 'absolute',
    top: 50,  // Aligned with status bar spacing
    right: Spacing.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',  // BLACK text
    letterSpacing: 0.5,
  },
  ballIconSmall: {
    marginLeft: -2,  // Reduced gap before the ball
    marginRight: 0,  // Reduced gap after the ball
    marginBottom: -4,  // Adjust vertical alignment to match lowercase letters
  },
  ballIconSmallSecond: {
    marginLeft: 0,  // Balanced spacing between two balls
    marginRight: 0,  // Reduced gap after the ball
    marginBottom: -4,  // Adjust vertical alignment to match lowercase letters
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,  // Increased padding
    paddingVertical: Spacing.lg,  // Increased padding
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.backgroundElevated,
    borderBottomWidth: 0,  // Removed border, using shadow instead
    ...Shadows.md,  // Increased shadow for visibility
  },
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  communitiesButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.separatorLight,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  myBookingsButton: {
    height: 44,
    paddingHorizontal: Spacing.lg,  // Increased padding
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.xl,  // More rounded for iOS feel
    alignItems: 'center',
    justifyContent: 'center',
  },
  myBookingsButtonText: {
    ...TextStyles.footnote,
    color: Colors.backgroundElevated,
    fontWeight: '600',
  },
  switchRoleButton: {
    height: 44,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.separatorLight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRoleButtonText: {
    ...TextStyles.footnote,
    color: Colors.secondary,
    fontWeight: '600',
  },
  profileButton: {
    height: 44,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    ...TextStyles.footnote,
    color: Colors.backgroundElevated,
    fontWeight: '600',
  },
  headerTitle: {
    ...TextStyles.title1,
    flex: 1,
    marginRight: Spacing.sm,
  },
  listContent: {
    paddingVertical: Spacing.md,  // Only vertical padding
  },
  sessionCard: {
    backgroundColor: '#F5F5F5',  // Light grey background like bookings
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#000000',  // Black outline
    padding: Spacing.md,
    marginBottom: Spacing.md,  // Spacing between cards
    marginHorizontal: Spacing.md,  // Spacing from edges
  },
  sessionHeader: {
    marginBottom: Spacing.sm,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs / 2,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',  // Bold text
    color: '#000000',  // Black text
    flex: 1,
    marginRight: Spacing.xs,
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
  sessionFooter: {
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
  sessionMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionSpots: {
    fontSize: 11,
    fontWeight: '400',
    color: '#999999',  // Grey text
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...TextStyles.body,
    color: Colors.secondary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: Colors.backgroundElevated,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...TextStyles.callout,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: Colors.backgroundElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filterLabel: {
    ...TextStyles.subheadline,
    fontWeight: '500',
  },
  communitySelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.separatorLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 0.5,
    borderColor: Colors.separator,
  },
  communitySelectorText: {
    ...TextStyles.callout,
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.backgroundElevated,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  modalTitle: {
    ...TextStyles.headline,
  },
  modalScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  communityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.separatorLight,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  communityOptionSelected: {
    backgroundColor: Colors.brandLight,
    borderColor: Colors.brand,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.tertiary,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brand,
  },
  communityOptionInfo: {
    flex: 1,
  },
  communityOptionText: {
    ...TextStyles.callout,
    fontWeight: '500',
  },
  communityOptionLocation: {
    ...TextStyles.footnote,
    color: Colors.secondary,
    marginTop: 2,
  },
});
