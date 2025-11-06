import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, Spacing, BorderRadius, TextStyles } from '../styles/appleDesignSystem';

interface ChatOption {
  id: string;
  name: string;
  description?: string;
  location?: string;
  member_count?: number;
  profile_image?: string;
  is_parent: boolean;
}

interface ChatSelectionModalProps {
  visible: boolean;
  parentCommunityId: string;
  parentCommunityName: string;
  parentCommunityImage?: string;
  onSelectChat: (communityId: string, communityName: string, communityImage?: string) => void;
  onClose: () => void;
}

export default function ChatSelectionModal({
  visible,
  parentCommunityId,
  parentCommunityName,
  parentCommunityImage,
  onSelectChat,
  onClose,
}: ChatSelectionModalProps) {
  const [chatOptions, setChatOptions] = useState<ChatOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadChatOptions();
    }
  }, [visible, parentCommunityId]);

  const loadChatOptions = async () => {
    try {
      setIsLoading(true);

      // Load sub-communities - api.getSubCommunities already returns the array directly
      const subComms = await api.getSubCommunities(parentCommunityId);
      console.log('[ChatSelectionModal] Loaded sub-communities:', subComms.length);

      // Create chat options array with parent first
      const options: ChatOption[] = [
        {
          id: parentCommunityId,
          name: parentCommunityName,
          profile_image: parentCommunityImage,
          is_parent: true,
        },
        ...subComms.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          description: sub.description,
          location: sub.location,
          member_count: sub.member_count,
          profile_image: sub.profile_image,
          is_parent: false,
        })),
      ];

      console.log('[ChatSelectionModal] Total chat options:', options.length);
      setChatOptions(options);
    } catch (error: any) {
      console.error('[ChatSelectionModal] Load error:', error);
      Alert.alert('Error', 'Failed to load chat options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (option: ChatOption) => {
    onSelectChat(option.id, option.name, option.profile_image);
    onClose();
  };

  const renderChatOption = ({ item }: { item: ChatOption }) => {
    return (
      <TouchableOpacity
        style={[styles.chatOptionCard, item.is_parent && styles.parentChatCard]}
        onPress={() => handleSelectChat(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.profile_image ? (
            <Image
              source={{ uri: item.profile_image }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name={item.is_parent ? "people" : "location"}
                size={24}
                color={Colors.white}
              />
            </View>
          )}
        </View>

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.is_parent && (
              <View style={styles.parentBadge}>
                <Text style={styles.parentBadgeText}>Main Chat</Text>
              </View>
            )}
          </View>

          {item.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}

          {item.member_count !== undefined && (
            <View style={styles.memberRow}>
              <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.memberText}>
                {item.member_count} {item.member_count === 1 ? 'member' : 'members'}
              </Text>
            </View>
          )}
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Select Chat</Text>
            <Text style={styles.subtitle}>
              Choose which chat you'd like to view
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brand} />
            <Text style={styles.loadingText}>Loading chats...</Text>
          </View>
        ) : (
          <FlatList
            data={chatOptions}
            renderItem={renderChatOption}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No chats available</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TextStyles.title1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...TextStyles.subheadline,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  chatOptionCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.separator,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  parentChatCard: {
    borderColor: Colors.brand,
    backgroundColor: 'rgba(143, 254, 9, 0.05)',
  },
  avatarContainer: {
    marginRight: Spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs / 2,
  },
  chatName: {
    ...TextStyles.headline,
    flex: 1,
    marginRight: Spacing.xs,
  },
  parentBadge: {
    backgroundColor: Colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  parentBadgeText: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
