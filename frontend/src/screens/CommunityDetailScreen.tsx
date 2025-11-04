import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  profile_image?: string;
  banner_image?: string;
  manager_id: string;
  member_count?: number;
  website_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  facebook_url?: string;
  youtube_url?: string;
}

interface Session {
  id: string;
  title: string;
  datetime: string;
  location: string;
  price: number;
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
    profile_image?: string;
  };
}

interface CommunityDetailScreenProps {
  communityId: string;
  onBack?: () => void;
  showBackButton?: boolean;
  onNavigateToSessions?: () => void;
  onNavigateToAnnouncements?: () => void;
}

export default function CommunityDetailScreen({ communityId, onBack, showBackButton = true, onNavigateToSessions, onNavigateToAnnouncements }: CommunityDetailScreenProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    loadCommunityDetails();
    checkMembership();
    loadUpcomingSessions();
    loadAnnouncements();
  }, [communityId]);

  const loadCommunityDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.getCommunity(communityId);
      setCommunity(response.community || response.data?.community || response);
    } catch (error: any) {
      console.error('Load community details error:', error);
      Alert.alert('Error', 'Failed to load community details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await api.getCommunityAnnouncements(communityId);
      const announcementsData = response.announcements || response.data?.announcements || [];
      // Get the 3 most recent announcements
      setAnnouncements(announcementsData.slice(0, 3));
    } catch (error) {
      console.error('Load announcements error:', error);
    }
  };

  const checkMembership = async () => {
    try {
      const response = await api.getUserCommunities();
      const myCommunities = response.communities || response.data?.communities || [];
      setIsMember(myCommunities.some((c: Community) => c.id === communityId));
    } catch (error) {
      console.error('Check membership error:', error);
    }
  };

  const loadUpcomingSessions = async () => {
    try {
      const response = await api.getAvailableSessions(communityId);
      const sessions = response.sessions || response.data?.sessions || [];
      // Get the 3 soonest sessions
      setUpcomingSessions(sessions.slice(0, 3));
    } catch (error) {
      console.error('Load upcoming sessions error:', error);
    }
  };

  const formatSessionDay = (dateString: string) => {
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'Asia/Dubai',
    });
  };

  const formatSessionDate = (dateString: string) => {
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Dubai',
    });
  };

  const formatSessionTime = (dateString: string) => {
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Dubai',
    });
  };

  const formatAnnouncementDate = (dateString: string) => {
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

  const openSocialLink = (url?: string, platform: string) => {
    if (!url) return;

    // Add https:// if not present
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    Linking.canOpenURL(fullUrl).then(supported => {
      if (supported) {
        Linking.openURL(fullUrl);
      } else {
        Alert.alert('Error', `Cannot open ${platform} link`);
      }
    });
  };

  const handleLeaveCommunity = () => {
    if (!community) return;

    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave ${community.name}? You will no longer have access to this community's sessions and activities.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLeaving(true);
              await api.leaveCommunity(communityId);
              Alert.alert('Success', `You have left ${community.name}`);
              setIsMember(false);
              // Navigate back if callback exists
              if (onBack) {
                onBack();
              }
            } catch (error: any) {
              console.error('Leave community error:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to leave community');
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Green Header with Padel ONE */}
        <View style={styles.brandHeader}>
          {/* Back/Close button in top right */}
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
            {/* Padel text - black */}
            <Text style={styles.appName}>Padel </Text>

            {/* Tennis ball replacing 'O' - black */}
            <Ionicons name="tennisball" size={32} color="#000000" style={styles.ballIcon} />

            {/* NE text - black */}
            <Text style={styles.appName}>NE</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Loading community...</Text>
        </View>
      </View>
    );
  }

  if (!community) {
    return (
      <View style={styles.container}>
        {/* Green Header with Padel ONE */}
        <View style={styles.brandHeader}>
          {/* Back/Close button in top right */}
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
            {/* Padel text - black */}
            <Text style={styles.appName}>Padel </Text>

            {/* Tennis ball replacing 'O' - black */}
            <Ionicons name="tennisball" size={32} color="#000000" style={styles.ballIcon} />

            {/* NE text - black */}
            <Text style={styles.appName}>NE</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.secondary} />
          <Text style={styles.emptyText}>Community not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Green Header with Padel ONE */}
      <View style={styles.brandHeader}>
        {/* Back/Close button in top right */}
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
          {/* Padel text - black */}
          <Text style={styles.appName}>Padel </Text>

          {/* Tennis ball replacing 'O' - black */}
          <Ionicons name="tennisball" size={32} color="#000000" style={styles.ballIcon} />

          {/* NE text - black */}
          <Text style={styles.appName}>NE</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Image */}
        <View style={styles.bannerContainer}>
          {community.banner_image ? (
            <Image
              source={{ uri: community.banner_image }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="images" size={48} color={Colors.tertiary} />
            </View>
          )}
        </View>

        {/* Community Info Card */}
        <View style={styles.infoCard}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            {community.profile_image ? (
              <Image
                source={{ uri: community.profile_image }}
                style={styles.logo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="people" size={40} color={Colors.secondary} />
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={styles.communityName}>{community.name}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {/* Location */}
            {community.location && (
              <View style={styles.statItem}>
                <Ionicons name="location" size={20} color={Colors.brand} />
                <Text style={styles.statText}>{community.location}</Text>
              </View>
            )}

            {/* Members Count */}
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color={Colors.brand} />
              <Text style={styles.statText}>
                {community.member_count || 0} {community.member_count === 1 ? 'Member' : 'Members'}
              </Text>
            </View>
          </View>

          {/* Social Media Links */}
          {(community.website_url || community.twitter_url || community.instagram_url || community.tiktok_url ||
            community.facebook_url || community.youtube_url) && (
            <View style={styles.socialRow}>
              {community.website_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openSocialLink(community.website_url, 'Website')}
                >
                  <Ionicons name="globe-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}

              {community.twitter_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openSocialLink(community.twitter_url, 'X')}
                >
                  <Ionicons name="logo-twitter" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}

              {community.instagram_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openSocialLink(community.instagram_url, 'Instagram')}
                >
                  <Ionicons name="logo-instagram" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}

              {community.tiktok_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openSocialLink(community.tiktok_url, 'TikTok')}
                >
                  <Ionicons name="logo-tiktok" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}

              {community.facebook_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openSocialLink(community.facebook_url, 'Facebook')}
                >
                  <Ionicons name="logo-facebook" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}

              {community.youtube_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openSocialLink(community.youtube_url, 'YouTube')}
                >
                  <Ionicons name="logo-youtube" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>

        {/* Announcements Section */}
        <View style={styles.announcementsSection}>
          <TouchableOpacity
            style={styles.announcementsCard}
            onPress={onNavigateToAnnouncements}
            activeOpacity={0.7}
          >
            {/* Announcements header inside the box */}
            <View style={styles.announcementsSectionHeader}>
              <Ionicons name="megaphone" size={20} color={Colors.brand} style={styles.announcementIcon} />
              <Text style={styles.announcementsSectionTitle}>Announcements</Text>
              <Ionicons name="chevron-forward" size={20} color="#000000" style={styles.chevronIcon} />
            </View>

            {/* Announcements List */}
            {announcements.length > 0 ? (
              announcements.map((announcement, index) => (
                <View key={announcement.id}>
                  {index > 0 && <View style={styles.announcementDivider} />}
                  <View style={styles.announcementItem}>
                    <Text style={styles.announcementMessage} numberOfLines={1}>
                      {announcement.message}
                    </Text>
                    <Text style={styles.announcementTime}>
                      {formatAnnouncementDate(announcement.created_at)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyAnnouncementState}>
                <Ionicons name="megaphone-outline" size={32} color={Colors.brand} />
                <Text style={styles.emptyText}>No announcements yet</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Upcoming Matches Section */}
        <View style={styles.sessionsSection}>
          <TouchableOpacity
            style={styles.sessionsCard}
            onPress={onNavigateToSessions}
            activeOpacity={0.7}
          >
            {/* Matches header inside the box */}
            <View style={styles.sessionsSectionHeader}>
              <Ionicons name="calendar" size={20} color={Colors.brand} style={styles.sessionsIcon} />
              <Text style={styles.sessionsSectionTitle}>Upcoming Matches</Text>
              <Ionicons name="chevron-forward" size={20} color="#000000" style={styles.chevronIcon} />
            </View>

            {/* Sessions List */}
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session, index) => (
                <View key={session.id}>
                  {index > 0 && <View style={styles.sessionDivider} />}
                  <View style={styles.sessionSummary}>
                    <Text style={styles.sessionDateTime}>
                      {formatSessionDay(session.datetime)}, {formatSessionDate(session.datetime)} at {formatSessionTime(session.datetime)}
                    </Text>
                    <Text style={styles.sessionLocationPrice}>
                      {session.location} • AED {session.price}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptySessionsState}>
                <Ionicons name="calendar-outline" size={32} color={Colors.brand} />
                <Text style={styles.emptyText}>No upcoming matches</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Leave Community Button */}
        {isMember && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.leaveCommunityButton, isLeaving && styles.leaveCommunityButtonDisabled]}
              onPress={handleLeaveCommunity}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.leaveCommunityButtonText}>Leave Community</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  brandHeader: {
    backgroundColor: '#8FFE09',
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'flex-start',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
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
    color: '#000000',
    letterSpacing: 0.5,
  },
  ballIcon: {
    marginLeft: 2,
    marginRight: -2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.secondary,
    marginTop: Spacing.md,
  },
  emptyText: {
    ...TextStyles.body,
    color: Colors.secondary,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.backgroundSecondary,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.separatorLight,
  },
  infoCard: {
    backgroundColor: '#F5F5F5',
    marginTop: -40,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#000000',
    padding: Spacing.md,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -50,
    backgroundColor: Colors.backgroundElevated,
    ...Shadows.lg,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: Colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.backgroundElevated,
  },
  communityName: {
    ...TextStyles.title1,
    marginTop: Spacing.xs,
    textAlign: 'center',
    color: '#000000',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#000000',
    borderRadius: BorderRadius.md,
  },
  statText: {
    ...TextStyles.subheadline,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bioSection: {
    backgroundColor: '#F5F5F5',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#000000',
    padding: Spacing.md,
  },
  bioText: {
    ...TextStyles.body,
    color: '#000000',
    lineHeight: 22,
  },
  announcementsSection: {
    marginTop: Spacing.sm,
  },
  announcementsCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  announcementsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand,
  },
  announcementIcon: {
    marginRight: 6,
  },
  announcementsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  emptyAnnouncementState: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  announcementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  announcementMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: Spacing.sm,
  },
  announcementTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    flexShrink: 0,
  },
  announcementDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: Spacing.xs,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999999',
    marginTop: Spacing.md,
  },
  sessionsSection: {
    marginTop: Spacing.sm,
  },
  sessionsCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  sessionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand,
  },
  sessionsIcon: {
    marginRight: 6,
  },
  chevronIcon: {
    marginLeft: 'auto',
  },
  sessionsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  sessionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  sessionDateTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  sessionLocationPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'right',
  },
  sessionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: Spacing.xs,
  },
  emptySessionsState: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  sectionTitle: {
    ...TextStyles.title3,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  section: {
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  placeholderCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#000000',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    ...TextStyles.callout,
    color: Colors.secondary,
    marginTop: Spacing.sm,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  leaveCommunityButton: {
    flexDirection: 'row',
    backgroundColor: Colors.red,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  leaveCommunityButtonDisabled: {
    opacity: 0.6,
  },
  leaveCommunityButtonText: {
    ...TextStyles.callout,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
