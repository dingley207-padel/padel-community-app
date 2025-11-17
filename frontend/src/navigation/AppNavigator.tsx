import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { isPinEnabled, isPinSet } from '../utils/security';

// Screens
import AuthScreen from '../screens/AuthScreen';
import SessionsScreen from '../screens/SessionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QuickLoginScreen from '../screens/QuickLoginScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import RoleSelectorScreen from '../screens/RoleSelectorScreen';
import CommunityManagerDashboard from '../screens/CommunityManagerDashboard';
import CreateSessionScreen from '../screens/CreateSessionScreen';
import ManagerSessionsScreen from '../screens/ManagerSessionsScreen';
import SessionAttendeesScreen from '../screens/SessionAttendeesScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import MembersScreen from '../screens/MembersScreen';
import CommunitiesScreen from '../screens/CommunitiesScreen';
import CreateCommunityScreen from '../screens/CreateCommunityScreen';
import AssignManagerScreen from '../screens/AssignManagerScreen';
import MemberTabNavigator from './MemberTabNavigator';
import EditCommunityScreen from '../screens/EditCommunityScreen';
import SubCommunitiesManagerScreen from '../screens/SubCommunitiesManagerScreen';
import SessionTemplatesManagerScreen from '../screens/SessionTemplatesManagerScreen';
import BulkSessionPublishScreen from '../screens/BulkSessionPublishScreen';
import ManageManagersScreen from '../screens/ManageManagersScreen';
import SendNotificationScreen from '../screens/SendNotificationScreen';
import EditSessionScreen from '../screens/EditSessionScreen';
import SendSessionNotificationScreen from '../screens/SendSessionNotificationScreen';

interface AppNavigatorProps {
  initialAuthStep?: 'register' | 'login';
}

export default function AppNavigator({ initialAuthStep }: AppNavigatorProps = {}) {
  const authContext = useAuth();
  const {
    user,
    isLoading,
    showPinSetup,
    completePinSetup,
    login,
    userRoles,
    selectedRole,
    isSuperAdmin,
    isCommunityManager,
  } = authContext;
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  const [storedUserName, setStoredUserName] = useState<string | undefined>(undefined);
  const [currentScreen, setCurrentScreen] = useState<'sessions' | 'profile' | 'createSession' | 'managerSessions' | 'sessionAttendees' | 'editSession' | 'sendSessionNotification' | 'myBookings' | 'members' | 'communities' | 'createCommunity' | 'assignManager' | 'editCommunity' | 'subCommunities' | 'sessionTemplates' | 'bulkPublish' | 'manageManagers' | 'sendNotification'>('sessions');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionTitle, setSelectedSessionTitle] = useState<string>('');
  const [selectedSessionAttendeeCount, setSelectedSessionAttendeeCount] = useState<number>(0);
  const [managerSessionsInitialTab, setManagerSessionsInitialTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedCommunityName, setSelectedCommunityName] = useState<string>('');
  const [isAppLocked, setIsAppLocked] = useState(false);
  const appState = useRef(AppState.currentState);
  const lastUnlockTime = useRef<number>(0);
  const UNLOCK_COOLDOWN = 3000; // 3 seconds cooldown after unlock

  console.log('[Navigator] ===== RENDER =====');
  console.log('[Navigator] User exists:', !!user);
  console.log('[Navigator] isLoading:', isLoading, '(type:', typeof isLoading + ')');
  console.log('[Navigator] checkingPin:', checkingPin);
  console.log('[Navigator] showQuickLogin:', showQuickLogin);
  console.log('[Navigator] isAppLocked:', isAppLocked);
  console.log('[Navigator] storedUserName:', storedUserName);

  // Check on mount and when user changes
  useEffect(() => {
    console.log('[Navigator] useEffect triggered - User:', !!user, 'isLoading:', isLoading);
    if (!isLoading) {
      checkQuickLoginAvailable();
    }

    // Reset to sessions screen when user logs in
    if (user) {
      setCurrentScreen('sessions');
    }
  }, [user, isLoading]);

  // Listen for app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      console.log('[Navigator] AppState changed from', appState.current, 'to', nextAppState);

      // App coming to foreground from background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[Navigator] App returned to foreground');

        // Check if we're within the cooldown period after unlocking
        const timeSinceUnlock = Date.now() - lastUnlockTime.current;
        if (timeSinceUnlock < UNLOCK_COOLDOWN) {
          console.log('[Navigator] Within cooldown period, not locking (', timeSinceUnlock, 'ms since unlock)');
          appState.current = nextAppState;
          return;
        }

        // If user is logged in and PIN is enabled, lock the app
        if (user) {
          const pinEnabledSetting = await isPinEnabled();
          const pinExists = await isPinSet();

          console.log('[Navigator] Lock check - PIN enabled:', pinEnabledSetting, 'PIN exists:', pinExists);

          if (pinEnabledSetting && pinExists) {
            console.log('[Navigator] Locking app - showing PIN screen');
            setIsAppLocked(true);
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  const checkQuickLoginAvailable = async () => {
    console.log('[Navigator] ===== checkQuickLoginAvailable START =====');
    console.log('[Navigator] User exists:', !!user);
    console.log('[Navigator] Current state - showQuickLogin:', showQuickLogin, 'checkingPin:', checkingPin);
    setCheckingPin(true);

    if (!user) {
      console.log('[Navigator] No user - checking for stored credentials and PIN settings');
      // Get stored user for display name
      let hasStoredToken = false;
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const storedUserData = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('authToken');
        hasStoredToken = !!storedToken;
        console.log('[Navigator] Has stored user data:', !!storedUserData, 'Has stored token:', !!storedToken);

        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          setStoredUserName(userData.name);
          console.log('[Navigator] Stored user name:', userData.name);
        }
      } catch (error) {
        console.log('[Navigator] Error reading stored data:', error);
      }

      const pinEnabledSetting = await isPinEnabled();
      const pinExists = await isPinSet();

      console.log('[Navigator] PIN Check Results:');
      console.log('[Navigator]   - PIN Enabled:', pinEnabledSetting);
      console.log('[Navigator]   - PIN Exists:', pinExists);
      console.log('[Navigator]   - Has Stored Token:', hasStoredToken);

      // Only show quick login if PIN is set AND there's a valid auth token
      // If PIN exists but no token, clear the PIN (user deleted app and reinstalled)
      if (pinEnabledSetting && pinExists && hasStoredToken) {
        console.log('[Navigator] ===== SHOWING QUICK LOGIN SCREEN =====');
        setShowQuickLogin(true);
      } else {
        if ((pinEnabledSetting || pinExists) && !hasStoredToken) {
          console.log('[Navigator] ===== PIN EXISTS BUT NO TOKEN - CLEARING PIN SETTINGS =====');
          const { clearSecuritySettings } = await import('../utils/security');
          await clearSecuritySettings();
        }
        console.log('[Navigator] ===== PIN NOT ENABLED OR NO TOKEN - SHOWING REGULAR AUTH =====');
        setShowQuickLogin(false);
      }
    } else {
      console.log('[Navigator] User already logged in, hiding quick login');
      setShowQuickLogin(false);
      setStoredUserName(undefined);
    }

    setCheckingPin(false);
    console.log('[Navigator] ===== checkQuickLoginAvailable COMPLETE =====');
    console.log('[Navigator] Final state - showQuickLogin:', showQuickLogin);
  };

  if (isLoading || checkingPin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  // Show PIN setup after successful login
  if (user && showPinSetup) {
    return (
      <PinSetupScreen
        onComplete={completePinSetup}
        onSkip={completePinSetup}
      />
    );
  }

  // Show PIN lock screen if app was locked (user is logged in but app returned from background)
  if (user && isAppLocked) {
    return (
      <QuickLoginScreen
        onSuccess={async () => {
          console.log('[Navigator] App unlocked with PIN');
          lastUnlockTime.current = Date.now();
          setIsAppLocked(false);
        }}
        onUsePassword={async () => {
          console.log('[Navigator] User chose password login - logging out');
          // User wants to use password instead, so we need to log them out
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          setIsAppLocked(false);
          window.location.reload(); // Force reload to show login screen
        }}
        userName={user.name}
      />
    );
  }

  console.log('Navigator State - User:', !!user, 'ShowQuickLogin:', showQuickLogin, 'CheckingPin:', checkingPin);

  // Not logged in - show auth or quick login
  if (!user) {
    if (showQuickLogin) {
      return (
        <QuickLoginScreen
          onSuccess={async () => {
            console.log('[Navigator] Quick login successful, reloading auth state');
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const storedToken = await AsyncStorage.getItem('authToken');
            const storedUser = await AsyncStorage.getItem('user');
            console.log('[Navigator] Stored token exists:', !!storedToken);
            console.log('[Navigator] Stored user exists:', !!storedUser);
            if (storedToken && storedUser) {
              console.log('[Navigator] Calling login with stored data');
              await login({ token: storedToken, user: JSON.parse(storedUser), message: '' }, true);
              console.log('[Navigator] Login complete');
            } else {
              console.log('[Navigator] ERROR: No stored token found! Redirecting to password login');
              setShowQuickLogin(false);
            }
          }}
          onUsePassword={() => {
            console.log('[Navigator] User chose to use password instead');
            setShowQuickLogin(false);
          }}
          userName={storedUserName}
        />
      );
    } else {
      return <AuthScreen initialStep={initialAuthStep} />;
    }
  }

  // Logged in - check if role selector should be shown
  const hasMultipleRoles = userRoles.length > 1;
  const needsRoleSelection = hasMultipleRoles && !selectedRole;

  // Show role selector if user has multiple roles and hasn't selected one
  if (needsRoleSelection || showRoleSelector) {
    return (
      <RoleSelectorScreen
        onRoleSelected={(role) => {
          setShowRoleSelector(false);
          setCurrentScreen('sessions');
        }}
      />
    );
  }

  // Render based on selected role
  if (selectedRole === 'super_admin') {
    // Super Admin - show Community Manager Dashboard with full access
    if (currentScreen === 'profile') {
      return <ProfileScreen onBack={() => setCurrentScreen('sessions')} />;
    } else if (currentScreen === 'createSession') {
      return (
        <CreateSessionScreen
          onBack={() => setCurrentScreen('sessions')}
          onSessionCreated={() => setCurrentScreen('sessions')}
        />
      );
    } else if (currentScreen === 'managerSessions') {
      return (
        <ManagerSessionsScreen
          onBack={() => setCurrentScreen('sessions')}
          onViewAttendees={(sessionId: string, sessionTitle: string) => {
            setSelectedSessionId(sessionId);
            setSelectedSessionTitle(sessionTitle);
            setCurrentScreen('sessionAttendees');
          }}
          onEditSession={(sessionId: string) => {
            setSelectedSessionId(sessionId);
            setCurrentScreen('editSession');
          }}
          onSendNotification={(sessionId: string, sessionTitle: string, attendeeCount: number) => {
            setSelectedSessionId(sessionId);
            setSelectedSessionTitle(sessionTitle);
            setSelectedSessionAttendeeCount(attendeeCount);
            setCurrentScreen('sendSessionNotification');
          }}
          initialTab={managerSessionsInitialTab}
        />
      );
    } else if (currentScreen === 'editSession' && selectedSessionId) {
      return (
        <EditSessionScreen
          sessionId={selectedSessionId}
          onBack={() => setCurrentScreen('managerSessions')}
          onSessionUpdated={() => {
            setCurrentScreen('managerSessions');
          }}
        />
      );
    } else if (currentScreen === 'sendSessionNotification' && selectedSessionId) {
      return (
        <SendSessionNotificationScreen
          sessionId={selectedSessionId}
          sessionTitle={selectedSessionTitle}
          attendeeCount={selectedSessionAttendeeCount}
          onGoBack={() => setCurrentScreen('managerSessions')}
        />
      );
    } else if (currentScreen === 'sessionAttendees' && selectedSessionId) {
      return (
        <SessionAttendeesScreen
          sessionId={selectedSessionId}
          sessionTitle={selectedSessionTitle}
          onBack={() => setCurrentScreen('managerSessions')}
        />
      );
    } else if (currentScreen === 'communities') {
      return (
        <CommunitiesScreen
          onBack={() => setCurrentScreen('sessions')}
          onCreateCommunity={() => setCurrentScreen('createCommunity')}
          isSuperAdmin={true}
        />
      );
    } else if (currentScreen === 'createCommunity') {
      return (
        <CreateCommunityScreen
          onBack={() => setCurrentScreen('communities')}
          onCommunityCreated={() => setCurrentScreen('communities')}
        />
      );
    } else if (currentScreen === 'members' && selectedCommunityId) {
      return (
        <MembersScreen
          communityId={selectedCommunityId}
          onBack={() => setCurrentScreen('sessions')}
        />
      );
    } else if (currentScreen === 'assignManager') {
      return (
        <AssignManagerScreen
          onBack={() => setCurrentScreen('sessions')}
        />
      );
    } else if (currentScreen === 'editCommunity' && selectedCommunityId) {
      return (
        <EditCommunityScreen
          communityId={selectedCommunityId}
          onBack={() => setCurrentScreen('sessions')}
          onSaved={() => {
            setCurrentScreen('sessions');
          }}
        />
      );
    } else if (currentScreen === 'subCommunities' && selectedCommunityId && selectedCommunityName) {
      return (
        <SubCommunitiesManagerScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onBack={() => setCurrentScreen('sessions')}
        />
      );
    } else if (currentScreen === 'sessionTemplates' && selectedCommunityId && selectedCommunityName) {
      return (
        <SessionTemplatesManagerScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onBack={() => setCurrentScreen('sessions')}
          onBulkPublish={() => setCurrentScreen('bulkPublish')}
        />
      );
    } else if (currentScreen === 'bulkPublish' && selectedCommunityId && selectedCommunityName) {
      return (
        <BulkSessionPublishScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onBack={() => setCurrentScreen('sessionTemplates')}
          onComplete={() => {
            setCurrentScreen('managerSessions');
            setManagerSessionsInitialTab('active');
          }}
        />
      );
    } else if (currentScreen === 'manageManagers' && selectedCommunityId && selectedCommunityName) {
      return (
        <ManageManagersScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onGoBack={() => setCurrentScreen('sessions')}
        />
      );
    } else if (currentScreen === 'sendNotification' && selectedCommunityId && selectedCommunityName) {
      return (
        <SendNotificationScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onGoBack={() => setCurrentScreen('sessions')}
        />
      );
    }
    return (
      <CommunityManagerDashboard
        onNavigateToCreateSession={() => setCurrentScreen('createSession')}
        onNavigateToProfile={() => setCurrentScreen('profile')}
        onNavigateToViewSessions={(initialTab) => {
          setManagerSessionsInitialTab(initialTab || 'active');
          setCurrentScreen('managerSessions');
        }}
        onNavigateToMembers={(communityId) => {
          setSelectedCommunityId(communityId);
          setCurrentScreen('members');
        }}
        onNavigateToCommunities={() => setCurrentScreen('communities')}
        onNavigateToAssignManager={() => setCurrentScreen('assignManager')}
        onNavigateToEditCommunity={(communityId) => {
          setSelectedCommunityId(communityId);
          setCurrentScreen('editCommunity');
        }}
        onNavigateToSendNotification={(communityId, communityName) => {
          setSelectedCommunityId(communityId);
          setSelectedCommunityName(communityName);
          setCurrentScreen('sendNotification');
        }}
        onNavigateToSubCommunities={(communityId, communityName) => {
          setSelectedCommunityId(communityId);
          setSelectedCommunityName(communityName);
          setCurrentScreen('subCommunities');
        }}
        onNavigateToSessionTemplates={(communityId, communityName) => {
          setSelectedCommunityId(communityId);
          setSelectedCommunityName(communityName);
          setCurrentScreen('sessionTemplates');
        }}
        onNavigateToManageManagers={(communityId, communityName) => {
          setSelectedCommunityId(communityId);
          setSelectedCommunityName(communityName);
          setCurrentScreen('manageManagers');
        }}
        onSwitchRole={() => setShowRoleSelector(true)}
      />
    );
  } else if (selectedRole === 'community_manager') {
    if (currentScreen === 'profile') {
      return <ProfileScreen onBack={() => setCurrentScreen('sessions')} />;
    } else if (currentScreen === 'createSession') {
      return (
        <CreateSessionScreen
          onBack={() => setCurrentScreen('sessions')}
          onSessionCreated={() => setCurrentScreen('sessions')}
        />
      );
    } else if (currentScreen === 'managerSessions') {
      return (
        <ManagerSessionsScreen
          onBack={() => setCurrentScreen('sessions')}
          onViewAttendees={(sessionId: string, sessionTitle: string) => {
            setSelectedSessionId(sessionId);
            setSelectedSessionTitle(sessionTitle);
            setCurrentScreen('sessionAttendees');
          }}
          onEditSession={(sessionId: string) => {
            setSelectedSessionId(sessionId);
            setCurrentScreen('editSession');
          }}
          onSendNotification={(sessionId: string, sessionTitle: string, attendeeCount: number) => {
            setSelectedSessionId(sessionId);
            setSelectedSessionTitle(sessionTitle);
            setSelectedSessionAttendeeCount(attendeeCount);
            setCurrentScreen('sendSessionNotification');
          }}
          initialTab={managerSessionsInitialTab}
        />
      );
    } else if (currentScreen === 'editSession' && selectedSessionId) {
      return (
        <EditSessionScreen
          sessionId={selectedSessionId}
          onBack={() => setCurrentScreen('managerSessions')}
          onSessionUpdated={() => {
            setCurrentScreen('managerSessions');
          }}
        />
      );
    } else if (currentScreen === 'sendSessionNotification' && selectedSessionId) {
      return (
        <SendSessionNotificationScreen
          sessionId={selectedSessionId}
          sessionTitle={selectedSessionTitle}
          attendeeCount={selectedSessionAttendeeCount}
          onGoBack={() => setCurrentScreen('managerSessions')}
        />
      );
    } else if (currentScreen === 'sessionAttendees' && selectedSessionId) {
      return (
        <SessionAttendeesScreen
          sessionId={selectedSessionId}
          sessionTitle={selectedSessionTitle}
          onBack={() => setCurrentScreen('managerSessions')}
        />
      );
    } else if (currentScreen === 'members' && selectedCommunityId) {
      return (
        <MembersScreen
          communityId={selectedCommunityId}
          onBack={() => setCurrentScreen('sessions')}
        />
      );
    } else if (currentScreen === 'editCommunity' && selectedCommunityId) {
      return (
        <EditCommunityScreen
          communityId={selectedCommunityId}
          onBack={() => setCurrentScreen('sessions')}
          onSaved={() => {
            setCurrentScreen('sessions');
          }}
        />
      );
    } else if (currentScreen === 'subCommunities' && selectedCommunityId && selectedCommunityName) {
      return (
        <SubCommunitiesManagerScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onBack={() => setCurrentScreen('sessions')}
        />
      );
    } else if (currentScreen === 'sessionTemplates' && selectedCommunityId && selectedCommunityName) {
      return (
        <SessionTemplatesManagerScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onBack={() => setCurrentScreen('sessions')}
          onBulkPublish={() => setCurrentScreen('bulkPublish')}
        />
      );
    } else if (currentScreen === 'bulkPublish' && selectedCommunityId && selectedCommunityName) {
      return (
        <BulkSessionPublishScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onBack={() => setCurrentScreen('sessionTemplates')}
          onComplete={() => {
            setCurrentScreen('managerSessions');
            setManagerSessionsInitialTab('active');
          }}
        />
      );
    } else if (currentScreen === 'manageManagers' && selectedCommunityId && selectedCommunityName) {
      return (
        <ManageManagersScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onGoBack={() => setCurrentScreen('sessions')}
        />
      );
    } else if (currentScreen === 'sendNotification' && selectedCommunityId && selectedCommunityName) {
      return (
        <SendNotificationScreen
          communityId={selectedCommunityId}
          communityName={selectedCommunityName}
          onGoBack={() => setCurrentScreen('sessions')}
        />
      );
    }
    return (
      <CommunityManagerDashboard
        onNavigateToCreateSession={() => setCurrentScreen('createSession')}
        onNavigateToProfile={() => setCurrentScreen('profile')}
        onNavigateToViewSessions={(initialTab) => {
          setManagerSessionsInitialTab(initialTab || 'active');
          setCurrentScreen('managerSessions');
        }}
        onNavigateToMembers={(communityId) => {
          setSelectedCommunityId(communityId);
          setCurrentScreen('members');
        }}
        onNavigateToEditCommunity={(communityId) => {
          setSelectedCommunityId(communityId);
          setCurrentScreen('editCommunity');
        }}
        onNavigateToSendNotification={(communityId, communityName) => {
          setSelectedCommunityId(communityId);
          setSelectedCommunityName(communityName);
          setCurrentScreen('sendNotification');
        }}
        onNavigateToSubCommunities={(communityId, communityName) => {
          setSelectedCommunityId(communityId);
          setSelectedCommunityName(communityName);
          setCurrentScreen('subCommunities');
        }}
        onNavigateToSessionTemplates={(communityId, communityName) => {
          setSelectedCommunityId(communityId);
          setSelectedCommunityName(communityName);
          setCurrentScreen('sessionTemplates');
        }}
        onNavigateToManageManagers={(communityId, communityName) => {
          setSelectedCommunityId(communityId);
          setSelectedCommunityName(communityName);
          setCurrentScreen('manageManagers');
        }}
        onSwitchRole={() => setShowRoleSelector(true)}
      />
    );
  } else {
    // Default member view - use tab navigator
    return (
      <MemberTabNavigator
        onSwitchRole={() => setShowRoleSelector(true)}
        isSuperAdmin={isSuperAdmin}
      />
    );
  }
}
