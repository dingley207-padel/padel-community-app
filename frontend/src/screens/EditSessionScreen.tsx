import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, Spacing, Typography, BorderRadius } from '../styles/appleDesignSystem';

interface Session {
  id: string;
  community_id: string;
  title: string;
  description?: string;
  datetime: string;
  location: string;
  price: number;
  max_players: number;
  booked_count: number;
  status: string;
  community_name?: string;
}

interface EditSessionScreenProps {
  sessionId: string;
  onBack: () => void;
  onSessionUpdated: () => void;
}

export default function EditSessionScreen({
  sessionId,
  onBack,
  onSessionUpdated,
}: EditSessionScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [price, setPrice] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSession(sessionId);
      const sessionData = response.session;
      setSession(sessionData);

      // Populate form fields
      setTitle(sessionData.title);
      setDescription(sessionData.description || '');
      setLocation(sessionData.location);

      // Parse datetime
      const sessionDate = new Date(
        sessionData.datetime.endsWith('Z')
          ? sessionData.datetime
          : sessionData.datetime + 'Z'
      );
      setDate(sessionDate);

      setPrice(sessionData.price.toString());
      setMaxPlayers(sessionData.max_players.toString());
    } catch (error: any) {
      console.error('Error loading match:', error);
      Alert.alert('Error', 'Failed to load match details');
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Dubai',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Dubai',
    }) + ' GST';
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a match title');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter a location');
      return false;
    }
    if (!price || parseFloat(price) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return false;
    }
    if (!maxPlayers || parseInt(maxPlayers) < 1) {
      Alert.alert('Validation Error', 'Please enter a valid number of players (minimum 1)');
      return false;
    }

    // Check if max_players is being reduced below current bookings
    if (session && parseInt(maxPlayers) < session.booked_count) {
      Alert.alert(
        'Invalid Max Players',
        `Cannot reduce max players to ${maxPlayers}. There are already ${session.booked_count} bookings.`
      );
      return false;
    }

    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;

    // Check if any changes were made
    const hasChanges =
      title !== session?.title ||
      description !== (session?.description || '') ||
      location !== session?.location ||
      date.toISOString() !== new Date(session?.datetime || '').toISOString() ||
      parseFloat(price) !== session?.price ||
      parseInt(maxPlayers) !== session?.max_players;

    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes were made to the match');
      return;
    }

    Alert.alert(
      'Save Changes',
      'Are you sure you want to save these changes? Participants will be notified if date/time, location, or price changes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setIsSaving(true);
            try {
              await api.updateSession(sessionId, {
                title: title.trim(),
                description: description.trim() || undefined,
                location: location.trim(),
                datetime: date.toISOString(),
                price: parseFloat(price),
                max_players: parseInt(maxPlayers),
              });

              Alert.alert('Success', 'Match updated successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    onSessionUpdated();
                    onBack();
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Error updating match:', error);
              const errorMessage =
                error.response?.data?.error || 'Failed to update match. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Loading match...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Compact Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Match</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Booking Info Warning */}
          {session && session.booked_count > 0 && (
            <View style={styles.warningCard}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="alert-circle" size={24} color={Colors.warning} />
              </View>
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>
                  {session.booked_count} {session.booked_count === 1 ? 'player has' : 'players have'} booked
                </Text>
                <Text style={styles.warningText}>
                  Changes to date/time, location, or price will notify all participants
                </Text>
              </View>
            </View>
          )}

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Saturday Morning Match"
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              editable={!isSaving}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional details..."
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                disabled={isSaving}
              >
                <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Time *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowTimePicker(true)}
                disabled={isSaving}
              >
                <Text style={styles.dateTimeText}>{formatTime(date)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              timeZone="Asia/Dubai"
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              timeZone="Asia/Dubai"
            />
          )}

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Court 1, Dubai Sports City"
              placeholderTextColor={Colors.textTertiary}
              value={location}
              onChangeText={setLocation}
              editable={!isSaving}
            />
          </View>

          {/* Price & Max Players */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Price (AED) *</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                placeholderTextColor={Colors.textTertiary}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                editable={!isSaving}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Max Players *</Text>
              <TextInput
                style={styles.input}
                placeholder="8"
                placeholderTextColor={Colors.textTertiary}
                value={maxPlayers}
                onChangeText={setMaxPlayers}
                keyboardType="number-pad"
                editable={!isSaving}
              />
              {session && session.booked_count > 0 && (
                <Text style={styles.inputHint}>
                  Minimum: {session.booked_count} (current bookings)
                </Text>
              )}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveChanges}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.textOnBrand} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.size.title3,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  warningIconContainer: {
    marginRight: Spacing.sm,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  warningText: {
    fontSize: Typography.size.caption1,
    color: Colors.textSecondary,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.size.caption1,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.regular,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundElevated,
    color: Colors.textPrimary,
    minHeight: 56,
    justifyContent: 'center',
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  inputHint: {
    fontSize: Typography.size.caption1,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  dateTimeText: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.regular,
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
    minHeight: 56,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: Typography.size.callout,
    fontWeight: Typography.weight.semibold,
    color: Colors.textOnBrand,
  },
});
