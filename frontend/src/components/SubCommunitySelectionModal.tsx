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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, Spacing, BorderRadius, TextStyles } from '../styles/appleDesignSystem';

interface SubCommunity {
  id: string;
  name: string;
  description?: string;
  location?: string;
  member_count?: number;
}

interface SubCommunitySelectionModalProps {
  visible: boolean;
  parentCommunityId: string;
  parentCommunityName: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function SubCommunitySelectionModal({
  visible,
  parentCommunityId,
  parentCommunityName,
  onComplete,
  onSkip,
}: SubCommunitySelectionModalProps) {
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSubCommunities();
    }
  }, [visible, parentCommunityId]);

  const loadSubCommunities = async () => {
    try {
      setIsLoading(true);
      const subComms = await api.getSubCommunities(parentCommunityId);
      console.log('[SubCommunityModal] Loaded sub-communities:', subComms);
      setSubCommunities(subComms);

      // Auto-select all sub-communities by default
      const allIds = new Set(subComms.map((sc: SubCommunity) => sc.id));
      setSelectedIds(allIds);
    } catch (error: any) {
      console.error('[SubCommunityModal] Load error:', error);
      Alert.alert('Error', 'Failed to load sub-communities');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubCommunity = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleJoinSelected = async () => {
    try {
      setIsJoining(true);
      await api.joinCommunityWithSubs(parentCommunityId, Array.from(selectedIds));

      Alert.alert(
        'Success!',
        `You've joined ${parentCommunityName}${selectedIds.size > 0 ? ` and ${selectedIds.size} location${selectedIds.size === 1 ? '' : 's'}` : ''}`,
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error: any) {
      console.error('[SubCommunityModal] Join error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to join communities');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSkip = async () => {
    try {
      setIsJoining(true);
      // Join parent only, no sub-communities
      await api.joinCommunityWithSubs(parentCommunityId, []);

      Alert.alert(
        'Joined!',
        `You've joined ${parentCommunityName}. You can join locations later.`,
        [{ text: 'OK', onPress: onSkip }]
      );
    } catch (error: any) {
      console.error('[SubCommunityModal] Skip error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to join community');
    } finally {
      setIsJoining(false);
    }
  };

  const renderSubCommunityItem = ({ item }: { item: SubCommunity }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.subCommunityCard, isSelected && styles.subCommunityCardSelected]}
        onPress={() => toggleSubCommunity(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.subCommunityInfo}>
          <View style={styles.subCommunityHeader}>
            <Text style={[styles.subCommunityName, isSelected && styles.textSelected]}>
              {item.name}
            </Text>
            {item.member_count !== undefined && (
              <View style={styles.memberBadge}>
                <Ionicons name="people" size={12} color={Colors.textSecondary} />
                <Text style={styles.memberCount}>{item.member_count}</Text>
              </View>
            )}
          </View>
          {item.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={isSelected ? Colors.brand : Colors.textSecondary} />
              <Text style={[styles.subCommunityLocation, isSelected && styles.textSelected]}>
                {item.location}
              </Text>
            </View>
          )}
          {item.description && (
            <Text style={[styles.subCommunityDescription, isSelected && styles.textSelected]}>
              {item.description}
            </Text>
          )}
        </View>

        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={18} color="#000000" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onSkip}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Select Locations</Text>
            <Text style={styles.subtitle}>
              {parentCommunityName} has multiple locations. Select the ones you'd like to join:
            </Text>
          </View>
          <TouchableOpacity onPress={onSkip} style={styles.closeButton} disabled={isJoining}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brand} />
            <Text style={styles.loadingText}>Loading locations...</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={subCommunities}
              renderItem={renderSubCommunityItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No locations available</Text>
                </View>
              }
            />

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.joinButton,
                  (isJoining || selectedIds.size === 0) && styles.buttonDisabled,
                ]}
                onPress={handleJoinSelected}
                disabled={isJoining || selectedIds.size === 0}
                activeOpacity={0.8}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.joinButtonText}>
                    Join {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.skipButton, isJoining && styles.buttonDisabled]}
                onPress={handleSkip}
                disabled={isJoining}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>Skip - Join Later</Text>
              </TouchableOpacity>
            </View>
          </>
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
  subCommunityCard: {
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
  subCommunityCardSelected: {
    borderColor: Colors.brand,
    backgroundColor: 'rgba(143, 254, 9, 0.1)',
  },
  subCommunityInfo: {
    flex: 1,
  },
  subCommunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  subCommunityName: {
    ...TextStyles.headline,
    flex: 1,
    marginRight: Spacing.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  memberCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  subCommunityLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  subCommunityDescription: {
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  textSelected: {
    color: Colors.brand,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.separator,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
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
  buttonContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  joinButton: {
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  skipButton: {
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.separator,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
