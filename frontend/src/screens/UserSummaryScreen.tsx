import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

interface Session {
  id: string;
  title: string;
  datetime: string;
  location: string;
  price: number;
  status: string;
  community_id: string;
  communities?: {
    name: string;
  };
}

interface Booking {
  id: string;
  user_id: string;
  session_id: string;
  payment_status: string;
  timestamp: string;
  cancelled_at: string | null;
  sessions: Session;
}

interface Announcement {
  id: string;
  community_id: string;
  title: string;
  message: string;
  created_at: string;
  communities?: {
    id: string;
    name: string;
    image_url?: string;
  };
  users?: {
    id: string;
    name: string;
    profile_image?: string;
  };
}

interface UserSummaryScreenProps {
  onNavigateToAnnouncements?: () => void;
  onOpenMenu?: () => void;
}

export default function UserSummaryScreen({ onNavigateToAnnouncements, onOpenMenu }: UserSummaryScreenProps) {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');
  const [countdown, setCountdown] = useState<string>('');

  // Reload profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const response = await api.getCurrentUser();
          const profile = response.user || response;

          setProfileImage(profile.profile_image || '');
          updateUser(profile);
        } catch (error) {
          console.error('[UserSummaryScreen] Failed to load profile:', error);
        }
      };
      loadProfile();
    }, [])
  );

  useEffect(() => {
    loadData();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!nextBooking?.sessions?.datetime) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const sessionDatetime = nextBooking.sessions.datetime.endsWith('Z')
        ? nextBooking.sessions.datetime
        : nextBooking.sessions.datetime + 'Z';
      const sessionTime = new Date(sessionDatetime).getTime();
      const now = new Date().getTime();
      const diff = sessionTime - now;

      // If more than 1 hour has passed since session start, reload data to get next match
      if (diff < -3600000) { // -3600000ms = -1 hour
        loadData();
        return;
      }

      if (diff <= 0) {
        setCountdown('Good Luck!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Only show days if more than 24 hours remaining
      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else {
        setCountdown(`${hours}h ${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextBooking]);

  const loadData = async () => {
    await Promise.all([
      loadNextBooking(),
      loadAnnouncements(),
    ]);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const loadNextBooking = async () => {
    try {
      setIsLoading(true);
      const response = await api.getUserBookings();
      const bookings = response.bookings || [];

      const upcomingBookings = bookings
        .filter((booking: Booking) => {
          if (booking.cancelled_at) return false;
          // Ensure datetime is treated as UTC by adding 'Z' if not present
          const utcDateString = booking.sessions.datetime.endsWith('Z')
            ? booking.sessions.datetime
            : booking.sessions.datetime + 'Z';
          const sessionDate = new Date(utcDateString);
          const now = new Date();
          const timeDiff = sessionDate.getTime() - now.getTime();
          // Show sessions that haven't started yet OR started within the last hour
          const isUpcoming = timeDiff > -3600000; // -3600000ms = -1 hour
          const isActive = booking.sessions.status === 'active';
          return isUpcoming && isActive;
        })
        .sort((a: Booking, b: Booking) => {
          const aUtc = a.sessions.datetime.endsWith('Z') ? a.sessions.datetime : a.sessions.datetime + 'Z';
          const bUtc = b.sessions.datetime.endsWith('Z') ? b.sessions.datetime : b.sessions.datetime + 'Z';
          return new Date(aUtc).getTime() - new Date(bUtc).getTime();
        });

      if (upcomingBookings.length > 0) {
        setNextBooking(upcomingBookings[0]);
      }
    } catch (error: any) {
      console.error('Load next booking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await api.getMyAnnouncements();
      setAnnouncements(response.announcements || []);
    } catch (error: any) {
      console.error('Load announcements error:', error);
    }
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

  const formatAnnouncementDate = (dateString: string) => {
    // Ensure datetime is treated as UTC by adding 'Z' if not present
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brand}
          />
        }
      >
        {/* App Branding - NEON GREEN HEADER */}
        <View style={styles.brandHeader}>
          {/* Burger menu button in top right */}
          {onOpenMenu && (
            <TouchableOpacity
              style={styles.burgerButton}
              onPress={onOpenMenu}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={32} color="#000000" />
            </TouchableOpacity>
          )}

          <View style={styles.appNameRow}>
            {/* Padel text - black */}
            <Text style={styles.appName}>Padel </Text>

            {/* Tennis ball icon - black */}
            <Ionicons name="tennisball" size={32} color="#000000" style={styles.ballIcon} />

            {/* NE text - black */}
            <Text style={styles.appName}>NE</Text>
          </View>
        </View>

        {/* Profile Section - BLACK BACKGROUND */}
        <View style={styles.profileCard}>
          {/* Grade badge in top right */}
          <View style={styles.skillBadge}>
            <Ionicons name="trophy" size={12} color="#8FFE09" />
            <Text style={styles.skillBadgeText}>
              Grade {user?.skill_level || 'N/A'}
            </Text>
          </View>

          <View style={styles.profileHeader}>
            {profileImage ? (
              <View style={styles.profileImageWrapper}>
                <Image
                  key={profileImage}
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={30} color={Colors.textSecondary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
          </View>
        </View>

        {/* Next Match - with header and divider like Announcements */}
        {nextBooking && (
          <View style={styles.nextMatchSection}>
            <View style={styles.bookingCard}>
                {/* Next Match header */}
                <View style={styles.nextMatchHeader}>
                  <View style={styles.nextMatchHeaderLeft}>
                    <Ionicons name="tennisball" size={20} color={Colors.brand} style={styles.nextMatchBallIcon} />
                    <Text style={styles.nextMatchTitle}>Next Match</Text>
                  </View>
                  {countdown && (
                    <Text style={styles.countdownText}>{countdown}</Text>
                  )}
                </View>

                {/* Session info - Community badge and session name on same line */}
                <View style={styles.bookingSessionInfo}>
                  <View style={styles.communityBadge}>
                    <Text style={styles.bookingCommunity}>
                      {nextBooking.sessions.communities?.name || 'Community'}
                    </Text>
                  </View>
                  <Text style={styles.bookingTitle}>{nextBooking.sessions.title}</Text>
                </View>

                {/* Date, Time, Location on single line */}
                <View style={styles.bookingDetailsSingleRow}>
                  <View style={styles.bookingDetailRow}>
                    <Ionicons name="calendar" size={16} color={Colors.brand} />
                    <Text style={styles.bookingDetailText}>
                      {formatDate(nextBooking.sessions.datetime)}
                    </Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Ionicons name="time" size={16} color={Colors.brand} />
                    <Text style={styles.bookingDetailText}>
                      {formatTime(nextBooking.sessions.datetime)}
                    </Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Ionicons name="location" size={16} color={Colors.brand} />
                    <Text style={styles.bookingDetailText} numberOfLines={1}>
                      {nextBooking.sessions.location}
                    </Text>
                  </View>
                </View>
            </View>
          </View>
        )}

        {/* Announcements - Styled like Next Match */}
        <View style={styles.announcementsSection}>
          <TouchableOpacity
            style={styles.announcementsCard}
            onPress={onNavigateToAnnouncements}
            activeOpacity={0.8}
          >
            {/* Announcements header inside the box */}
            <View style={styles.announcementsSectionHeader}>
              <View style={styles.announcementHeaderLeft}>
                <Ionicons name="megaphone" size={20} color={Colors.brand} style={styles.announcementIcon} />
                <Text style={styles.announcementsSectionTitle}>Announcements</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>

            {announcements.length > 0 ? (
              <>
                {announcements.slice(0, 5).map((announcement, index) => (
                  <View key={announcement.id}>
                    <View style={styles.announcementItem}>
                      <View style={styles.announcementContentWrapper}>
                        <View style={styles.communityBadge}>
                          <Text style={styles.announcementCommunityBadge}>
                            {announcement.communities?.name || 'Community'}
                          </Text>
                        </View>
                        <Text style={styles.announcementTime}>
                          {formatAnnouncementDate(announcement.created_at)}
                        </Text>
                      </View>
                      <Text style={styles.announcementMessage} numberOfLines={3}>
                        {announcement.message}
                      </Text>
                    </View>
                    {index < announcements.slice(0, 5).length - 1 && (
                      <View style={styles.announcementDivider} />
                    )}
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyAnnouncementState}>
                <Ionicons name="megaphone-outline" size={48} color={Colors.brand} />
                <Text style={styles.emptyText}>No announcements yet</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',  // White background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
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
  burgerButton: {
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
  ballIcon: {
    marginLeft: 2,
    marginRight: -2,
  },

  // PROFILE CARD - WHITE BACKGROUND with BLACK OUTLINE (30% smaller)
  profileCard: {
    backgroundColor: '#FFFFFF',  // White background
    paddingHorizontal: Spacing.md,  // 24px -> 16px
    paddingVertical: Spacing.sm,  // 16px -> 8px
    marginTop: Spacing.md,  // Reduced spacing between sections
    marginHorizontal: Spacing.md,  // Add spacing from screen edges
    borderWidth: 2,
    borderColor: '#000000',  // Black outline
    borderRadius: BorderRadius.xl,  // Slightly less rounded for compact look
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,  // Reduced gap
  },
  profileImageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#000000',  // BLACK OUTLINE
    overflow: 'hidden',
    ...Shadows.brandGlow,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',  // BLACK OUTLINE
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',  // Dark grey text
    marginBottom: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',  // BLACK TEXT
    marginBottom: 4,
  },
  skillBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: '#000000',  // Black background
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: '#000000',  // Black outline
    gap: 4,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8FFE09',  // Green text
  },

  // SECTIONS
  section: {
    padding: Spacing.lg,
  },
  nextMatchSection: {
    marginTop: Spacing.md,  // Reduced spacing between sections
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',  // Black text
    marginBottom: Spacing.lg,
  },

  // NEXT BOOKING CARD - Grey background with neon green outline
  bookingCard: {
    backgroundColor: '#F5F5F5',  // Light grey background for entire box
    borderWidth: 2,
    borderColor: Colors.brand,  // Neon green outline
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,  // Add spacing from screen edges
  },
  nextMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',  // Black divider line
  },
  nextMatchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextMatchBallIcon: {
    marginRight: 6,
  },
  nextMatchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',  // Black text
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.red,  // Red countdown text
  },
  bookingContentArea: {
    backgroundColor: '#F5F5F5',  // Light grey background
    padding: Spacing.sm,  // Reduced padding to keep box compact
    marginHorizontal: -Spacing.md,  // Extend to edges of card
    marginBottom: -Spacing.md,  // Extend to bottom edge of card
    paddingHorizontal: Spacing.md,  // Add back horizontal padding inside
    paddingTop: Spacing.sm,  // Add back top padding inside
    paddingBottom: Spacing.md,  // Add back bottom padding inside
    borderBottomLeftRadius: BorderRadius.xl,  // Match card's bottom corners
    borderBottomRightRadius: BorderRadius.xl,
  },
  bookingSessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',  // Black text
    flex: 1,
  },
  communityBadge: {
    backgroundColor: '#000000',  // Solid black background
    borderRadius: 16,  // Rounded corners
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  bookingCommunity: {
    fontSize: 13,
    fontWeight: '700',  // Bold text
    color: Colors.brand,  // Neon green text on black background
  },
  bookingDetailsSingleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: Spacing.sm,
  },
  bookingDetailText: {
    fontSize: 12,
    fontWeight: '700',  // Bold text
    color: '#000000',  // Black text
  },

  // ANNOUNCEMENTS - Grey background with black outline
  announcementsSection: {
    marginTop: Spacing.md,  // Reduced spacing between sections
  },
  announcementsCard: {
    backgroundColor: '#F5F5F5',  // Light grey background for entire box
    borderWidth: 2,
    borderColor: '#000000',  // Black outline
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,  // Add spacing from screen edges
  },
  announcementsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand,  // Neon green divider line
  },
  announcementHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementIcon: {
    marginRight: 6,
  },
  announcementsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',  // BLACK text - should be very visible
  },
  announcementsContentArea: {
    backgroundColor: '#F5F5F5',  // Light grey background
    padding: Spacing.sm,
    marginHorizontal: -Spacing.md,  // Extend to edges of card
    marginBottom: -Spacing.md,  // Extend to bottom edge of card
    paddingHorizontal: Spacing.md,  // Add back horizontal padding inside
    paddingTop: Spacing.sm,  // Add back top padding inside
    paddingBottom: Spacing.md,  // Add back bottom padding inside
    borderBottomLeftRadius: BorderRadius.xl,  // Match card's bottom corners
    borderBottomRightRadius: BorderRadius.xl,
  },
  announcementItem: {
    paddingVertical: Spacing.sm,
  },
  announcementDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: Spacing.sm,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  announcementCommunity: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand,  // Neon green
  },
  announcementContentWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  announcementCommunityBadge: {
    fontSize: 13,
    fontWeight: '700',  // Bold text
    color: Colors.brand,  // Neon green text on black background
  },
  announcementTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999999',  // Grey text
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',  // Black text
    marginBottom: Spacing.xs,
  },
  announcementMessage: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666666',  // Dark grey text
    lineHeight: 18,
  },

  // EMPTY STATE
  emptyCard: {
    backgroundColor: '#FFFFFF',  // White background
    borderWidth: 2,
    borderColor: '#000000',  // Black outline
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyAnnouncementState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999999',  // Grey text
    marginTop: Spacing.md,
  },

});
