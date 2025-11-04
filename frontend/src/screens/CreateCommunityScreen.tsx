import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { convertImageToBase64 } from '../utils/imageUtils';

interface CreateCommunityScreenProps {
  onBack: () => void;
  onCommunityCreated: () => void;
}

export default function CreateCommunityScreen({
  onBack,
  onCommunityCreated,
}: CreateCommunityScreenProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a logo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Convert image to base64 for permanent storage
      try {
        console.log('[CreateCommunity] Converting image URI:', result.assets[0].uri);
        const base64Image = await convertImageToBase64(result.assets[0].uri);
        console.log('[CreateCommunity] Image converted successfully, size:', Math.round(base64Image.length / 1024), 'KB');
        setLogoUri(base64Image);
      } catch (conversionError: any) {
        console.error('[CreateCommunity] Error converting logo image:', conversionError);
        console.error('[CreateCommunity] Error message:', conversionError.message);
        console.error('[CreateCommunity] Error stack:', conversionError.stack);
        Alert.alert('Error', `Failed to process image: ${conversionError.message || 'Unknown error'}`);
      }
    }
  };

  const handleCreateCommunity = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Community name is required');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createCommunity({
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        profile_image: logoUri || undefined,
        visibility: isPublic,
      });

      Alert.alert('Success', 'Community created successfully!', [
        { text: 'OK', onPress: onCommunityCreated },
      ]);
    } catch (error: any) {
      console.error('Create community error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create community');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Community</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Logo Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Community Logo</Text>
            <TouchableOpacity style={styles.logoUpload} onPress={handlePickImage}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoPreview} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#6B7280" />
                  <Text style={styles.logoPlaceholderText}>Tap to upload logo</Text>
                </View>
              )}
            </TouchableOpacity>
            {logoUri && (
              <TouchableOpacity onPress={() => setLogoUri(null)} style={styles.removeLogoButton}>
                <Text style={styles.removeLogoText}>Remove logo</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Community Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dubai Padel Club"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your community..."
              placeholderTextColor="#6B7280"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Location <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dubai, UAE"
              placeholderTextColor="#6B7280"
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
          </View>

          {/* Public/Private Toggle */}
          <View style={styles.inputGroup}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text style={styles.label}>Visibility</Text>
                <Text style={styles.toggleDescription}>
                  {isPublic
                    ? 'Public - Anyone can discover and join'
                    : 'Private - Invitation only'}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#6B7280', true: '#10B981' }}
                thumbColor={isPublic ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor="#6B7280"
              />
            </View>
          </View>

          <Text style={styles.helperText}>
            <Text style={styles.required}>*</Text> Required fields
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onBack}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.createButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleCreateCommunity}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#10B981', '#059669']} style={styles.gradient}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Community</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#111827',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  helperText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoUpload: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#4B5563',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  logoPlaceholderText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  removeLogoButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  removeLogoText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
