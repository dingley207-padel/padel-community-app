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
}

interface MembersScreenProps {
  onBack: () => void;
}

export default function MembersScreen({ onBack }: MembersScreenProps) {
  console.log('[MembersScreen] Component mounted/rendered');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('[MembersScreen] useEffect running');
    loadMembers();
  }, []);

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMembers();
  };

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
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Members</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          Total Members: <Text style={styles.summaryValue}>{members.length}</Text>
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00D4AA" />
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
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
              <Text style={styles.emptyText}>No members found</Text>
              <Text style={styles.emptySubtext}>
                Members will appear here once they book sessions
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  placeholder: {
    width: 50,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D4AA',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  memberContact: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  memberFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    color: '#6C757D',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C757D',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ADB5BD',
    textAlign: 'center',
  },
});
