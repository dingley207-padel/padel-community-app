import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

interface User {
  id: string;
  name: string;
  profile_image?: string;
  skill_level?: string;
  location?: string;
}

interface Friend {
  friendshipId: string;
  friend: User;
  since: string;
}

interface FriendRequest {
  id: string;
  requester: User;
  addressee?: User;
  created_at: string;
  status: string;
}

type TabType = 'suggestions' | 'friends' | 'requests';

export default function FriendsScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('suggestions');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [suggestedFriends, setSuggestedFriends] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  // Action states
  const [sendingRequestTo, setSendingRequestTo] = useState<Set<string>>(new Set());
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      if (activeTab === 'suggestions') {
        const response = await api.getSuggestedFriends();
        setSuggestedFriends(response.suggestions || []);
      } else if (activeTab === 'friends') {
        const response = await api.getFriends();
        setFriends(response.friends || []);
      } else if (activeTab === 'requests') {
        const [pendingRes, sentRes] = await Promise.all([
          api.getPendingFriendRequests(),
          api.getSentFriendRequests(),
        ]);
        setPendingRequests(pendingRes.requests || []);
        setSentRequests(sentRes.requests || []);
      }
    } catch (error: any) {
      console.error('Load friends data error:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingRequestTo(prev => new Set(prev).add(userId));
    try {
      await api.sendFriendRequest(userId);
      Alert.alert('Success', 'Friend request sent!');
      // Refresh to update the list
      loadData(true);
    } catch (error: any) {
      console.error('Send request error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send friend request');
    } finally {
      setSendingRequestTo(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    setProcessingRequestId(friendshipId);
    try {
      await api.acceptFriendRequest(friendshipId);
      Alert.alert('Success', 'Friend request accepted!');
      loadData(true);
    } catch (error: any) {
      console.error('Accept request error:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    setProcessingRequestId(friendshipId);
    try {
      await api.rejectFriendRequest(friendshipId);
      Alert.alert('Success', 'Friend request rejected');
      loadData(true);
    } catch (error: any) {
      console.error('Reject request error:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setProcessingRequestId(friendshipId);
            try {
              await api.removeFriend(friendshipId);
              Alert.alert('Success', 'Friend removed');
              loadData(true);
            } catch (error: any) {
              console.error('Remove friend error:', error);
              Alert.alert('Error', 'Failed to remove friend');
            } finally {
              setProcessingRequestId(null);
            }
          },
        },
      ]
    );
  };

  const renderUserCard = (user: User, showAddButton: boolean = true) => {
    const isSending = sendingRequestTo.has(user.id);

    return (
      <View key={user.id} style={styles.userCard}>
        <View style={styles.userInfo}>
          {user.profile_image ? (
            <Image
              source={{ uri: user.profile_image }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={Colors.secondary} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            {user.skill_level && (
              <Text style={styles.userMeta}>Grade: {user.skill_level}</Text>
            )}
            {user.location && (
              <Text style={styles.userMeta}>📍 {user.location}</Text>
            )}
          </View>
        </View>
        {showAddButton && (
          <TouchableOpacity
            style={[styles.addButton, isSending && styles.addButtonDisabled]}
            onPress={() => handleSendRequest(user.id)}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.brand} />
            ) : (
              <Ionicons name="person-add" size={20} color={Colors.brand} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFriendCard = (friendData: Friend) => {
    const { friend, friendshipId } = friendData;
    const isProcessing = processingRequestId === friendshipId;

    return (
      <View key={friendshipId} style={styles.userCard}>
        <View style={styles.userInfo}>
          {friend.profile_image ? (
            <Image
              source={{ uri: friend.profile_image }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={Colors.secondary} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{friend.name}</Text>
            {friend.skill_level && (
              <Text style={styles.friendGradeText}>Grade: {friend.skill_level}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFriend(friendshipId, friend.name)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.red} />
          ) : (
            <Ionicons name="close-circle" size={24} color={Colors.red} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestCard = (request: FriendRequest, isPending: boolean) => {
    const user = isPending ? request.requester : request.addressee;
    const isProcessing = processingRequestId === request.id;

    if (!user) return null;

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.userInfo}>
          {user.profile_image ? (
            <Image
              source={{ uri: user.profile_image }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={Colors.secondary} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            {user.skill_level && (
              <Text style={styles.userMeta}>Grade: {user.skill_level}</Text>
            )}
            <Text style={styles.requestTime}>
              {isPending ? 'Sent you a request' : 'Request sent'}
            </Text>
          </View>
        </View>
        {isPending && (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleAcceptRequest(request.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleRejectRequest(request.id)}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (activeTab === 'suggestions') {
      if (suggestedFriends.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={Colors.secondary} />
            <Text style={styles.emptyTitle}>No Suggestions</Text>
            <Text style={styles.emptySubtitle}>
              Join communities to find friends
            </Text>
          </View>
        );
      }
      return suggestedFriends.map(user => renderUserCard(user, true));
    }

    if (activeTab === 'friends') {
      if (friends.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-add-outline" size={64} color={Colors.secondary} />
            <Text style={styles.emptyTitle}>No Friends Yet</Text>
            <Text style={styles.emptySubtitle}>
              Send friend requests to connect with others
            </Text>
          </View>
        );
      }
      return friends.map(friend => renderFriendCard(friend));
    }

    if (activeTab === 'requests') {
      if (pendingRequests.length === 0 && sentRequests.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color={Colors.secondary} />
            <Text style={styles.emptyTitle}>No Requests</Text>
            <Text style={styles.emptySubtitle}>
              You have no pending friend requests
            </Text>
          </View>
        );
      }
      return (
        <>
          {pendingRequests.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Received Requests</Text>
              {pendingRequests.map(request => renderRequestCard(request, true))}
            </>
          )}
          {sentRequests.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Sent Requests</Text>
              {sentRequests.map(request => renderRequestCard(request, false))}
            </>
          )}
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Green Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Friends</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suggestions' && styles.tabActive]}
          onPress={() => setActiveTab('suggestions')}
        >
          <Ionicons
            name="search"
            size={20}
            color={activeTab === 'suggestions' ? '#000000' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'suggestions' && styles.tabTextActive,
            ]}
          >
            Discover
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'friends' ? '#000000' : '#FFFFFF'}
          />
          <Text
            style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}
          >
            Friends
          </Text>
          {friends.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friends.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Ionicons
            name="mail"
            size={20}
            color={activeTab === 'requests' ? '#000000' : '#FFFFFF'}
          />
          <Text
            style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}
          >
            Requests
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor={Colors.brand}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#8FFE09',
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'flex-start',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  pageTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
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
  tabActive: {
    backgroundColor: '#8FFE09',
    borderColor: '#000000',
    borderWidth: 2,
  },
  tabText: {
    ...TextStyles.subheadline,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...TextStyles.caption2,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.secondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    ...TextStyles.title3,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...TextStyles.callout,
    color: Colors.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...TextStyles.title3,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...TextStyles.callout,
    fontWeight: '600',
    marginBottom: 2,
  },
  userMeta: {
    ...TextStyles.caption1,
    color: Colors.secondary,
  },
  friendGradeText: {
    ...TextStyles.caption1,
    color: Colors.brand,
    fontWeight: '600',
  },
  requestTime: {
    ...TextStyles.caption1,
    color: Colors.secondary,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
