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
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Colors, Spacing, Typography } from '../styles/appleDesignSystem';

interface Community {
  id: string;
  name: string;
  location?: string;
}

interface SubCommunity {
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
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [loadingSubCommunities, setLoadingSubCommunities] = useState(false);

  // Form state
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [selectedSubCommunity, setSelectedSubCommunity] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState('90');
  const [price, setPrice] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [freeCancellationHours, setFreeCancellationHours] = useState('24');
  const [allowConditionalCancellation, setAllowConditionalCancellation] = useState(true);

  useEffect(() => {
    loadCommunitiesAndSubCommunities();
  }, []);

  const loadCommunitiesAndSubCommunities = async () => {
    try {
      const response = await api.getManagedCommunities();
      const managedCommunities = response.communities || [];
      setCommunities(managedCommunities);

      // Auto-select first community if only one
      if (managedCommunities.length === 1) {
        const communityId = managedCommunities[0].id;
        setSelectedCommunity(communityId);
        // Load sub-communities for the auto-selected community
        loadSubCommunities(communityId);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setLoadingCommunities(false);
    }
  };

  const loadSubCommunities = async (communityId: string) => {
    try {
      setLoadingSubCommunities(true);
      const subComms = await api.getSubCommunities(communityId);
      setSubCommunities(subComms);
    } catch (error) {
      console.error('Error loading sub-communities:', error);
      setSubCommunities([]);
    } finally {
      setLoadingSubCommunities(false);
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
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a match title');
      return false;
    }
    if (!selectedSubCommunity && !location.trim()) {
      Alert.alert('Validation Error', 'Please select a sub-community or enter a location');
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
    if (!selectedCommunity) {
      Alert.alert('Error', 'No community found. Please contact support.');
      return false;
    }
    return true;
  };

  const handleCreateSession = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Get location from selected sub-community or manual input
      const selectedSubComm = subCommunities.find(sc => sc.id === selectedSubCommunity);
      const finalLocation = selectedSubComm
        ? (selectedSubComm.location || selectedSubComm.name)
        : location.trim();

      await api.createSession({
        community_id: selectedCommunity,
        sub_community_id: selectedSubCommunity || undefined,
        title: title.trim(),
        description: description.trim(),
        datetime: date.toISOString(),
        duration_minutes: parseInt(duration) || 90,
        location: finalLocation,
        google_maps_url: googleMapsUrl.trim() || undefined,
        price: parseFloat(price),
        max_players: parseInt(maxPlayers),
        visibility: true,
        free_cancellation_hours: parseInt(freeCancellationHours) || 24,
        allow_conditional_cancellation: allowConditionalCancellation,
      });

      Alert.alert(
        'Success!',
        'Match created successfully',
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
      console.error('Error creating match:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create match. Please try again.'
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
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Match</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏘️</Text>
          <Text style={styles.emptyText}>No Communities</Text>
          <Text style={styles.emptySubtext}>
            You need to be assigned to a community to create matches.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Match</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Match Details Section */}
        <Text style={styles.sectionHeader}>Match Details</Text>

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Match Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Saturday Morning Social"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Additional details about this match..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Location Section */}
        <Text style={styles.sectionHeader}>Location</Text>

        {/* Location (Sub-Community) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Match Location *</Text>

          {loadingSubCommunities ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#00D4AA" />
              <Text style={styles.loadingText}>Loading locations...</Text>
            </View>
          ) : subCommunities.length > 0 ? (
            <>
              <View style={styles.pickerContainer}>
                {subCommunities.map((subComm) => (
                  <TouchableOpacity
                    key={subComm.id}
                    style={[
                      styles.pickerOption,
                      selectedSubCommunity === subComm.id && styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedSubCommunity(subComm.id);
                      setLocation(''); // Clear manual location when selecting sub-community
                    }}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      selectedSubCommunity === subComm.id && styles.pickerOptionTextSelected
                    ]}>
                      {subComm.name}
                    </Text>
                    {subComm.location && (
                      <Text style={styles.pickerOptionSubtext}>{subComm.location}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.orDivider}>or enter custom location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={(text) => {
                  setLocation(text);
                  if (text.trim()) {
                    setSelectedSubCommunity(''); // Clear sub-community selection when typing
                  }
                }}
                placeholder="e.g., JGE Courts"
                placeholderTextColor="#999"
                editable={!selectedSubCommunity}
              />
            </>
          ) : (
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., JGE Courts"
              placeholderTextColor="#999"
            />
          )}
        </View>

        {/* Schedule Section */}
        <Text style={styles.sectionHeader}>Schedule</Text>

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Date *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Time *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(date)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="90"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
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

        {/* Match Settings Section */}
        <Text style={styles.sectionHeader}>Match Settings</Text>

        {/* Price & Max Players */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Price (AED) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="50"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Max Players *</Text>
            <TextInput
              style={styles.input}
              value={maxPlayers}
              onChangeText={setMaxPlayers}
              placeholder="8"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Cancellation Policy Section */}
        <Text style={styles.sectionHeader}>Cancellation Policy</Text>

        {/* Cancellation Policy */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Free Cancellation Period (hours)</Text>
          <TextInput
            style={styles.input}
            value={freeCancellationHours}
            onChangeText={setFreeCancellationHours}
            placeholder="24"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Text style={styles.switchLabel}>Allow Conditional Cancellation</Text>
            <Text style={styles.switchSubtext}>Players can cancel if a replacement is found</Text>
          </View>
          <Switch
            value={allowConditionalCancellation}
            onValueChange={setAllowConditionalCancellation}
            trackColor={{ false: '#D1D1D6', true: '#00D4AA' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateSession}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.createButtonText}>Create Match</Text>
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: {
    padding: 4,
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    fontWeight: '400',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  pickerContainer: {
    gap: 12,
    marginBottom: 12,
  },
  pickerOption: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  pickerOptionSelected: {
    borderColor: '#00D4AA',
    backgroundColor: '#E6FAF6',
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  pickerOptionTextSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
  },
  pickerOptionSubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666',
    marginTop: 4,
  },
  orDivider: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    marginVertical: 12,
    textAlign: 'center',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666',
  },
  createButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
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
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
