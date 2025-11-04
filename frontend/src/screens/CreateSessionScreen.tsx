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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Community {
  id: string;
  name: string;
  location?: string;
}

interface CreateSessionScreenProps {
  onBack: () => void;
  onSessionCreated: () => void;
}

export default function CreateSessionScreen({ onBack, onSessionCreated }: CreateSessionScreenProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  // Form state
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [price, setPrice] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [freeCancellationHours, setFreeCancellationHours] = useState('24');
  const [allowConditionalCancellation, setAllowConditionalCancellation] = useState(true);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const response = await api.getManagedCommunities();
      const managedCommunities = response.communities || [];
      setCommunities(managedCommunities);

      // Auto-select first community if only one
      if (managedCommunities.length === 1) {
        setSelectedCommunity(managedCommunities[0].id);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setLoadingCommunities(false);
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

  const validateForm = (): boolean => {
    if (!selectedCommunity) {
      Alert.alert('Validation Error', 'Please select a community');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a session title');
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
    return true;
  };

  const handleCreateSession = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.createSession({
        community_id: selectedCommunity,
        title: title.trim(),
        description: description.trim(),
        datetime: date.toISOString(),
        location: location.trim(),
        google_maps_url: googleMapsUrl.trim() || undefined,
        price: parseFloat(price),
        max_players: parseInt(maxPlayers),
        visibility: true,
        free_cancellation_hours: parseInt(freeCancellationHours) || 24,
        allow_conditional_cancellation: allowConditionalCancellation,
      });

      Alert.alert(
        'Success!',
        'Session created successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              onSessionCreated();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating session:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create session. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loadingCommunities) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  if (communities.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Session</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏘️</Text>
          <Text style={styles.emptyTitle}>No Communities</Text>
          <Text style={styles.emptyDescription}>
            You need to be assigned to a community to create sessions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Session</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Community Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Community *</Text>
          {communities.map((community) => (
            <TouchableOpacity
              key={community.id}
              style={[
                styles.communityOption,
                selectedCommunity === community.id && styles.communityOptionSelected,
              ]}
              onPress={() => setSelectedCommunity(community.id)}
            >
              <View style={styles.radioButton}>
                {selectedCommunity === community.id && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{community.name}</Text>
                {community.location && (
                  <Text style={styles.communityLocation}>📍 {community.location}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Session Details */}
        <View style={styles.section}>
          <Text style={styles.label}>Session Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Saturday Morning Social"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add session details..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(date)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., JGE Courts"
            placeholderTextColor="#999"
          />
        </View>

        {/* Google Maps URL */}
        <View style={styles.section}>
          <Text style={styles.label}>Google Maps Link (Optional)</Text>
          <TextInput
            style={styles.input}
            value={googleMapsUrl}
            onChangeText={setGoogleMapsUrl}
            placeholder="https://maps.google.com/?q=..."
            placeholderTextColor="#999"
            keyboardType="url"
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>
            Members can tap the location to get directions
          </Text>
        </View>

        {/* Price & Max Players */}
        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Price (AED) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Max Players *</Text>
            <TextInput
              style={styles.input}
              value={maxPlayers}
              onChangeText={setMaxPlayers}
              placeholder="12"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation Policy</Text>
          <Text style={styles.sectionDescription}>
            Configure how members can cancel their bookings
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Free Cancellation Window (hours before session) *</Text>
          <TextInput
            style={styles.input}
            value={freeCancellationHours}
            onChangeText={setFreeCancellationHours}
            placeholder="24"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.helpText}>
            Members can cancel and get a full refund up to this many hours before the session
          </Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAllowConditionalCancellation(!allowConditionalCancellation)}
          >
            <View style={styles.checkbox}>
              {allowConditionalCancellation && <View style={styles.checkboxInner} />}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>Allow Conditional Cancellation</Text>
              <Text style={styles.checkboxDescription}>
                After free cancellation window, members can request cancellation and get refunded only if someone else takes their spot
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateSession}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>Create Session</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  communityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  communityOptionSelected: {
    borderColor: '#00D4AA',
    backgroundColor: '#F0FFF9',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D4AA',
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  communityLocation: {
    fontSize: 13,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dateTimeButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  createButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: '#CCC',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#00D4AA',
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
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
