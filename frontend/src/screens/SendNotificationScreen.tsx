import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../services/api';

interface SubCommunity {
  id: string;
  name: string;
  description?: string;
}

interface SendNotificationScreenProps {
  communityId: string;
  communityName: string;
  onGoBack: () => void;
}

export default function SendNotificationScreen({
  communityId,
  communityName,
  onGoBack,
}: SendNotificationScreenProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [selectedSubCommunityIds, setSelectedSubCommunityIds] = useState<string[]>([]);
  const [includeParent, setIncludeParent] = useState(true); // Default to true - parent community selected
  const [isLoadingSubCommunities, setIsLoadingSubCommunities] = useState(true);

  useEffect(() => {
    loadSubCommunities();
  }, [communityId]);

  const loadSubCommunities = async () => {
    try {
      const subs = await api.getSubCommunities(communityId);
      setSubCommunities(subs || []);
    } catch (error) {
      console.error('Error loading sub-communities:', error);
    } finally {
      setIsLoadingSubCommunities(false);
    }
  };

  const toggleSubCommunity = (subId: string) => {
    setSelectedSubCommunityIds(prev =>
      prev.includes(subId)
        ? prev.filter(id => id !== subId)
        : [...prev, subId]
    );
  };

  const handleSend = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a notification title');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a notification message');
      return;
    }

    // Confirm before sending
    Alert.alert(
      'Send Notification',
      `Send this notification to all members of ${communityName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          onPress: async () => {
            setIsSending(true);
            try {
              await api.sendCommunityNotification(communityId, {
                title: title.trim(),
                message: message.trim(),
                sub_community_ids: selectedSubCommunityIds,
                include_parent: includeParent,
              });

              Alert.alert(
                'Success',
                'Notification sent to all community members',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Clear form and go back
                      setTitle('');
                      setMessage('');
                      onGoBack();
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('Error sending notification:', error);
              const errorMessage =
                error.response?.data?.error ||
                'Failed to send notification. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>{communityName}</Text>
            <Text style={styles.headerTitle}>Send Notification</Text>
          </View>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionDescription}>
              Select which communities should receive this notification
            </Text>

            {/* Parent Community Checkbox */}
            <View style={styles.parentCommunitySection}>
              <Text style={styles.inputLabel}>Send To:</Text>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIncludeParent(!includeParent)}
                activeOpacity={0.7}
                disabled={isSending}
              >
                <View
                  style={[
                    styles.checkbox,
                    includeParent && styles.checkboxChecked,
                  ]}
                >
                  {includeParent && (
                    <Text style={styles.checkboxCheckmark}>✓</Text>
                  )}
                </View>
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxLabel}>{communityName}</Text>
                  <Text style={styles.checkboxDescription}>Main community</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter notification title"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                editable={!isSending}
              />
              <Text style={styles.characterCount}>{title.length}/100</Text>
            </View>

            {/* Message Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Message <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your message"
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                maxLength={500}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                editable={!isSending}
              />
              <Text style={styles.characterCount}>{message.length}/500</Text>
            </View>

            {/* Sub-Communities Selection */}
            {!isLoadingSubCommunities && subCommunities.length > 0 && (
              <View style={styles.subCommunitiesSection}>
                <Text style={styles.subCommunitiesTitle}>
                  Sub-Communities
                </Text>
                <Text style={styles.subCommunitiesDescription}>
                  Optionally select sub-communities to also receive this notification
                </Text>
                <View style={styles.subCommunitiesList}>
                  {subCommunities.map((subCommunity) => (
                    <TouchableOpacity
                      key={subCommunity.id}
                      style={styles.checkboxContainer}
                      onPress={() => toggleSubCommunity(subCommunity.id)}
                      activeOpacity={0.7}
                      disabled={isSending}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedSubCommunityIds.includes(subCommunity.id) &&
                            styles.checkboxChecked,
                        ]}
                      >
                        {selectedSubCommunityIds.includes(subCommunity.id) && (
                          <Text style={styles.checkboxCheckmark}>✓</Text>
                        )}
                      </View>
                      <View style={styles.checkboxTextContainer}>
                        <Text style={styles.checkboxLabel}>{subCommunity.name}</Text>
                        {subCommunity.description && (
                          <Text style={styles.checkboxDescription}>
                            {subCommunity.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Preview Section */}
            {(title.trim() || message.trim()) && (
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Preview:</Text>
                <View style={styles.previewCard}>
                  {title.trim() && (
                    <Text style={styles.previewTitle}>{title.trim()}</Text>
                  )}
                  {message.trim() && (
                    <Text style={styles.previewMessage}>{message.trim()}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>
                  All community members will receive this notification on their
                  devices
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Send Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              isSending && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.sendButtonText}>Send Notification</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  previewSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  previewMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5F2',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D4AA',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#00D4AA',
  },
  checkboxCheckmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 14,
    color: '#666',
  },
  parentCommunitySection: {
    marginBottom: 24,
  },
  subCommunitiesSection: {
    marginBottom: 24,
  },
  subCommunitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subCommunitiesDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  subCommunitiesList: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  sendButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  sendButtonDisabled: {
    backgroundColor: '#B3B3B3',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
