import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Community {
  id: string;
  name: string;
  member_count?: number;
  parent_community_id?: string | null;
}

interface SendCommunityNotificationScreenProps {
  onBack: () => void;
}

export default function SendCommunityNotificationScreen({
  onBack,
}: SendCommunityNotificationScreenProps) {
  const { user } = useAuth();
  const [parentCommunity, setParentCommunity] = useState<Community | null>(null);
  const [subCommunities, setSubCommunities] = useState<Community[]>([]);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    console.log('[SendCommunityNotificationScreen] UPDATED VERSION - Using checkbox multi-select');
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const response = await api.getManagedCommunities();
      const allCommunities = response.communities || [];

      // Separate parent and sub-communities
      const parent = allCommunities.find((c: Community) => !c.parent_community_id);
      const subs = allCommunities.filter((c: Community) => c.parent_community_id);

      setParentCommunity(parent || null);
      setSubCommunities(subs);

      // Default: select parent community
      if (parent) {
        setSelectedCommunityIds([parent.id]);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCommunity = (communityId: string) => {
    setSelectedCommunityIds((prev) => {
      if (prev.includes(communityId)) {
        return prev.filter((id) => id !== communityId);
      } else {
        return [...prev, communityId];
      }
    });
  };

  const getTotalMemberCount = () => {
    let total = 0;
    selectedCommunityIds.forEach((id) => {
      if (id === parentCommunity?.id) {
        total += parentCommunity?.member_count || 0;
      } else {
        const subComm = subCommunities.find((s) => s.id === id);
        if (subComm) {
          total += subComm.member_count || 0;
        }
      }
    });
    return total;
  };

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please enter a notification title');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Missing Information', 'Please enter a notification message');
      return;
    }

    if (selectedCommunityIds.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one community');
      return;
    }

    const memberCount = getTotalMemberCount();
    const communityNames = selectedCommunityIds
      .map((id) => {
        if (id === parentCommunity?.id) return parentCommunity?.name;
        return subCommunities.find((s) => s.id === id)?.name;
      })
      .filter(Boolean)
      .join(', ');

    Alert.alert(
      'Send Notification',
      `This will send a notification to ${memberCount} member${
        memberCount !== 1 ? 's' : ''
      } in: ${communityNames}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'default',
          onPress: async () => {
            setIsSending(true);
            try {
              if (!parentCommunity) {
                throw new Error('Parent community not found');
              }

              // Separate parent and sub-community IDs
              const isParentSelected = selectedCommunityIds.includes(parentCommunity.id);
              const selectedSubIds = selectedCommunityIds.filter(
                (id) => id !== parentCommunity.id
              );

              // Always use parent community ID as the route parameter
              // Send selected sub-community IDs in the body
              await api.sendCommunityNotification(parentCommunity.id, {
                title,
                message,
                sub_community_ids: selectedSubIds,
                include_parent: isParentSelected,
              });

              Alert.alert(
                'Success',
                'Notification sent successfully!',
                [{ text: 'OK', onPress: onBack }]
              );
            } catch (error: any) {
              console.error('Error sending notification:', error);
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to send notification'
              );
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!parentCommunity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Send Notification</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏘️</Text>
          <Text style={styles.emptyText}>No Communities</Text>
          <Text style={styles.emptySubtext}>
            You are not managing any communities yet
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Send Notification</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Community Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Communities</Text>
          <Text style={styles.hint}>Choose which communities will receive this notification</Text>

          {/* Parent Community */}
          <TouchableOpacity
            style={[
              styles.communityOption,
              selectedCommunityIds.includes(parentCommunity.id) &&
                styles.communityOptionSelected,
            ]}
            onPress={() => toggleCommunity(parentCommunity.id)}
          >
            <View style={styles.communityOptionContent}>
              <Text
                style={[
                  styles.communityOptionText,
                  selectedCommunityIds.includes(parentCommunity.id) &&
                    styles.communityOptionTextSelected,
                ]}
              >
                {parentCommunity.name}
              </Text>
              <Text
                style={[
                  styles.memberCount,
                  selectedCommunityIds.includes(parentCommunity.id) &&
                    styles.memberCountSelected,
                ]}
              >
                {parentCommunity.member_count || 0} member
                {parentCommunity.member_count !== 1 ? 's' : ''}
              </Text>
            </View>
            {selectedCommunityIds.includes(parentCommunity.id) ? (
              <Ionicons name="checkbox" size={24} color="#007AFF" />
            ) : (
              <Ionicons name="square-outline" size={24} color="#8E8E93" />
            )}
          </TouchableOpacity>

          {/* Sub-Communities */}
          {subCommunities.length > 0 && (
            <View style={styles.subCommunitiesContainer}>
              <Text style={styles.subCommunitiesLabel}>Sub-Communities</Text>
              {subCommunities.map((subComm) => (
                <TouchableOpacity
                  key={subComm.id}
                  style={[
                    styles.communityOption,
                    styles.subCommunityOption,
                    selectedCommunityIds.includes(subComm.id) &&
                      styles.communityOptionSelected,
                  ]}
                  onPress={() => toggleCommunity(subComm.id)}
                >
                  <View style={styles.communityOptionContent}>
                    <Text
                      style={[
                        styles.communityOptionText,
                        selectedCommunityIds.includes(subComm.id) &&
                          styles.communityOptionTextSelected,
                      ]}
                    >
                      {subComm.name}
                    </Text>
                    <Text
                      style={[
                        styles.memberCount,
                        selectedCommunityIds.includes(subComm.id) &&
                          styles.memberCountSelected,
                      ]}
                    >
                      {subComm.member_count || 0} member
                      {subComm.member_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {selectedCommunityIds.includes(subComm.id) ? (
                    <Ionicons name="checkbox" size={24} color="#007AFF" />
                  ) : (
                    <Ionicons name="square-outline" size={24} color="#8E8E93" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Notification Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Notification Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., New Session Available"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            placeholderTextColor="#8E8E93"
          />
          <Text style={styles.charCount}>{title.length}/50</Text>
        </View>

        {/* Notification Message */}
        <View style={styles.section}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your notification message..."
            value={message}
            onChangeText={setMessage}
            maxLength={200}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#8E8E93"
          />
          <Text style={styles.charCount}>{message.length}/200</Text>
        </View>

        {/* Preview */}
        {(title || message) && (
          <View style={styles.section}>
            <Text style={styles.label}>Preview</Text>
            <View style={styles.preview}>
              <View style={styles.previewIcon}>
                <Ionicons name="notifications" size={20} color="#007AFF" />
              </View>
              <View style={styles.previewContent}>
                {title && <Text style={styles.previewTitle}>{title}</Text>}
                {message && <Text style={styles.previewMessage}>{message}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Info Box */}
        {selectedCommunityIds.length > 0 && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              This notification will be sent to {getTotalMemberCount()} member
              {getTotalMemberCount() !== 1 ? 's' : ''} across {selectedCommunityIds.length}{' '}
              selected {selectedCommunityIds.length === 1 ? 'community' : 'communities'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Send Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!title || !message || selectedCommunityIds.length === 0 || isSending) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!title || !message || selectedCommunityIds.length === 0 || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Notification</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  communityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginBottom: 8,
  },
  subCommunityOption: {
    marginLeft: 16,
  },
  communityOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E5F1FF',
  },
  communityOptionContent: {
    flex: 1,
  },
  communityOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  communityOptionTextSelected: {
    color: '#007AFF',
  },
  memberCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  memberCountSelected: {
    color: '#007AFF',
  },
  subCommunitiesContainer: {
    marginTop: 8,
  },
  subCommunitiesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  preview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  previewMessage: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E5F1FF',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
