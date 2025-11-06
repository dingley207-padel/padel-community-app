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

interface SendSessionNotificationScreenProps {
  sessionId: string;
  sessionTitle: string;
  attendeeCount: number;
  onGoBack: () => void;
}

export default function SendSessionNotificationScreen({
  sessionId,
  sessionTitle,
  attendeeCount,
  onGoBack,
}: SendSessionNotificationScreenProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

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
      `Send this notification to all ${attendeeCount} attendees of "${sessionTitle}"?`,
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
              await api.sendSessionNotification(sessionId, {
                title: title.trim(),
                message: message.trim(),
              });

              Alert.alert(
                'Success',
                `Notification sent to ${attendeeCount} ${attendeeCount === 1 ? 'attendee' : 'attendees'}`,
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
        {/* Compact Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Notification</Text>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Session Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Match</Text>
              <Text style={styles.infoValue}>{sessionTitle}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Recipients</Text>
              <Text style={styles.infoValue}>
                {attendeeCount} {attendeeCount === 1 ? 'attendee' : 'match attendees'}
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
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
                placeholder="Enter your message to match attendees"
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

            {/* Preview Section */}
            {(title.trim() || message.trim()) && (
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Preview</Text>
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

            {/* Quick Examples */}
            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>Quick Templates</Text>
              <View style={styles.examplesGrid}>
                <TouchableOpacity
                  style={styles.exampleButton}
                  onPress={() => {
                    setTitle('Match Reminder');
                    setMessage(`Don't forget - your match "${sessionTitle}" is coming up soon! See you there!`);
                  }}
                  disabled={isSending}
                >
                  <Text style={styles.exampleButtonText}>Reminder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exampleButton}
                  onPress={() => {
                    setTitle('Important Update');
                    setMessage(`There's an important update regarding "${sessionTitle}". Please check the match details.`);
                  }}
                  disabled={isSending}
                >
                  <Text style={styles.exampleButtonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exampleButton}
                  onPress={() => {
                    setTitle('Thank You!');
                    setMessage(`Thank you for attending "${sessionTitle}"! We hope you had a great time. See you at the next match!`);
                  }}
                  disabled={isSending}
                >
                  <Text style={styles.exampleButtonText}>Thank You</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Large Send Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.sendButtonText}>
                Send to {attendeeCount} {attendeeCount === 1 ? 'Attendee' : 'Attendees'}
              </Text>
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
  // Compact Header - Dashboard Style
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#00D4AA',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Info Card - Modern Style
  infoCard: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  // Form Section
  formSection: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  required: {
    color: '#FF6B6B',
  },
  // Large Modern Input
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
  },
  // Preview Section
  previewSection: {
    marginTop: 4,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
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
  // Examples Section
  examplesSection: {
    marginTop: 4,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  exampleButton: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  exampleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4AA',
  },
  // Footer with Large Send Button
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  // Large Prominent Send Button
  sendButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#B3B3B3',
    shadowOpacity: 0,
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
});
