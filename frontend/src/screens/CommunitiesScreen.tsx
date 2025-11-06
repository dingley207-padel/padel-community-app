import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';
import SubCommunitySelectionModal from '../components/SubCommunitySelectionModal';

interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  profile_image?: string;
  manager_id: string;
}

interface CommunitiesScreenProps {
  onBack: () => void;
  onCreateCommunity?: () => void;
  isSuperAdmin?: boolean;
  onViewCommunity?: (communityId: string) => void;
  onOpenMenu?: () => void;
}

export default function CommunitiesScreen({ onBack, onCreateCommunity, isSuperAdmin, onViewCommunity, onOpenMenu }: CommunitiesScreenProps) {
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joiningIds, setJoiningIds] = useState<Set<string>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState<'my' | 'other'>('my');
  const [showSubCommunityModal, setShowSubCommunityModal] = useState(false);
  const [selectedCommunityForModal, setSelectedCommunityForModal] = useState<Community | null>(null);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Load both all communities and user's communities
      const [allResponse, myResponse] = await Promise.all([
        api.getAllCommunities(),
        api.getUserCommunities(),
      ]);

      const allComms = allResponse.communities || allResponse.data?.communities || [];
      const myComms = myResponse.communities || myResponse.data?.communities || [];

      // Filter out sub-communities from all communities list (only show parent communities)
      const parentCommunitiesOnly = allComms.filter((c: any) => !c.parent_community_id);

      // Filter out sub-communities from user's communities list (only show parent communities)
      const myParentCommunitiesOnly = myComms.filter((c: any) => !c.parent_community_id);

      setAllCommunities(parentCommunitiesOnly);
      setMyCommunities(myParentCommunitiesOnly);
    } catch (error: any) {
      console.error('Load communities error:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadCommunities(true);
  };

  const isJoined = (communityId: string): boolean => {
    return myCommunities.some((c) => c.id === communityId);
  };

  const handleJoinCommunity = async (community: Community) => {
    setJoiningIds((prev) => new Set(prev).add(community.id));
    try {
      // Check if community has sub-communities first
      const subCommunities = await api.getSubCommunities(community.id);

      if (subCommunities.length > 0) {
        // Show modal for sub-community selection
        setSelectedCommunityForModal(community);
        setShowSubCommunityModal(true);
        setJoiningIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(community.id);
          return newSet;
        });
      } else {
        // No sub-communities, join normally
        await api.joinCommunity(community.id);
        await loadCommunities();
        Alert.alert('Success', `You've joined ${community.name}!`);
        setJoiningIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(community.id);
          return newSet;
        });
      }
    } catch (error: any) {
      console.error('[CommunitiesScreen] Join error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to join community');
      setJoiningIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(community.id);
        return newSet;
      });
    }
  };

  const handleModalComplete = async () => {
    setShowSubCommunityModal(false);
    setSelectedCommunityForModal(null);
    await loadCommunities();
  };

  const handleModalSkip = async () => {
    setShowSubCommunityModal(false);
    setSelectedCommunityForModal(null);
    await loadCommunities();
  };

  const handleViewCommunity = (community: Community) => {
    if (onViewCommunity) {
      onViewCommunity(community.id);
    } else {
      // Fallback for when navigation isn't available
      Alert.alert(
        community.name,
        `${community.description || 'View community details'}\n\nLocation: ${community.location || 'Not specified'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderCommunityItem = ({ item }: { item: Community }) => {
    const joined = isJoined(item.id);
    const isProcessing = joiningIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.communityCard}
        onPress={() => (joined ? handleViewCommunity(item) : handleJoinCommunity(item))}
        disabled={isProcessing}
        activeOpacity={0.7}
      >
        {/* Community Logo */}
        <View style={styles.logoContainer}>
          {item.profile_image ? (
            <Image
              source={{ uri: item.profile_image }}
              style={styles.communityLogo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="people" size={28} color={Colors.secondary} />
            </View>
          )}
        </View>

        {/* Community Info - Takes full width */}
        <View style={styles.communityInfo}>
          <Text style={styles.communityName} numberOfLines={1}>{item.name}</Text>
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color={Colors.secondary} />
              <Text style={styles.communityLocation} numberOfLines={1}>{item.location}</Text>
            </View>
          )}
        </View>

        {/* Chevron or Loading Indicator */}
        {isProcessing ? (
          <ActivityIndicator size="small" color={Colors.brand} />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={24}
            color="#000000"
          />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      </View>
    );
  }

  // Filter communities based on selected filter
  const getFilteredCommunities = () => {
    if (selectedFilter === 'my') {
      return myCommunities;
    } else {
      // Other Communities - exclude joined communities
      const myCommIds = new Set(myCommunities.map(c => c.id));
      return allCommunities.filter(c => !myCommIds.has(c.id));
    }
  };

  const filteredCommunities = getFilteredCommunities();

  return (
    <View style={styles.container}>
      {/* Green Header with Communities Title */}
      <View style={styles.brandHeader}>
        <View style={styles.appNameRow}>
          {/* C text - black */}
          <Text style={styles.appName}>C</Text>

          {/* Tennis ball icon - black */}
          <Ionicons name="tennisball" size={24} color="#000000" style={styles.ballIcon} />

          {/* mmunities text - black */}
          <Text style={styles.appName}>mmunities</Text>
        </View>

        {/* Burger Menu Button */}
        {onOpenMenu && (
          <TouchableOpacity onPress={onOpenMenu} style={styles.burgerButton}>
            <Ionicons name="menu" size={24} color="#000000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTabBlack, selectedFilter === 'my' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('my')}
        >
          <Text
            style={[
              styles.filterTabTextWhite,
              selectedFilter === 'my' && styles.filterTabTextActive,
            ]}
          >
            My Communities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTabBlack, selectedFilter === 'other' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('other')}
        >
          <Text
            style={[
              styles.filterTabTextWhite,
              selectedFilter === 'other' && styles.filterTabTextActive,
            ]}
          >
            Other Communities
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCommunities}
        renderItem={renderCommunityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brand}
            colors={[Colors.brand]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={Colors.secondary} />
            <Text style={styles.emptyText}>
              {selectedFilter === 'my'
                ? 'You haven\'t joined any communities yet'
                : 'No other communities available'}
            </Text>
          </View>
        }
      />

      {isSuperAdmin && onCreateCommunity && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={onCreateCommunity}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Sub-Community Selection Modal */}
      {selectedCommunityForModal && (
        <SubCommunitySelectionModal
          visible={showSubCommunityModal}
          parentCommunityId={selectedCommunityForModal.id}
          parentCommunityName={selectedCommunityForModal.name}
          onComplete={handleModalComplete}
          onSkip={handleModalSkip}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  brandHeader: {
    backgroundColor: Colors.brand,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginLeft: -2,
    marginRight: 0,
    marginBottom: -4,
  },
  burgerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.secondary,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    gap: Spacing.sm,
  },
  filterTabBlack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
  },
  filterTabActive: {
    backgroundColor: '#8FFE09',
    borderColor: '#000000',
    borderWidth: 2,
  },
  filterTabTextWhite: {
    ...TextStyles.subheadline,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  listContainer: {
    padding: Spacing.md,
  },
  communityCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#000000',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  communityLogo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 12,
  },
  communityInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityLocation: {
    fontSize: 13,
    color: Colors.secondary,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.secondary,
  },
  createButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
