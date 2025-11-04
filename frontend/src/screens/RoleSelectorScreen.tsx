import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

interface RoleSelectorScreenProps {
  onRoleSelected: (role: string) => void;
}

export default function RoleSelectorScreen({ onRoleSelected }: RoleSelectorScreenProps) {
  const { userRoles, selectedRole, switchRole, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = async (roleName: string) => {
    try {
      setIsLoading(true);
      await switchRole(roleName);
      onRoleSelected(roleName);
    } catch (error: any) {
      console.error('Failed to switch role:', error);
      Alert.alert(
        'Role Switch Failed',
        error?.response?.data?.error || 'Failed to switch role. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique roles
  const uniqueRoles = React.useMemo(() => {
    const roles = new Set<string>();
    userRoles.forEach(role => roles.add(role.role_name));
    return Array.from(roles);
  }, [userRoles]);

  // Get role display info - BOLD VIBRANT DESIGN
  const getRoleInfo = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
        return {
          title: 'Super Admin',
          description: 'Full platform access and management',
          icon: '👑',
        };
      case 'community_manager':
        const managerRoles = userRoles.filter(r => r.role_name === 'community_manager');
        const communities = managerRoles.map(r => r.community_name).filter(Boolean);
        return {
          title: 'Community Manager',
          description: communities.length > 0
            ? `Manage: ${communities.join(', ')}`
            : 'Manage your communities',
          icon: '🏘️',
        };
      case 'member':
        return {
          title: 'Member',
          description: 'Browse and book sessions',
          icon: '👤',
        };
      default:
        return {
          title: roleName,
          description: 'User role',
          icon: '🔹',
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient background */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.subtitle}>Select your role to continue</Text>
        </View>

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.brand} />
            <Text style={styles.loadingText}>Switching role...</Text>
          </View>
        )}

        {/* Role cards - BOLD NEW DESIGN */}
        <View style={styles.rolesContainer}>
          {uniqueRoles.map((roleName) => {
            const roleInfo = getRoleInfo(roleName);
            const isSelected = selectedRole === roleName;

            return (
              <TouchableOpacity
                key={roleName}
                onPress={() => handleRoleSelect(roleName)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isSelected ? (
                  // Selected card with NEON GREEN GRADIENT
                  <LinearGradient
                    colors={['#8FFE09', '#6FD300']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.roleCard, styles.selectedCard]}
                  >
                    <View style={styles.selectedIconContainer}>
                      <Text style={styles.selectedIcon}>{roleInfo.icon}</Text>
                    </View>
                    <View style={styles.roleInfo}>
                      <Text style={styles.selectedRoleTitle}>{roleInfo.title}</Text>
                      <Text style={styles.selectedRoleDescription}>{roleInfo.description}</Text>
                    </View>
                    <View style={styles.checkmarkContainer}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  // Unselected glass card
                  <View style={styles.roleCard}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.icon}>{roleInfo.icon}</Text>
                    </View>
                    <View style={styles.roleInfo}>
                      <Text style={styles.roleTitle}>{roleInfo.title}</Text>
                      <Text style={styles.roleDescription}>{roleInfo.description}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Empty state */}
        {uniqueRoles.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyTitle}>No roles assigned</Text>
            <Text style={styles.emptyDescription}>
              Contact an administrator to get access
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.sm,
  },
  greeting: {
    ...TextStyles.subheadline,
    marginBottom: Spacing.xs,
  },
  userName: {
    ...TextStyles.largeTitle,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.body,
    color: Colors.textSecondary,
  },

  // Loading card
  loadingCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadows.glass,
  },
  loadingText: {
    ...TextStyles.callout,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },

  // Role cards container
  rolesContainer: {
    gap: Spacing.lg,
  },

  // Base role card - DRAMATICALLY ROUNDED
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 28, // HUGE BORDER RADIUS!
    padding: Spacing.xl,
    minHeight: 100,
    ...Shadows.md,
  },

  // Selected card styling with gradient
  selectedCard: {
    ...Shadows.brandGlow,
    // Gradient replaces backgroundColor
  },

  // Unselected icon container
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  icon: {
    fontSize: 32,
  },

  // Selected icon container - white on green
  selectedIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  selectedIcon: {
    fontSize: 32,
  },

  // Role info
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    ...TextStyles.title3,
    marginBottom: Spacing.xs,
  },
  roleDescription: {
    ...TextStyles.subheadline,
  },

  // Selected role text - dark on neon green
  selectedRoleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textOnBrand,
    marginBottom: Spacing.xs,
  },
  selectedRoleDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(13, 27, 42, 0.8)', // Semi-transparent dark
  },

  // Checkmark for selected
  checkmarkContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textOnBrand,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxxl,
    marginTop: Spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...TextStyles.title1,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
