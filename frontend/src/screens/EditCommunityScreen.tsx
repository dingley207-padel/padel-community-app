import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';
import { convertImageToBase64 } from '../utils/imageUtils';

interface Community {
  id: string;
  name: string;
  description?: string;
  location?: string;
  profile_image?: string;
  banner_image?: string;
  website_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  facebook_url?: string;
  youtube_url?: string;
}

interface EditCommunityScreenProps {
  communityId: string;
  onBack: () => void;
  onSaved?: () => void;
}

export default function EditCommunityScreen({ communityId, onBack, onSaved }: EditCommunityScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Image upload mode state
  const [profileImageMode, setProfileImageMode] = useState<'url' | 'upload'>('url');
  const [bannerImageMode, setBannerImageMode] = useState<'url' | 'upload'>('url');

  useEffect(() => {
    loadCommunity();
  }, [communityId]);

  const loadCommunity = async () => {
    try {
      setIsLoading(true);
      const response = await api.getCommunity(communityId);
      const comm = response.community || response.data?.community || response;
      setCommunity(comm);

      // Populate form fields
      setName(comm.name || '');
      setDescription(comm.description || '');
      setLocation(comm.location || '');
      setProfileImage(comm.profile_image || '');
      setBannerImage(comm.banner_image || '');
      setWebsiteUrl(comm.website_url || '');
      setTwitterUrl(comm.twitter_url || '');
      setInstagramUrl(comm.instagram_url || '');
      setTiktokUrl(comm.tiktok_url || '');
      setFacebookUrl(comm.facebook_url || '');
      setYoutubeUrl(comm.youtube_url || '');
    } catch (error: any) {
      console.error('Load community error:', error);
      Alert.alert('Error', 'Failed to load community');
    } finally {
      setIsLoading(false);
    }
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const base64Image = await convertImageToBase64(result.assets[0].uri);
        setProfileImage(base64Image);
      } catch (error) {
        console.error('Error converting profile image:', error);
        Alert.alert('Error', 'Failed to process image');
      }
    }
  };

  const pickBannerImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const base64Image = await convertImageToBase64(result.assets[0].uri);
        setBannerImage(base64Image);
      } catch (error) {
        console.error('Error converting banner image:', error);
        Alert.alert('Error', 'Failed to process image');
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Community name is required');
      return;
    }

    try {
      setIsSaving(true);

      const updates = {
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        profile_image: profileImage.trim() || undefined,
        banner_image: bannerImage.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        twitter_url: twitterUrl.trim() || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        tiktok_url: tiktokUrl.trim() || undefined,
        facebook_url: facebookUrl.trim() || undefined,
        youtube_url: youtubeUrl.trim() || undefined,
      };

      console.log('[EditCommunity] Saving community with profile_image:', updates.profile_image ? updates.profile_image.substring(0, 50) : 'undefined');

      await api.updateCommunity(communityId, updates);

      Alert.alert('Success', 'Community updated successfully!');
      if (onSaved) onSaved();
      onBack();
    } catch (error: any) {
      console.error('[EditCommunity] Update community error:', error);
      console.error('[EditCommunity] Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update community');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Community</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Loading community...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Community</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.brand} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Community Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter community name"
              placeholderTextColor={Colors.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter community description"
              placeholderTextColor={Colors.tertiary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Dubai, UAE"
              placeholderTextColor={Colors.tertiary}
            />
          </View>
        </View>

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images</Text>

          {/* Profile Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profile Image</Text>

            {/* Toggle buttons */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, profileImageMode === 'url' && styles.toggleButtonActive]}
                onPress={() => setProfileImageMode('url')}
              >
                <Text style={[styles.toggleButtonText, profileImageMode === 'url' && styles.toggleButtonTextActive]}>
                  URL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, profileImageMode === 'upload' && styles.toggleButtonActive]}
                onPress={() => setProfileImageMode('upload')}
              >
                <Text style={[styles.toggleButtonText, profileImageMode === 'upload' && styles.toggleButtonTextActive]}>
                  Upload
                </Text>
              </TouchableOpacity>
            </View>

            {profileImageMode === 'url' ? (
              <TextInput
                style={styles.input}
                value={profileImage}
                onChangeText={setProfileImage}
                placeholder="https://example.com/logo.jpg"
                placeholderTextColor={Colors.tertiary}
                keyboardType="url"
                autoCapitalize="none"
              />
            ) : (
              <View>
                <TouchableOpacity style={styles.uploadButton} onPress={pickProfileImage}>
                  <Ionicons name="image-outline" size={24} color={Colors.brand} />
                  <Text style={styles.uploadButtonText}>Choose from Photos</Text>
                </TouchableOpacity>
                {profileImage && (
                  <Image source={{ uri: profileImage }} style={styles.imagePreview} />
                )}
              </View>
            )}
          </View>

          {/* Banner Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Banner Image</Text>

            {/* Toggle buttons */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, bannerImageMode === 'url' && styles.toggleButtonActive]}
                onPress={() => setBannerImageMode('url')}
              >
                <Text style={[styles.toggleButtonText, bannerImageMode === 'url' && styles.toggleButtonTextActive]}>
                  URL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, bannerImageMode === 'upload' && styles.toggleButtonActive]}
                onPress={() => setBannerImageMode('upload')}
              >
                <Text style={[styles.toggleButtonText, bannerImageMode === 'upload' && styles.toggleButtonTextActive]}>
                  Upload
                </Text>
              </TouchableOpacity>
            </View>

            {bannerImageMode === 'url' ? (
              <TextInput
                style={styles.input}
                value={bannerImage}
                onChangeText={setBannerImage}
                placeholder="https://example.com/banner.jpg"
                placeholderTextColor={Colors.tertiary}
                keyboardType="url"
                autoCapitalize="none"
              />
            ) : (
              <View>
                <TouchableOpacity style={styles.uploadButton} onPress={pickBannerImage}>
                  <Ionicons name="image-outline" size={24} color={Colors.brand} />
                  <Text style={styles.uploadButtonText}>Choose from Photos</Text>
                </TouchableOpacity>
                {bannerImage && (
                  <Image source={{ uri: bannerImage }} style={styles.bannerPreview} />
                )}
              </View>
            )}
          </View>
        </View>

        {/* Social Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media & Website</Text>
          <Text style={styles.sectionDescription}>
            Add your website and social media profile URLs to appear on your community page
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="globe-outline" size={20} color={Colors.primary} />
              <Text style={styles.label}>Website</Text>
            </View>
            <TextInput
              style={styles.input}
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={Colors.tertiary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-twitter" size={20} color={Colors.primary} />
              <Text style={styles.label}>X (Twitter)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={twitterUrl}
              onChangeText={setTwitterUrl}
              placeholder="https://x.com/yourprofile"
              placeholderTextColor={Colors.tertiary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-instagram" size={20} color={Colors.primary} />
              <Text style={styles.label}>Instagram</Text>
            </View>
            <TextInput
              style={styles.input}
              value={instagramUrl}
              onChangeText={setInstagramUrl}
              placeholder="https://instagram.com/yourprofile"
              placeholderTextColor={Colors.tertiary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-tiktok" size={20} color={Colors.primary} />
              <Text style={styles.label}>TikTok</Text>
            </View>
            <TextInput
              style={styles.input}
              value={tiktokUrl}
              onChangeText={setTiktokUrl}
              placeholder="https://tiktok.com/@yourprofile"
              placeholderTextColor={Colors.tertiary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-facebook" size={20} color={Colors.primary} />
              <Text style={styles.label}>Facebook</Text>
            </View>
            <TextInput
              style={styles.input}
              value={facebookUrl}
              onChangeText={setFacebookUrl}
              placeholder="https://facebook.com/yourpage"
              placeholderTextColor={Colors.tertiary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-youtube" size={20} color={Colors.primary} />
              <Text style={styles.label}>YouTube</Text>
            </View>
            <TextInput
              style={styles.input}
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              placeholder="https://youtube.com/@yourchannel"
              placeholderTextColor={Colors.tertiary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.backgroundElevated,
    ...Shadows.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TextStyles.title2,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  saveButtonText: {
    ...TextStyles.body,
    color: Colors.brand,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.secondary,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundElevated,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...TextStyles.title3,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    ...TextStyles.subheadline,
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...TextStyles.subheadline,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...TextStyles.body,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  toggleButtonText: {
    ...TextStyles.subheadline,
    fontWeight: '600',
    color: Colors.secondary,
  },
  toggleButtonTextActive: {
    color: '#000000',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    ...TextStyles.body,
    color: Colors.brand,
    fontWeight: '600',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
  bannerPreview: {
    width: '100%',
    height: 150,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
});
