import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, TextStyles, Spacing, BorderRadius } from '../styles/appleDesignSystem';

type RootStackParamList = {
  ChatDetail: { communityId: string; communityName: string; communityProfileImage?: string };
};

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

interface Message {
  id: string;
  community_id: string;
  sender_id: string;
  sender_name?: string;
  sender_profile_image?: string;
  content: string;
  created_at: string;
}

const ChatDetailScreen: React.FC = () => {
  const route = useRoute<ChatDetailRouteProp>();
  const navigation = useNavigation();
  const { communityId, communityName, communityProfileImage } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = async () => {
    try {
      const response = await api.getCommunityMessages(communityId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [communityId]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    // Dismiss keyboard
    Keyboard.dismiss();

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      community_id: communityId,
      sender_id: 'current-user',
      content: messageText.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setMessageText('');
    setSending(true);

    try {
      const response = await api.sendCommunityMessage(communityId, messageText.trim());

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? response.message : msg
        )
      );

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      setMessageText(tempMessage.content);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender_id === 'current-user' || !item.sender_name;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        {!isCurrentUser && item.sender_name && (
          <Text style={styles.senderName}>{item.sender_name}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
            ]}
          >
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header with community logo and close button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {communityProfileImage ? (
            <Image source={{ uri: communityProfileImage }} style={styles.headerLogo} />
          ) : (
            <View style={styles.headerLogoPlaceholder}>
              <Text style={styles.headerLogoText}>
                {communityName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {communityName}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={Colors.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={messageText.trim() ? Colors.white : Colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
  },
  headerLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoText: {
    ...TextStyles.headline,
    color: Colors.white,
    fontWeight: '600',
  },
  headerTitle: {
    ...TextStyles.title3,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
  },
  emptyText: {
    ...TextStyles.headline,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  messageContainer: {
    marginBottom: Spacing.md,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    ...TextStyles.caption1,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs / 2,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.large,
  },
  currentUserBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Spacing.xs,
  },
  otherUserBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: Spacing.xs,
  },
  messageText: {
    ...TextStyles.body,
    marginBottom: Spacing.xs / 2,
  },
  currentUserText: {
    color: Colors.white,
  },
  otherUserText: {
    color: Colors.text,
  },
  messageTime: {
    ...TextStyles.caption2,
    fontSize: 11,
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTime: {
    color: Colors.textSecondary,
  },
  inputContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    ...TextStyles.body,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surface,
  },
});

export default ChatDetailScreen;
