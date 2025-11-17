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
  Modal,
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
  onViewCommunity?: (communityId: string) => void;
}

export default function CommunityDetailScreen({ communityId, onBack, showBackButton = true, onNavigateToSessions, onNavigateToAnnouncements, onViewCommunity }: CommunityDetailScreenProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [subCommunities, setSubCommunities] = useState<Community[]>([]);
  const [showSubCommunitiesModal, setShowSubCommunitiesModal] = useState(false);
  const [subCommunityMemberships, setSubCommunityMemberships] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadCommunityDetails();
    checkMembership();
    loadUpcomingSessions();
    loadAnnouncements();
    loadSubCommunities();
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

  const loadSubCommunities = async () => {
    try {
      const subCommunitiesData = await api.getSubCommunities(communityId);
      setSubCommunities(subCommunitiesData);

      // Check membership for each sub-community
      await checkSubCommunityMemberships(subCommunitiesData);
    } catch (error) {
      console.error('Load sub-communities error:', error);
    }
  };

  const checkSubCommunityMemberships = async (subs: Community[]) => {
    try {
      const response = await api.getUserCommunities();
      const myCommunities = response.communities || response.data?.communities || [];
      const mySubCommunityIds = new Set(myCommunities.map((c: Community) => c.id));

      const memberships: {[key: string]: boolean} = {};
      subs.forEach(sub => {
        memberships[sub.id] = mySubCommunityIds.has(sub.id);
      });

      setSubCommunityMemberships(memberships);
    } catch (error) {
      console.error('Check sub-community memberships error:', error);
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

  const handleJoinSubCommunity = async (subCommunityId: string) => {
    try {
      await api.joinSubCommunity(communityId, subCommunityId);

      // Update membership state
      setSubCommunityMemberships(prev => ({
        ...prev,
        [subCommunityId]: true
      }));

      // Reload sub-communities to update member count
      await loadSubCommunities();
    } catch (error: any) {
      console.error('Join sub-community error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to join sub-community');
    }
  };

  const handleLeaveSubCommunity = async (subCommunityId: string) => {
    try {
      await api.leaveSubCommunity(communityId, subCommunityId);

      // Update membership state
      setSubCommunityMemberships(prev => ({
        ...prev,
        [subCommunityId]: false
      }));

      // Reload sub-communities to update member count
      await loadSubCommunities();
    } catch (error: any) {
      console.error('Leave sub-community error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to leave sub-community');
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
        {/* Green Header */}
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
        {/* Green Header */}
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
      {/* Green Header with Community Logo */}
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

        {/* Community Name in Header */}
        <Text style={styles.headerCommunityName}>{community.name}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Image with Logo */}
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

          {/* Logo in top right of banner */}
          <View style={styles.bannerLogoContainer}>
            {community.profile_image ? (
              <Image
                source={{ uri: community.profile_image }}
                style={styles.bannerLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bannerLogoPlaceholder}>
                <Ionicons name="people" size={20} color={Colors.secondary} />
              </View>
            )}
          </View>
        </View>

        {/* Community Info Card */}
        <View style={styles.infoCard}>

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

          {/* Sub-Communities Dropdown - inside info card */}
          {subCommunities.length > 0 && (
            <TouchableOpacity
              style={styles.subCommunitiesDropdownInCard}
              onPress={() => setShowSubCommunitiesModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownContent}>
                <Ionicons name="git-branch" size={20} color={Colors.brand} />
                <Text style={styles.dropdownText}>View Sub-Communities ({subCommunities.length})</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
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

        {/* Leave Community Button - Discreet */}
        {isMember && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.leaveCommunityButton, isLeaving && styles.leaveCommunityButtonDisabled]}
              onPress={handleLeaveCommunity}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <ActivityIndicator size="small" color="#999999" />
              ) : (
                <Text style={styles.leaveCommunityButtonText}>Leave Community</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sub-Communities Modal */}
      <Modal
        visible={showSubCommunitiesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubCommunitiesModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubCommunitiesModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sub-Communities</Text>
              <TouchableOpacity
                onPress={() => setShowSubCommunitiesModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {subCommunities.map((subCommunity, index) => {
                const isMember = subCommunityMemberships[subCommunity.id];
                return (
                  <View
                    key={subCommunity.id}
                    style={[
                      styles.modalSubCommunityItem,
                      index === subCommunities.length - 1 && styles.modalSubCommunityItemLast
                    ]}
                  >
                    {/* Logo */}
                    <View style={styles.modalSubCommunityLogoContainer}>
                      {subCommunity.profile_image ? (
                        <Image
                          source={{ uri: subCommunity.profile_image }}
                          style={styles.modalSubCommunityLogo}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.modalSubCommunityLogoPlaceholder}>
                          <Ionicons name="people" size={24} color={Colors.secondary} />
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.modalSubCommunityInfo}>
                      <Text style={styles.modalSubCommunityName}>{subCommunity.name}</Text>
                      {subCommunity.location && (
                        <View style={styles.modalSubCommunityLocationContainer}>
                          <Ionicons name="location-outline" size={14} color={Colors.secondary} />
                          <Text style={styles.modalSubCommunityLocation}>{subCommunity.location}</Text>
                        </View>
                      )}
                      {subCommunity.member_count !== undefined && (
                        <Text style={styles.modalSubCommunityMembers}>
                          {subCommunity.member_count} {subCommunity.member_count === 1 ? 'member' : 'members'}
                        </Text>
                      )}
                    </View>

                    {/* Join/Leave Button */}
                    <TouchableOpacity
                      style={[
                        styles.subCommunityActionButton,
                        isMember ? styles.subCommunityLeaveButton : styles.subCommunityJoinButton
                      ]}
                      onPress={() => {
                        if (isMember) {
                          handleLeaveSubCommunity(subCommunity.id);
                        } else {
                          handleJoinSubCommunity(subCommunity.id);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.subCommunityActionButtonText,
                        isMember ? styles.subCommunityLeaveButtonText : styles.subCommunityJoinButtonText
                      ]}>
                        {isMember ? 'Leave' : 'Join'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  headerCommunityName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
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
    position: 'relative',
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
  bannerLogoContainer: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: Colors.backgroundElevated,
    ...Shadows.lg,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  bannerLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 37.5,
  },
  bannerLogoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 37.5,
    backgroundColor: Colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: Spacing.md,
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
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  leaveCommunityButtonDisabled: {
    opacity: 0.5,
  },
  leaveCommunityButtonText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  subCommunitiesSection: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  subCommunitiesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  subCommunitiesSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  subCommunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subCommunityLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  subCommunityLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  subCommunityLogoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: Colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCommunityInfo: {
    flex: 1,
  },
  subCommunityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: Spacing.xs,
  },
  subCommunityLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subCommunityLocation: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.secondary,
  },
  subCommunityViewButton: {
    backgroundColor: Colors.brand,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#000000',
  },
  subCommunityViewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  // Sub-Communities Dropdown
  subCommunitiesSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  subCommunitiesDropdown: {
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  subCommunitiesDropdownInCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginTop: Spacing.md,
    width: '100%',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '80%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  modalSubCommunityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalSubCommunityItemLast: {
    borderBottomWidth: 0,
  },
  modalSubCommunityLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
  },
  modalSubCommunityLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  modalSubCommunityLogoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: Colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubCommunityInfo: {
    flex: 1,
  },
  modalSubCommunityName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubCommunityLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  modalSubCommunityLocation: {
    fontSize: 13,
    color: Colors.secondary,
  },
  modalSubCommunityMembers: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  subCommunityActionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCommunityJoinButton: {
    backgroundColor: Colors.brand,
  },
  subCommunityLeaveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  subCommunityActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subCommunityJoinButtonText: {
    color: Colors.dark,
  },
  subCommunityLeaveButtonText: {
    color: Colors.textSecondary,
  },
});
