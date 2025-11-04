import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { AddProfileIcon } from '../components/icons/AddProfileIcon';
import { convertImageToBase64 } from '../utils/imageUtils';
import {
  isPinSet,
  isPinEnabled,
  setPinEnabled,
  isBiometricEnabled,
  setBiometricEnabled,
  checkBiometricSupport,
  removePin,
  BiometricType,
} from '../utils/security';
import PinSetupScreen from './PinSetupScreen';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';
type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | '';

const GRADES: Grade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D'];

export default function ProfileScreen({ onBack }: { onBack: () => void }) {
  const { user, updateUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);

  // Form fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState('');
  const [grade, setGrade] = useState<Grade>('');
  const [gender, setGender] = useState<Gender>('');
  const [profileImage, setProfileImage] = useState('');

  // Track original values to detect changes
  const [originalValues, setOriginalValues] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    grade: '' as Grade,
    gender: '' as Gender,
    profileImage: '',
  });

  // Security settings
  const [pinEnabled, setPinEnabledState] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [pinExists, setPinExists] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);

  useEffect(() => {
    loadProfile();
    loadSecuritySettings();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.getCurrentUser();
      console.log('Loaded profile response:', response); // Debug

      // Handle both formats: { user: {...} } and direct user object
      const profile = response.user || response;

      const values = {
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        grade: (profile.skill_level || '') as Grade,
        gender: (profile.gender || '') as Gender,
        profileImage: profile.profile_image || '',
      };

      setName(values.name);
      setEmail(values.email);
      setPhone(values.phone);
      setLocation(values.location);
      setGrade(values.grade);
      setGender(values.gender);
      setProfileImage(values.profileImage);
      setOriginalValues(values);
      console.log('Set state - Name:', profile.name, 'Email:', profile.email, 'Phone:', profile.phone); // Debug
    } catch (error: any) {
      console.error('Load profile error:', error);
      Alert.alert('Error', 'Failed to load profile: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecuritySettings = async () => {
    const [pinEnabledSetting, pinExistsSetting, biometricEnabledSetting, biometric] = await Promise.all([
      isPinEnabled(),
      isPinSet(),
      isBiometricEnabled(),
      checkBiometricSupport(),
    ]);

    setPinEnabledState(pinEnabledSetting);
    setPinExists(pinExistsSetting);
    setBiometricEnabledState(biometricEnabledSetting);
    setBiometricAvailable(biometric.isSupported);
    setBiometricType(biometric.type);
  };

  const hasUnsavedChanges = () => {
    return (
      name.trim() !== originalValues.name ||
      email.trim() !== originalValues.email ||
      phone.trim() !== originalValues.phone ||
      location.trim() !== originalValues.location ||
      grade !== originalValues.grade ||
      gender !== originalValues.gender ||
      profileImage.trim() !== originalValues.profileImage
    );
  };

  const handleSave = async (skipSuccessMessage = false) => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }

    try {
      setIsSaving(true);
      const updates = {
        name: name.trim(),
        email: email.trim() || null,
        location: location.trim() || null,
        skill_level: grade || null,
        gender: gender || null,
        profile_image: profileImage.trim() || null,
      };

      console.log('[ProfileScreen] Saving profile with profile_image:', updates.profile_image ? updates.profile_image.substring(0, 50) : 'null');

      const response = await api.updateProfile(updates);
      const updatedUser = response.user || response;

      console.log('[ProfileScreen] Backend response profile_image:', updatedUser.profile_image ? updatedUser.profile_image.substring(0, 50) : 'null');

      updateUser(updatedUser);

      // Update state with the actual saved value (null becomes empty string)
      const savedProfileImage = updatedUser.profile_image || '';
      setProfileImage(savedProfileImage);

      // Update original values to match saved values
      setOriginalValues({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        grade: grade,
        gender: gender,
        profileImage: savedProfileImage,
      });

      if (!skipSuccessMessage) {
        Alert.alert('Success', 'Profile updated successfully!');
      }
      return true;
    } catch (error: any) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.errors?.[0]?.msg ||
                          error.message ||
                          'Failed to update profile';

      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before leaving?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => onBack(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Save',
            onPress: async () => {
              const saved = await handleSave(true);
              if (saved) {
                onBack();
              }
            },
          },
        ]
      );
    } else {
      onBack();
    }
  };

  const handleTogglePin = async (value: boolean) => {
    if (value) {
      // Enable PIN - always show setup screen to set new PIN
      setShowPinSetup(true);
    } else {
      // Disable PIN - this will also delete the stored PIN
      Alert.alert(
        'Disable PIN?',
        'This will remove your PIN. You will need to set a new PIN if you enable it again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await removePin();
              await setPinEnabled(false);
              setPinExists(false);
              setPinEnabledState(false);
              // Also disable biometric since it requires a PIN
              await setBiometricEnabled(false);
              setBiometricEnabledState(false);
              Alert.alert('PIN Disabled', 'Your PIN has been removed. Enable it again to set a new PIN.');
            },
          },
        ]
      );
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value && !pinExists) {
      Alert.alert('Setup PIN First', 'Please set up a PIN before enabling biometric login');
      return;
    }

    await setBiometricEnabled(value);
    setBiometricEnabledState(value);

    if (value) {
      Alert.alert(
        'Biometric Enabled',
        `${biometricType === 'facial' ? 'Face ID' : 'Fingerprint'} login has been enabled!`
      );
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is needed to select photos');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        console.log('[ProfileScreen] Converting image to base64');
        const base64Image = await convertImageToBase64(result.assets[0].uri);
        console.log('[ProfileScreen] Conversion complete, setting profile image');
        setProfileImage(base64Image);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeProfileImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setProfileImage('');
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    const options: any[] = [
      {
        text: 'Take Photo',
        onPress: () => pickImage(true),
      },
      {
        text: 'Choose from Library',
        onPress: () => pickImage(false),
      },
    ];

    // Add remove option if there's a current profile image
    if (profileImage) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: removeProfileImage,
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert(
      'Profile Picture',
      'Choose an option',
      options
    );
  };

  const renderGenderOption = (value: Gender, label: string) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.genderOption,
        gender === value && styles.genderOptionSelected,
      ]}
      onPress={() => setGender(value)}
    >
      <Text
        style={[
          styles.genderOptionText,
          gender === value && styles.genderOptionTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const handleGradeSelect = (selectedGrade: Grade) => {
    setGrade(selectedGrade);
    setShowGradeModal(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.padelTeal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Padel ONE Branding */}
      <View style={styles.header}>
        <View style={{ width: 44 }} />

        <View style={styles.appNameRow}>
          {/* Pr text - black */}
          <Text style={styles.appName}>Pr</Text>

          {/* Tennis ball icon (replaces o) - black, sized to match lowercase letters */}
          <Ionicons name="tennisball" size={24} color="#000000" style={styles.ballIconSmall} />

          {/* file text - black */}
          <Text style={styles.appName}>file</Text>
        </View>

        <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
          <Ionicons name="close" size={32} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePictureWrapper}>
            <TouchableOpacity
              style={styles.profilePictureContainer}
              onPress={showImageOptions}
              activeOpacity={0.8}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profilePicture}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <AddProfileIcon size={48} color="#8FFE09" />
                </View>
              )}
            </TouchableOpacity>
            {profileImage && (
              <TouchableOpacity
                style={styles.trashIconContainer}
                onPress={removeProfileImage}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={Colors.secondary}
          />
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={Colors.secondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone (read-only) */}
        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            value={phone}
            editable={false}
            placeholder="Not set"
            placeholderTextColor={Colors.secondary}
          />
          <Text style={styles.helper}>Phone number cannot be changed</Text>
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, Country"
            placeholderTextColor={Colors.secondary}
          />
        </View>

        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionsRow}>
            {renderGenderOption('male', 'Male')}
            {renderGenderOption('female', 'Female')}
          </View>
          <View style={styles.optionsRow}>
            {renderGenderOption('other', 'Other')}
            {renderGenderOption('prefer_not_to_say', 'Prefer not to say')}
          </View>
        </View>

        {/* Grade */}
        <View style={styles.field}>
          <Text style={styles.label}>Grade</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowGradeModal(true)}
          >
            <Text style={[styles.dropdownText, !grade && styles.dropdownPlaceholder]}>
              {grade || 'Select your grade'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Security Settings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Security & Login</Text>
        </View>

        {/* PIN Login Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>PIN Login</Text>
            <Text style={styles.settingHelper}>
              {pinEnabled ? 'Using 4-digit PIN to login' : 'Toggle on to set up a PIN'}
            </Text>
          </View>
          <Switch
            value={pinEnabled}
            onValueChange={handleTogglePin}
            trackColor={{ false: Colors.separatorLight, true: Colors.padelTeal }}
            thumbColor={Colors.backgroundElevated}
          />
        </View>

        {/* Biometric Login Toggle */}
        {biometricAvailable && (
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {biometricType === 'facial' ? 'Face ID' : 'Fingerprint'} Login
              </Text>
              <Text style={styles.settingHelper}>
                Login quickly with {biometricType === 'facial' ? 'your face' : 'your fingerprint'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: Colors.separatorLight, true: Colors.padelTeal }}
              thumbColor={Colors.backgroundElevated}
              disabled={!pinExists}
            />
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* PIN Setup Modal */}
      <Modal
        visible={showPinSetup}
        animationType="slide"
        onRequestClose={() => setShowPinSetup(false)}
      >
        <PinSetupScreen
          onComplete={async () => {
            setShowPinSetup(false);
            await loadSecuritySettings();
            Alert.alert('Success', 'PIN has been set up successfully!');
          }}
          onSkip={() => setShowPinSetup(false)}
        />
      </Modal>

      {/* Grade Selection Modal */}
      <Modal
        visible={showGradeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Grade</Text>
              <TouchableOpacity onPress={() => setShowGradeModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.gradeList}>
              {GRADES.map((gradeOption) => (
                <TouchableOpacity
                  key={gradeOption}
                  style={[
                    styles.gradeItem,
                    grade === gradeOption && styles.gradeItemSelected,
                  ]}
                  onPress={() => handleGradeSelect(gradeOption)}
                >
                  <Text
                    style={[
                      styles.gradeItemText,
                      grade === gradeOption && styles.gradeItemTextSelected,
                    ]}
                  >
                    {gradeOption}
                  </Text>
                  {grade === gradeOption && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',  // White background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',  // White background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    backgroundColor: '#8FFE09',  // Neon green header
    borderBottomWidth: 0,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',  // Black text
    letterSpacing: 0.5,
  },
  ballIcon: {
    marginHorizontal: 2,
    marginBottom: -2,
  },
  ballIconSmall: {
    marginLeft: -2,
    marginRight: 0,
    marginBottom: -4,  // Adjust vertical alignment to match lowercase letters
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',  // White background
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  profilePictureWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  trashIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF3B30',
    ...Shadows.sm,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  profilePicturePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',  // White background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8FFE09',  // Neon green outline
    borderRadius: 60,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: TextStyles.callout.fontSize,
    fontWeight: '600',
    color: '#000000',  // Black text
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: '#F5F5F5',  // Light grey background
    borderWidth: 1,
    borderColor: '#E0E0E0',  // Light grey border
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: TextStyles.callout.fontSize,
    color: '#000000',  // Black text
  },
  inputReadonly: {
    backgroundColor: '#FAFAFA',  // Very light grey
    color: '#999999',  // Grey text for readonly
  },
  helper: {
    fontSize: TextStyles.caption.fontSize,
    color: '#666666',  // Medium grey
    marginTop: Spacing.xs,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',  // Light grey border
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F5F5F5',  // Light grey background
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#8FFE09',  // Neon green border
    backgroundColor: 'rgba(143, 254, 9, 0.1)',  // Light neon green tint
  },
  genderOptionText: {
    fontSize: TextStyles.subheadline.fontSize,
    color: '#666666',  // Medium grey
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#000000',  // Black text when selected
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',  // Light grey background
    borderWidth: 1,
    borderColor: '#E0E0E0',  // Light grey border
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  dropdownText: {
    fontSize: TextStyles.callout.fontSize,
    color: '#000000',  // Black text
  },
  dropdownPlaceholder: {
    color: '#999999',  // Grey placeholder
  },
  dropdownArrow: {
    fontSize: TextStyles.caption.fontSize,
    color: '#666666',  // Medium grey
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Dark overlay
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',  // White background
    borderTopLeftRadius: Spacing.lg,
    borderTopRightRadius: Spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',  // Light grey border
  },
  modalTitle: {
    fontSize: TextStyles.title3.fontSize,
    fontWeight: 'bold',
    color: '#000000',  // Black text
  },
  modalClose: {
    fontSize: Spacing.lg,
    color: '#666666',  // Medium grey
    fontWeight: '300',
  },
  gradeList: {
    padding: 0,
  },
  gradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',  // Light grey border
  },
  gradeItemSelected: {
    backgroundColor: 'rgba(143, 254, 9, 0.1)',  // Light neon green tint
  },
  gradeItemText: {
    fontSize: TextStyles.headline.fontSize,
    color: '#000000',  // Black text
    fontWeight: '500',
  },
  gradeItemTextSelected: {
    color: '#000000',  // Black text (stays black when selected)
    fontWeight: '600',
  },
  checkmark: {
    fontSize: TextStyles.title3.fontSize,
    color: '#8FFE09',  // Neon green checkmark
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: Colors.red,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  logoutButtonText: {
    color: '#FFFFFF',  // White text
    fontSize: TextStyles.callout.fontSize,
    fontWeight: 'bold',
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',  // Light grey border
  },
  sectionTitle: {
    fontSize: TextStyles.headline.fontSize,
    fontWeight: '700',
    color: '#000000',  // Black text
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',  // Light grey background
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',  // Light grey border
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: TextStyles.callout.fontSize,
    fontWeight: '600',
    color: '#000000',  // Black text
    marginBottom: Spacing.xs,
  },
  settingHelper: {
    fontSize: TextStyles.footnote.fontSize,
    color: '#666666',  // Medium grey
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  dangerButtonText: {
    color: Colors.red,
    fontSize: TextStyles.subheadline.fontSize,
    fontWeight: '600',
  },
});
