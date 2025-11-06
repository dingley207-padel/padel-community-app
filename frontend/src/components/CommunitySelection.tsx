import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import SubCommunitySelectionModal from './SubCommunitySelectionModal';

interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  profile_image?: string;
  manager_id: string;
}

interface CommunitySelectionProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function CommunitySelection({ onComplete, onSkip }: CommunitySelectionProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showSubCommunityModal, setShowSubCommunityModal] = useState(false);
  const [selectedCommunityForModal, setSelectedCommunityForModal] = useState<Community | null>(null);
  const [communitiesWithSubs, setCommunitiesWithSubs] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAllCommunities();
      console.log('[CommunitySelection] API response:', response);

      // Handle response structure - check if data is nested or direct
      const communitiesData = response.communities || response.data?.communities || response;
      console.log('[CommunitySelection] Communities data:', communitiesData);

      if (Array.isArray(communitiesData)) {
        // Filter out sub-communities - only show parent communities
        const parentCommunitiesOnly = communitiesData.filter((c: any) => !c.parent_community_id);
        setCommunities(parentCommunitiesOnly);
      } else {
        console.error('[CommunitySelection] Invalid communities data structure:', communitiesData);
        Alert.alert('Error', 'Invalid data format received');
      }
    } catch (error: any) {
      console.error('[CommunitySelection] Load communities error:', error);
      console.error('[CommunitySelection] Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCommunity = (communityId: string) => {
    setSelectedCommunities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(communityId)) {
        newSet.delete(communityId);
      } else {
        newSet.add(communityId);
      }
      return newSet;
    });
  };

  const handleJoinCommunities = async () => {
    if (selectedCommunities.size === 0) {
      Alert.alert('Please Select', 'Please select at least one community to join');
      return;
    }

    setIsJoining(true);
    try {
      const selectedArray = Array.from(selectedCommunities);

      // Check if any selected communities have sub-communities
      let hasSubCommunities = false;
      for (const communityId of selectedArray) {
        try {
          const subCommResponse = await api.getSubCommunities(communityId);
          const subs = subCommResponse.sub_communities || [];
          if (subs.length > 0) {
            hasSubCommunities = true;
            communitiesWithSubs.set(communityId, subs.map((s: any) => s.id));
          }
        } catch (error) {
          console.error('[CommunitySelection] Error checking subs:', error);
        }
      }

      if (hasSubCommunities) {
        // For now, join first community with subs and show modal
        // In future, could batch process multiple communities with subs
        const firstCommunityWithSubs = selectedArray.find(id => communitiesWithSubs.has(id));
        if (firstCommunityWithSubs) {
          const community = communities.find(c => c.id === firstCommunityWithSubs);
          if (community) {
            setSelectedCommunityForModal(community);
            setShowSubCommunityModal(true);
            setIsJoining(false);
            return;
          }
        }
      }

      // No sub-communities, join all normally
      const joinPromises = selectedArray.map((communityId) =>
        api.joinCommunity(communityId)
      );

      await Promise.all(joinPromises);

      Alert.alert(
        'Success!',
        `You've joined ${selectedCommunities.size} ${
          selectedCommunities.size === 1 ? 'community' : 'communities'
        }`,
        [{ text: 'Get Started', onPress: onComplete }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to join communities');
      console.error('Join communities error:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleModalComplete = () => {
    setShowSubCommunityModal(false);
    setSelectedCommunityForModal(null);
    onComplete();
  };

  const handleModalSkip = () => {
    setShowSubCommunityModal(false);
    setSelectedCommunityForModal(null);
    onComplete();
  };

  const renderCommunityItem = ({ item }: { item: Community }) => {
    const isSelected = selectedCommunities.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.communityCard, isSelected && styles.communityCardSelected]}
        onPress={() => toggleCommunity(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.communityCardContent}>
          <View style={styles.communityInfo}>
            <Text style={[styles.communityName, isSelected && styles.communityNameSelected]}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={[styles.communityDescription, isSelected && styles.textSelected]}>
                {item.description}
              </Text>
            )}
            {item.location && (
              <Text style={[styles.communityLocation, isSelected && styles.textSelected]}>
                {item.location}
              </Text>
            )}
          </View>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading communities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Communities</Text>
      <Text style={styles.subtitle}>
        Select the padel communities you'd like to join. You can join more later!
      </Text>

      <FlatList
        data={communities}
        renderItem={renderCommunityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.joinButton, isJoining && styles.buttonDisabled]}
          onPress={handleJoinCommunities}
          disabled={isJoining || selectedCommunities.size === 0}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#10B981', '#059669']} style={styles.gradient}>
            {isJoining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                Join {selectedCommunities.size > 0 ? `(${selectedCommunities.size})` : ''}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {onSkip && (
          <TouchableOpacity
            style={[styles.button, styles.skipButton]}
            onPress={onSkip}
            disabled={isJoining}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>

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
    backgroundColor: '#1F2937',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
    lineHeight: 22,
  },
  listContainer: {
    paddingBottom: 20,
  },
  communityCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  communityCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#065F46',
  },
  communityCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  communityInfo: {
    flex: 1,
    marginRight: 12,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  communityNameSelected: {
    color: '#FFFFFF',
  },
  communityDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  communityLocation: {
    fontSize: 13,
    color: '#6B7280',
  },
  textSelected: {
    color: '#D1FAE5',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  joinButton: {
    height: 56,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
});
