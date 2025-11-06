import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { convertImageToBase64 } from '../utils/imageUtils';

interface SubCommunity {
  id: string;
  name: string;
  description?: string;
  location?: string;
  member_count?: number;
  profile_image?: string;
  banner_image?: string;
}

interface Community {
  id: string;
  name: string;
  description?: string;
  location?: string;
}

interface SubCommunitiesManagerScreenProps {
  communityId: string;
  communityName: string;
  onBack: () => void;
}

export default function SubCommunitiesManagerScreen({
  communityId,
  communityName,
  onBack,
}: SubCommunitiesManagerScreenProps) {
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubCommunity, setEditingSubCommunity] = useState<SubCommunity | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubLocation, setNewSubLocation] = useState('');
  const [newSubDescription, setNewSubDescription] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [bannerImageUri, setBannerImageUri] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [bannerImageBase64, setBannerImageBase64] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadSubCommunities();
  }, [communityId]);

  const loadSubCommunities = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const subComms = await api.getSubCommunities(communityId);
      setSubCommunities(subComms);
    } catch (error: any) {
      console.error('Error loading sub-communities:', error);
      Alert.alert('Error', 'Failed to load sub-communities');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadSubCommunities(true);
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
      const uri = result.assets[0].uri;
      setProfileImageUri(uri);

      try {
        const base64 = await convertImageToBase64(uri);
        setProfileImageBase64(base64);
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
      const uri = result.assets[0].uri;
      setBannerImageUri(uri);

      try {
        const base64 = await convertImageToBase64(uri);
        setBannerImageBase64(base64);
      } catch (error) {
        console.error('Error converting banner image:', error);
        Alert.alert('Error', 'Failed to process image');
      }
    }
  };

  const handleAddSubCommunity = async () => {
    if (!newSubName.trim()) {
      Alert.alert('Required', 'Please enter a name for the sub-community');
      return;
    }

    if (!newSubLocation.trim()) {
      Alert.alert('Required', 'Please enter a location for the sub-community');
      return;
    }

    try {
      setIsCreating(true);
      await api.createSubCommunity(communityId, {
        name: newSubName.trim(),
        location: newSubLocation.trim(),
        description: newSubDescription.trim() || undefined,
        profile_image: profileImageBase64 || undefined,
        banner_image: bannerImageBase64 || undefined,
      });

      setShowAddModal(false);
      setNewSubName('');
      setNewSubLocation('');
      setNewSubDescription('');
      setProfileImageUri(null);
      setBannerImageUri(null);
      setProfileImageBase64(null);
      setBannerImageBase64(null);

      Alert.alert('Success', 'Sub-community created successfully');
      loadSubCommunities();
    } catch (error: any) {
      console.error('Error creating sub-community:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create sub-community');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubCommunity = (subCommunity: SubCommunity) => {
    setEditingSubCommunity(subCommunity);
    setNewSubName(subCommunity.name);
    setNewSubLocation(subCommunity.location || '');
    setNewSubDescription(subCommunity.description || '');
    setProfileImageUri(subCommunity.profile_image || null);
    setBannerImageUri(subCommunity.banner_image || null);
    setProfileImageBase64(null); // Only set when user picks new image
    setBannerImageBase64(null); // Only set when user picks new image
    setShowEditModal(true);
  };

  const handleUpdateSubCommunity = async () => {
    if (!editingSubCommunity) return;

    if (!newSubName.trim()) {
      Alert.alert('Required', 'Please enter a name for the sub-community');
      return;
    }

    if (!newSubLocation.trim()) {
      Alert.alert('Required', 'Please enter a location for the sub-community');
      return;
    }

    try {
      setIsUpdating(true);
      await api.updateSubCommunity(communityId, editingSubCommunity.id, {
        name: newSubName.trim(),
        location: newSubLocation.trim(),
        description: newSubDescription.trim() || undefined,
        profile_image: profileImageBase64 || undefined,
        banner_image: bannerImageBase64 || undefined,
      });

      setShowEditModal(false);
      setEditingSubCommunity(null);
      setNewSubName('');
      setNewSubLocation('');
      setNewSubDescription('');
      setProfileImageUri(null);
      setBannerImageUri(null);
      setProfileImageBase64(null);
      setBannerImageBase64(null);

      Alert.alert('Success', 'Sub-community updated successfully');
      loadSubCommunities();
    } catch (error: any) {
      console.error('Error updating sub-community:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update sub-community');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubCommunity = async (subCommunityId: string, subCommunityName: string) => {
    Alert.alert(
      'Delete Sub-Community',
      `Are you sure you want to delete "${subCommunityName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteSubCommunity(communityId, subCommunityId);
              Alert.alert('Success', 'Sub-community deleted successfully');
              loadSubCommunities();
            } catch (error: any) {
              console.error('Error deleting sub-community:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete sub-community');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Header - Matching Dashboard */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSubtitle}>{communityName}</Text>
          <Text style={styles.headerTitle}>Sub-Communities</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#00D4AA"
          />
        }
      >
        {subCommunities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyText}>No sub-communities yet</Text>
            <Text style={styles.emptySubtext}>
              Add locations to organize your community
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyAddButtonText}>Add Sub-Community</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            {subCommunities.map((subCommunity) => (
              <View key={subCommunity.id} style={styles.subCommunityCard}>
                <View style={styles.cardLeft}>
                  <View style={styles.subCommunityIcon}>
                    <Text style={styles.iconEmoji}>📍</Text>
                  </View>
                  <View style={styles.subCommunityInfo}>
                    <Text style={styles.subCommunityName}>{subCommunity.name}</Text>
                    {subCommunity.location && (
                      <Text style={styles.subCommunityLocation}>
                        {subCommunity.location}
                      </Text>
                    )}
                    {subCommunity.description && (
                      <Text style={styles.subCommunityDescription}>
                        {subCommunity.description}
                      </Text>
                    )}
                    {subCommunity.member_count !== undefined && (
                      <View style={styles.memberBadge}>
                        <Text style={styles.memberCount}>
                          {subCommunity.member_count} member{subCommunity.member_count === 1 ? '' : 's'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditSubCommunity(subCommunity)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={22} color="#00D4AA" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteSubCommunity(subCommunity.id, subCommunity.name)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Sub-Community Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
              disabled={isCreating}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Sub-Community</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Profile Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Profile Image (Logo)</Text>
              <TouchableOpacity
                style={styles.imageUploadButton}
                onPress={pickProfileImage}
                disabled={isCreating}
                activeOpacity={0.7}
              >
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Tap to upload</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Banner Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Banner Image</Text>
              <TouchableOpacity
                style={styles.bannerUploadButton}
                onPress={pickBannerImage}
                disabled={isCreating}
                activeOpacity={0.7}
              >
                {bannerImageUri ? (
                  <Image source={{ uri: bannerImageUri }} style={styles.uploadedBanner} />
                ) : (
                  <View style={styles.bannerPlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Tap to upload banner</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dubai Marina Location"
                placeholderTextColor="#999"
                value={newSubName}
                onChangeText={setNewSubName}
                editable={!isCreating}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dubai Marina, Dubai"
                placeholderTextColor="#999"
                value={newSubLocation}
                onChangeText={setNewSubLocation}
                editable={!isCreating}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of this location..."
                placeholderTextColor="#999"
                value={newSubDescription}
                onChangeText={setNewSubDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isCreating}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, isCreating && styles.buttonDisabled]}
              onPress={handleAddSubCommunity}
              disabled={isCreating}
              activeOpacity={0.7}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Sub-Community</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Sub-Community Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                setEditingSubCommunity(null);
                setNewSubName('');
                setNewSubLocation('');
                setNewSubDescription('');
              }}
              style={styles.modalCloseButton}
              disabled={isUpdating}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Sub-Community</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Profile Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Profile Image (Logo)</Text>
              <TouchableOpacity
                style={styles.imageUploadButton}
                onPress={pickProfileImage}
                disabled={isUpdating}
                activeOpacity={0.7}
              >
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Tap to upload</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Banner Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Banner Image</Text>
              <TouchableOpacity
                style={styles.bannerUploadButton}
                onPress={pickBannerImage}
                disabled={isUpdating}
                activeOpacity={0.7}
              >
                {bannerImageUri ? (
                  <Image source={{ uri: bannerImageUri }} style={styles.uploadedBanner} />
                ) : (
                  <View style={styles.bannerPlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Tap to upload banner</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dubai Marina Location"
                placeholderTextColor="#999"
                value={newSubName}
                onChangeText={setNewSubName}
                editable={!isUpdating}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dubai Marina, Dubai"
                placeholderTextColor="#999"
                value={newSubLocation}
                onChangeText={setNewSubLocation}
                editable={!isUpdating}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of this location..."
                placeholderTextColor="#999"
                value={newSubDescription}
                onChangeText={setNewSubDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isUpdating}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, isUpdating && styles.buttonDisabled]}
              onPress={handleUpdateSubCommunity}
              disabled={isUpdating}
              activeOpacity={0.7}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Update Sub-Community</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  // Compact Header - Matching Dashboard
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyAddButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  // Sub-Communities List
  section: {
    padding: 16,
  },
  subCommunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subCommunityIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#00D4AA20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconEmoji: {
    fontSize: 28,
  },
  subCommunityInfo: {
    flex: 1,
  },
  subCommunityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subCommunityLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  subCommunityDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#00D4AA20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FF3B3020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  createButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Image Upload Styles
  imageUploadButton: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  bannerUploadButton: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedBanner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
