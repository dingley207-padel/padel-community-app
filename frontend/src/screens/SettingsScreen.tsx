import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including:\n\n• Profile information\n• Bookings history\n• Community memberships\n• Friends connections',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion API call
            Alert.alert('Coming Soon', 'Account deletion feature will be available soon.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={onBack} style={styles.closeButton}>
          <Ionicons name="close" size={32} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="trash-outline" size={24} color={Colors.red} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: Colors.red }]}>
                  Delete Account
                </Text>
                <Text style={styles.settingSubtitle}>
                  Permanently delete your account and data
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Coming Soon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>

          <View style={styles.comingSoonCard}>
            <Ionicons name="construct-outline" size={48} color={Colors.padelTeal} />
            <Text style={styles.comingSoonText}>
              More settings coming soon
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    backgroundColor: '#8FFE09',
    borderBottomWidth: 0,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.md,
    color: '#666666',
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  comingSoonCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginTop: Spacing.md,
  },
});
