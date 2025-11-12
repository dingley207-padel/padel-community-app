import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User, AuthResponse } from '../types';
import { registerForPushNotificationsAsync } from '../utils/notifications';

export interface UserRole {
  role_name: string;
  community_id: string | null;
  community_name: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  showPinSetup: boolean;
  userRoles: UserRole[];
  isSuperAdmin: boolean;
  isCommunityManager: boolean;
  selectedRole: string | null;
  setSelectedRole: (role: string) => void;
  switchRole: (role: string) => Promise<void>;
  login: (authData: AuthResponse, skipPinSetup?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  completePinSetup: () => void;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCommunityManager, setIsCommunityManager] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');

      console.log('[AuthContext] loadStoredAuth - has stored token:', !!storedToken, 'has stored user:', !!storedUser);

      if (storedToken && storedUser) {
        // Check if PIN/Biometric is enabled - if so, DON'T auto-login
        // Let the QuickLoginScreen handle authentication first
        const { isPinEnabled, isPinSet } = await import('../utils/security');
        const pinEnabledSetting = await isPinEnabled();
        const pinExists = await isPinSet();

        console.log('[AuthContext] Security check - PIN enabled:', pinEnabledSetting, 'PIN exists:', pinExists);

        if (pinEnabledSetting && pinExists) {
          console.log('[AuthContext] ===== SECURITY ENABLED - SKIPPING AUTO-LOGIN =====');
          console.log('[AuthContext] User must authenticate via QuickLoginScreen');
          // Don't set user/token yet - wait for PIN verification
          // IMPORTANT: We exit here without setting user/token, so AppNavigator shows QuickLoginScreen
          setIsLoading(false);
          return;
        }

        // No security enabled, proceed with auto-login
        console.log('[AuthContext] No security - proceeding with auto-login');
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Validate token with backend to ensure user still exists
        try {
          await api.getMyRoles(); // This will fail if token is invalid
          console.log('[AuthContext] Token validated successfully');
        } catch (error: any) {
          console.error('[AuthContext] Token validation failed - user may have been deleted:', error);
          // Token is invalid, clear everything
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          setToken(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Register for push notifications on app startup (not just during login)
        // This ensures push tokens are always up-to-date
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            console.log('[AuthContext] Push token registered on startup:', pushToken.substring(0, 40) + '...');
            await api.savePushToken(pushToken);
          }
        } catch (pushError) {
          console.error('[AuthContext] Failed to register push notifications on startup:', pushError);
          // Don't fail auth loading if push notification registration fails
        }

        // Load roles after setting token
        await refreshRoles();
      } else {
        console.log('[AuthContext] No stored credentials found');
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      console.log('[AuthContext] loadStoredAuth complete - isLoading will be set to false');
      setIsLoading(false);
    }
  };

  const refreshRoles = async () => {
    try {
      console.log('[AuthContext] Fetching user roles...');
      const rolesData = await api.getMyRoles();

      // Always include 'member' role as an option for everyone
      const roles = rolesData.roles || [];
      const hasMemberRole = roles.some((role: UserRole) => role.role_name === 'member');

      // Add member role if not already present
      if (!hasMemberRole) {
        roles.push({
          role_name: 'member',
          community_id: null,
          community_name: null,
        });
      }

      setUserRoles(roles);
      setIsSuperAdmin(rolesData.is_super_admin || false);

      // Check if user has any community manager roles
      const hasManagerRole = roles.some(
        (role: UserRole) => role.role_name === 'community_manager'
      );
      setIsCommunityManager(hasManagerRole || false);

      // Auto-select role if not already selected
      if (!selectedRole && roles.length > 0) {
        // Use the current role from the user's JWT token
        const currentRole = user?.role || 'member';
        console.log('[AuthContext] Auto-selecting role from user token:', currentRole);
        setSelectedRole(currentRole);
      }

      console.log('[AuthContext] Roles loaded:', rolesData);
    } catch (error) {
      console.error('[AuthContext] Failed to fetch roles:', error);
      // Don't fail if roles can't be loaded
    }
  };

  const login = async (authData: AuthResponse, skipPinSetup: boolean = false) => {
    try {
      await AsyncStorage.setItem('authToken', authData.token);
      await AsyncStorage.setItem('user', JSON.stringify(authData.user));
      setToken(authData.token);
      setUser(authData.user);

      // Validate token with backend (especially important for stored tokens after PIN entry)
      try {
        await refreshRoles(); // This will fail if token is invalid
        console.log('[AuthContext] Token validated during login');
      } catch (error: any) {
        console.error('[AuthContext] Token validation failed during login - user may have been deleted:', error);
        // Token is invalid, clear everything and throw error
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
        setToken(null);
        setUser(null);
        throw new Error('Your account no longer exists. Please create a new account.');
      }

      // For new users: Register push notifications FIRST, then show PIN setup
      // For existing users (skipPinSetup=true): Just register push notifications
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          console.log('[AuthContext] Saving push token to backend');
          await api.savePushToken(pushToken);
        }
      } catch (pushError) {
        console.error('[AuthContext] Failed to register push notifications:', pushError);
        // Don't fail login if push notification registration fails
      }

      // After push notification registration, check if PIN setup is needed
      if (!skipPinSetup) {
        const { isPinSet } = await import('../utils/security');
        const pinExists = await isPinSet();
        if (!pinExists) {
          setShowPinSetup(true);
        }
      }
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const completePinSetup = async () => {
    setShowPinSetup(false);
    // Push notifications are already registered during login, before PIN setup
    // Nothing else needed here
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] ===== LOGOUT STARTED =====');
      // Clear token and user data from AsyncStorage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // NOTE: We do NOT clear security settings (PIN, biometrics) - they persist across logouts
      // NOTE: We do NOT clear push notification permissions - they persist as well
      setToken(null);
      setUser(null);
      setUserRoles([]);
      setIsSuperAdmin(false);
      setIsCommunityManager(false);
      setSelectedRole(null);
      console.log('[AuthContext] ===== LOGOUT COMPLETE - AUTH DATA CLEARED (PIN & PUSH SETTINGS PRESERVED) =====');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      console.log('[AuthContext] updateUser called with:', updates);
      console.log('[AuthContext] Current user profile_image:', user.profile_image);

      // Filter out stale file:// URIs
      if (updates.profile_image?.startsWith('file://')) {
        console.log('[AuthContext] Removing stale file:// URI from updates');
        updates.profile_image = null;
      }

      const updatedUser = { ...user, ...updates };
      console.log('[AuthContext] Updated user profile_image:', updatedUser.profile_image);
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const switchRole = async (role: string) => {
    try {
      console.log(`[AuthContext] Switching to role: ${role}`);
      const response = await api.switchRole(role);

      // Update token and user with the new role
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      setSelectedRole(role);

      console.log(`[AuthContext] Successfully switched to role: ${role}`);
    } catch (error) {
      console.error('[AuthContext] Failed to switch role:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        showPinSetup,
        userRoles,
        isSuperAdmin,
        isCommunityManager,
        selectedRole,
        setSelectedRole,
        switchRole,
        login,
        logout,
        updateUser,
        completePinSetup,
        refreshRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
