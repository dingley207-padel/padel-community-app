import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import api from '../services/api';

interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  joinedAt: string;
  totalBookings: number;
  activeBookings: number;
  cancelledBookings: number;
  lastBookingDate: string | null;
  sub_community_id?: string;
}

interface SubCommunity {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
}

interface MembersScreenProps {
  communityId: string;
  onBack: () => void;
}

export default function MembersScreen({ communityId, onBack }: MembersScreenProps) {
  console.log('[MembersScreen] Component mounted/rendered');
  const [members, setMembers] = useState<Member[]>([]);
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [selectedSubCommunity, setSelectedSubCommunity] = useState<SubCommunity | null>(null);
  const [showSubCommunitySelector, setShowSubCommunitySelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('[MembersScreen] useEffect running');
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadMembers(), loadSubCommunities()]);
  };

  const loadMembers = async () => {
    try {
      console.log('[MembersScreen] Loading members...');
      const response = await api.getCommunityMembers();
      console.log('[MembersScreen] Response:', response);
      console.log('[MembersScreen] Members count:', response.members?.length || 0);
      setMembers(response.members || []);
    } catch (error) {
      console.error('[MembersScreen] Error loading members:', error);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadSubCommunities = async () => {
    try {
      console.log('[MembersScreen] Loading sub-communities...');
      const subComs = await api.getSubCommunities(communityId);
      console.log('[MembersScreen] Sub-communities:', subComs);
      setSubCommunities(subComs || []);
    } catch (error) {
      console.error('[MembersScreen] Error loading sub-communities:', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const filteredMembers = selectedSubCommunity
    ? members.filter((member) => member.sub_community_id === selectedSubCommunity.id)
    : (() => {
        // Deduplicate members by user ID for "All Members" view
        const uniqueMembers = new Map<string, typeof members[0]>();
        members.forEach((member) => {
          const existing = uniqueMembers.get(member.id);
          if (!existing) {
            uniqueMembers.set(member.id, member);
          } else {
            // Aggregate booking stats
            existing.totalBookings += member.totalBookings;
            existing.activeBookings += member.activeBookings;
            existing.cancelledBookings += member.cancelledBookings;
            // Use the earliest join date
            if (new Date(member.joinedAt) < new Date(existing.joinedAt)) {
              existing.joinedAt = member.joinedAt;
            }
            // Use the most recent booking date
            if (member.lastBookingDate && (!existing.lastBookingDate ||
                new Date(member.lastBookingDate) > new Date(existing.lastBookingDate))) {
              existing.lastBookingDate = member.lastBookingDate;
            }
          }
        });
        return Array.from(uniqueMembers.values());
      })();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderMember = ({ item }: { item: Member }) => {
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberInitial}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.name}</Text>
            {item.email && (
              <Text style={styles.memberContact}>📧 {item.email}</Text>
            )}
            {item.phone && (
              <Text style={styles.memberContact}>📱 {item.phone}</Text>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.totalBookings}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#00D4AA' }]}>
              {item.activeBookings}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
              {item.cancelledBookings}
            </Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>

        <View style={styles.memberFooter}>
          <Text style={styles.footerText}>
            Joined: {formatDate(item.joinedAt)}
          </Text>
          <Text style={styles.footerText}>
            Last Booking: {formatDate(item.lastBookingDate)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Sub-Community Selector */}
      {subCommunities.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by Group</Text>
          <TouchableOpacity
            style={styles.subCommunitySelector}
            onPress={() => setShowSubCommunitySelector(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectorLeft}>
              <Text style={styles.selectorEmoji}>
                {selectedSubCommunity?.emoji || '👥'}
              </Text>
              <Text style={styles.selectorText}>
                {selectedSubCommunity?.name || 'All Members'}
              </Text>
            </View>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Member Count */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          {selectedSubCommunity ? 'Group' : 'Total'} Members:{' '}
          <Text style={styles.summaryValue}>{filteredMembers.length}</Text>
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00D4AA" />
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#00D4AA"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No members found</Text>
              <Text style={styles.emptySubtext}>
                {selectedSubCommunity
                  ? `No members in ${selectedSubCommunity.name}`
                  : 'Members will appear here once they book matches'}
              </Text>
            </View>
          }
        />
      )}

      {/* Sub-Community Selector Modal */}
      <Modal
        visible={showSubCommunitySelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubCommunitySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Group</Text>
              <TouchableOpacity onPress={() => setShowSubCommunitySelector(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {/* All Members Option */}
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  !selectedSubCommunity && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setSelectedSubCommunity(null);
                  setShowSubCommunitySelector(false);
                }}
              >
                <View style={styles.modalItemLeft}>
                  <Text style={styles.modalItemEmoji}>👥</Text>
                  <Text style={styles.modalItemText}>All Members</Text>
                </View>
                {!selectedSubCommunity && (
                  <Text style={styles.modalItemCheck}>✓</Text>
                )}
              </TouchableOpacity>

              {/* Sub-Community Options */}
              {subCommunities.map((subCom) => (
                <TouchableOpacity
                  key={subCom.id}
                  style={[
                    styles.modalItem,
                    selectedSubCommunity?.id === subCom.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedSubCommunity(subCom);
                    setShowSubCommunitySelector(false);
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <Text style={styles.modalItemEmoji}>{subCom.emoji || '📁'}</Text>
                    <View>
                      <Text style={styles.modalItemText}>{subCom.name}</Text>
                      {subCom.description && (
                        <Text style={styles.modalItemDescription}>
                          {subCom.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  {selectedSubCommunity?.id === subCom.id && (
                    <Text style={styles.modalItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // Compact Header - Dashboard Style
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 60,
  },
  // Sub-Community Filter Section
  filterSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  subCommunitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00D4AA',
  },
  // List Container
  listContainer: {
    padding: 20,
    paddingTop: 8,
  },
  // Modern Member Cards
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memberInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  memberContact: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  memberFooter: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal Styles - Matching Dashboard
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalClose: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300',
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemSelected: {
    backgroundColor: '#F8F8F8',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalItemDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  modalItemCheck: {
    fontSize: 20,
    color: '#00D4AA',
    fontWeight: '700',
  },
});
