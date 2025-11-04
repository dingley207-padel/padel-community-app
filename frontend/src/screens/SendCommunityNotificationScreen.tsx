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
}

interface SendCommunityNotificationScreenProps {
  onBack: () => void;
}

export default function SendCommunityNotificationScreen({
  onBack,
}: SendCommunityNotificationScreenProps) {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const response = await api.getManagedCommunities();
      setCommunities(response.communities || []);
      if (response.communities?.length > 0) {
        setSelectedCommunityId(response.communities[0].id);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setIsLoading(false);
    }
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

    if (!selectedCommunityId) {
      Alert.alert('Missing Information', 'Please select a community');
      return;
    }

    Alert.alert(
      'Send Notification',
      `This will send a notification to all members of the selected community. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'default',
          onPress: async () => {
            setIsSending(true);
            try {
              await api.sendCommunityNotification(selectedCommunityId, {
                title,
                message,
              });

              Alert.alert(
                'Success',
                'Notification sent to all community members!',
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

  if (communities.length === 0) {
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

  const selectedCommunity = communities.find((c) => c.id === selectedCommunityId);

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
          <Text style={styles.label}>Select Community</Text>
          <View style={styles.pickerContainer}>
            {communities.map((community) => (
              <TouchableOpacity
                key={community.id}
                style={[
                  styles.communityOption,
                  selectedCommunityId === community.id && styles.communityOptionSelected,
                ]}
                onPress={() => setSelectedCommunityId(community.id)}
              >
                <View style={styles.communityOptionContent}>
                  <Text
                    style={[
                      styles.communityOptionText,
                      selectedCommunityId === community.id &&
                        styles.communityOptionTextSelected,
                    ]}
                  >
                    {community.name}
                  </Text>
                  {community.member_count !== undefined && (
                    <Text
                      style={[
                        styles.memberCount,
                        selectedCommunityId === community.id &&
                          styles.memberCountSelected,
                      ]}
                    >
                      {community.member_count} member{community.member_count !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                {selectedCommunityId === community.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
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
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            This notification will be sent to all{' '}
            {selectedCommunity?.member_count || 0} member
            {selectedCommunity?.member_count !== 1 ? 's' : ''} of{' '}
            {selectedCommunity?.name}
          </Text>
        </View>
      </ScrollView>

      {/* Send Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!title || !message || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!title || !message || isSending}
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
  pickerContainer: {
    gap: 8,
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
