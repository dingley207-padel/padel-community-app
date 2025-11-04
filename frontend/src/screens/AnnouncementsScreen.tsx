import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

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
  users?: {
    id: string;
    name: string;
    profile_image?: string;
  };
}

interface AnnouncementsScreenProps {
  onBack: () => void;
  onNavigateToSessions?: (communityId: string) => void;
}

export default function AnnouncementsScreen({ onBack, onNavigateToSessions }: AnnouncementsScreenProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await api.getMyAnnouncements();
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAnnouncements();
    setIsRefreshing(false);
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={styles.headerTitle}>Announcements</Text>
          <TouchableOpacity onPress={onBack} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000000" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity onPress={onBack} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#000000" />
        </TouchableOpacity>
      </View>

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
        {announcements.length > 0 ? (
          <View style={styles.announcementsList}>
            {announcements.map((announcement, index) => (
              <TouchableOpacity
                key={announcement.id}
                style={styles.announcementCard}
                onPress={() => {
                  if (onNavigateToSessions && announcement.community_id) {
                    onNavigateToSessions(announcement.community_id);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.announcementHeader}>
                  <View style={styles.communityBadge}>
                    <Text style={styles.communityBadgeText}>
                      {announcement.communities?.name || 'Community'}
                    </Text>
                  </View>
                  <Text style={styles.announcementTime}>
                    {formatAnnouncementDate(announcement.created_at)}
                  </Text>
                </View>
                <Text style={styles.announcementMessage}>
                  {announcement.message}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color={Colors.brand} />
            <Text style={styles.emptyTitle}>No announcements yet</Text>
            <Text style={styles.emptySubtitle}>
              Check back later for updates from your communities
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.brand,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TextStyles.title2,
    fontWeight: '700',
    color: '#000000',
  },
  placeholder: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  announcementsList: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  announcementCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.md,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  communityBadge: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  communityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand,
  },
  announcementTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999999',
  },
  announcementMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...TextStyles.title3,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
