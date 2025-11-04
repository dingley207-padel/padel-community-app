import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

type RootStackParamList = {
  ChatDetail: { communityId: string; communityName: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CommunityChat {
  community_id: string;
  community_name: string;
  community_profile_image?: string;
  member_count: number;
  last_message?: string;
  last_message_time?: string;
  last_message_sender?: string;
}

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [chats, setChats] = useState<CommunityChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const response = await api.getCommunityChats();
      setChats(response.chats || []);
    } catch (error) {
      console.error('Error fetching community chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    // Parse timestamp - Supabase returns timestamps without 'Z' suffix
    // Treat them as UTC by appending 'Z' if not present
    const timestampStr = timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`;
    const date = new Date(timestampStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleChatPress = (chat: CommunityChat) => {
    navigation.navigate('ChatDetail', {
      communityId: chat.community_id,
      communityName: chat.community_name,
      communityProfileImage: chat.community_profile_image,
    });
  };

  return (
    <View style={styles.container}>
      {/* Green Header with Chats Title */}
      <View style={styles.brandHeader}>
        <Text style={styles.pageTitle}>Chats</Text>
      </View>

      {/* Community Chats List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.conversationsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {chats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No community chats yet</Text>
              <Text style={styles.emptySubtext}>
                Community chats will appear here once messages are sent
              </Text>
            </View>
          ) : (
            chats.map((chat) => (
              <TouchableOpacity
                key={chat.community_id}
                style={styles.conversationItem}
                onPress={() => handleChatPress(chat)}
              >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  {chat.community_profile_image ? (
                    <Image
                      source={{ uri: chat.community_profile_image }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {chat.community_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {chat.community_name}
                    </Text>
                    <Text style={styles.timestamp}>
                      {formatTimestamp(chat.last_message_time)}
                    </Text>
                  </View>

                  <View style={styles.conversationBody}>
                    <View style={styles.messagePreviewContainer}>
                      <Text style={styles.communityTag} numberOfLines={1}>
                        {chat.member_count} members
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    position: 'relative' as const,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    ...TextStyles.headline,
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...TextStyles.headline,
    color: Colors.white,
    fontWeight: '600',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs / 2,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  unreadBadgeText: {
    ...TextStyles.caption2,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs / 2,
  },
  userName: {
    ...TextStyles.headline,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    ...TextStyles.caption1,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  conversationBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagePreviewContainer: {
    flex: 1,
  },
  communityTag: {
    ...TextStyles.caption1,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  lastMessage: {
    ...TextStyles.body,
    color: Colors.textSecondary,
  },
});

export default ChatScreen;
