import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Text, Alert, Linking } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Shadows, TextStyles } from '../styles/appleDesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { useInAppNotification } from '../contexts/InAppNotificationContext';
import { clearSecuritySettings } from '../utils/security';
import { addNotificationResponseListener, addNotificationReceivedListener } from '../utils/notifications';
import * as Notifications from 'expo-notifications';

// Screens
import UserSummaryScreen from '../screens/UserSummaryScreen';
import FriendsScreen from '../screens/FriendsScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import SessionsScreen from '../screens/SessionsScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import CommunitiesScreen from '../screens/CommunitiesScreen';
import CommunityDetailScreen from '../screens/CommunityDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

interface MemberTabNavigatorProps {
  onSwitchRole: () => void;
  isSuperAdmin: boolean;
}

// Home Stack Navigator (User Summary + Announcements)
function HomeStack({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserSummary">
        {({ navigation }) => (
          <UserSummaryScreen
            onNavigateToAnnouncements={() => navigation.navigate('Announcements')}
            onOpenMenu={onOpenMenu}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Announcements">
        {({ navigation, route }: any) => (
          <AnnouncementsScreen
            onBack={() => {
              // If we came from a community detail page, go back to Communities tab
              if (route.params?.fromCommunityId) {
                const rootNavigation = navigation.getParent();
                if (rootNavigation) {
                  rootNavigation.navigate('Communities', {
                    screen: 'CommunityDetail',
                    params: { communityId: route.params.fromCommunityId }
                  });
                }
              } else {
                // Otherwise just go back normally
                navigation.goBack();
              }
            }}
            onNavigateToSessions={(communityId) => {
              // Navigate to MyBookings tab, then to Sessions screen with communityId
              const rootNavigation = navigation.getParent();
              if (rootNavigation) {
                rootNavigation.navigate('MyBookings', {
                  screen: 'Sessions',
                  params: { communityId }
                });
              }
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Bookings Stack Navigator (My Bookings + Sessions/Matches)
function BookingsStack({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyBookingsList">
        {({ navigation }) => (
          <MyBookingsScreen onBack={() => {}} onOpenMenu={onOpenMenu} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Sessions">
        {({ navigation, route }: any) => (
          <SessionsScreen
            onBack={() => {
              // If we came from a community detail page, go back to Communities tab
              if (route.params?.fromCommunityId) {
                const rootNavigation = navigation.getParent();
                if (rootNavigation) {
                  rootNavigation.navigate('Communities', {
                    screen: 'CommunityDetail',
                    params: { communityId: route.params.fromCommunityId }
                  });
                }
              } else {
                // Otherwise just go back normally
                navigation.goBack();
              }
            }}
            onOpenMenu={onOpenMenu}
            route={route}
            onNavigateToMyBookings={() => {
              // Navigate back to MyBookingsList
              navigation.navigate('MyBookingsList');
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Chat Stack Navigator (Chat List + Chat Detail)
function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </Stack.Navigator>
  );
}

// Communities Stack Navigator (Communities List + Community Detail)
function CommunitiesStack({ isSuperAdmin, onOpenMenu }: { isSuperAdmin: boolean; onOpenMenu: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunitiesList">
        {({ navigation }) => (
          <CommunitiesScreen
            onBack={() => {}}
            onCreateCommunity={undefined}
            isSuperAdmin={isSuperAdmin}
            onViewCommunity={(communityId) => navigation.navigate('CommunityDetail', { communityId })}
            onOpenMenu={onOpenMenu}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="CommunityDetail">
        {({ route, navigation }: any) => (
          <CommunityDetailScreen
            communityId={route.params.communityId}
            onBack={() => navigation.goBack()}
            showBackButton={true}
            onNavigateToSessions={() => {
              // Navigate to MyBookings tab, then to Sessions screen with communityId
              const rootNavigation = navigation.getParent();
              if (rootNavigation) {
                rootNavigation.navigate('MyBookings', {
                  screen: 'Sessions',
                  params: {
                    communityId: route.params.communityId,
                    fromCommunityId: route.params.communityId
                  }
                });
              }
            }}
            onNavigateToAnnouncements={() => {
              // Navigate to Home tab, then to Announcements screen with communityId
              const rootNavigation = navigation.getParent();
              if (rootNavigation) {
                rootNavigation.navigate('Home', {
                  screen: 'Announcements',
                  params: { fromCommunityId: route.params.communityId }
                });
              }
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function MemberTabNavigator({ onSwitchRole, isSuperAdmin }: MemberTabNavigatorProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLegalItems, setShowLegalItems] = useState(false);
  const { logout } = useAuth();
  const { showNotification, setNavigationHandler } = useInAppNotification();
  const navigationRef = useRef<any>(null);

  // Set up navigation handler for in-app notifications
  useEffect(() => {
    const handleNavigation = (data: any) => {
      if (!navigationRef.current || !data) {
        console.log('[MemberTabNavigator] Navigation ref not ready or no data');
        return;
      }

      console.log('[MemberTabNavigator] Handling navigation for notification data:', data);

      // Handle different notification types
      if (data.type === 'spot_available' || data.type === 'new_session') {
        console.log('[MemberTabNavigator] Navigating to session with auto-open booking modal:', data.sessionId);
        navigationRef.current.navigate('MyBookings', {
          screen: 'Sessions',
          params: {
            sessionId: data.sessionId,
            openBookingModal: true // Auto-open the booking modal
          }
        });
      } else if (data.type === 'refund_processed') {
        console.log('[MemberTabNavigator] Navigating to My Bookings');
        navigationRef.current.navigate('MyBookings', {
          screen: 'MyBookingsList'
        });
      } else if (data.type === 'friend_request') {
        console.log('[MemberTabNavigator] Navigating to Friends screen for friend request');
        navigationRef.current.navigate('Friends');
      }
    };

    setNavigationHandler(handleNavigation);
  }, [setNavigationHandler]);

  // Handle foreground notifications (show in-app banner)
  useEffect(() => {
    console.log('[MemberTabNavigator] Setting up foreground notification listener');

    const subscription = addNotificationReceivedListener((notification) => {
      console.log('[MemberTabNavigator] Foreground notification received:', notification);

      const { title, body, data } = notification.request.content;

      // Show custom in-app notification
      showNotification({
        title: title || 'Notification',
        body: body || '',
        data: data || {},
      });
    });

    return () => {
      console.log('[MemberTabNavigator] Cleaning up foreground notification listener');
      subscription.remove();
    };
  }, [showNotification]);

  // Handle notification taps (background/killed app state)
  useEffect(() => {
    console.log('[MemberTabNavigator] Setting up notification response listener');

    const subscription = addNotificationResponseListener((response) => {
      console.log('[MemberTabNavigator] Notification tapped:', response);

      const data = response.notification.request.content.data;
      console.log('[MemberTabNavigator] Notification data:', data);

      if (!navigationRef.current) {
        console.log('[MemberTabNavigator] Navigation ref not ready yet');
        return;
      }

      // Handle different notification types
      if (data.type === 'spot_available' || data.type === 'new_session') {
        // Navigate to Sessions screen and auto-open booking modal
        console.log('[MemberTabNavigator] Navigating to session with auto-open booking modal:', data.sessionId);
        navigationRef.current.navigate('MyBookings', {
          screen: 'Sessions',
          params: {
            sessionId: data.sessionId,
            openBookingModal: true // Auto-open the booking modal
          }
        });
      } else if (data.type === 'refund_processed') {
        // Navigate to My Bookings screen
        console.log('[MemberTabNavigator] Navigating to My Bookings');
        navigationRef.current.navigate('MyBookings', {
          screen: 'MyBookingsList'
        });
      } else if (data.type === 'friend_request') {
        // Navigate to Friends screen to accept/reject request
        console.log('[MemberTabNavigator] Navigating to Friends screen for friend request');
        navigationRef.current.navigate('Friends');
      }
    });

    return () => {
      console.log('[MemberTabNavigator] Cleaning up notification response listener');
      subscription.remove();
    };
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'This will permanently delete your PIN, biometric settings, and cached login data. You will need to enter your password on next login.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setShowMenu(false);
            await clearSecuritySettings();
            await AsyncStorage.removeItem('user');
            await logout();
          },
        },
      ]
    );
  };

  const handleLegalItem = (title: string, content: string) => {
    setShowMenu(false);
    // TODO: Add actual URLs or open webview with legal documents
    Alert.alert(title, content);
  };

  const handleSupport = () => {
    setShowMenu(false);
    // TODO: Add actual support email or contact form
    Alert.alert(
      'Support',
      'Need help? Contact us at support@padelapp.com',
      [
        { text: 'OK' },
        {
          text: 'Email Support',
          onPress: () => {
            Linking.openURL('mailto:support@padelapp.com');
          },
        },
      ]
    );
  };

  const BurgerMenu = () => (
    <TouchableOpacity
      style={styles.burgerButton}
      onPress={() => setShowMenu(true)}
    >
      <Ionicons name="menu" size={24} color="#000000" />
    </TouchableOpacity>
  );

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: Colors.backgroundElevated,
              ...Shadows.md,
            },
            headerTitleStyle: {
              ...TextStyles.title2,
              fontWeight: '600',
            },
            headerRight: () => <BurgerMenu />,
            tabBarStyle: {
              backgroundColor: Colors.backgroundElevated,
              borderTopWidth: 0,
              ...Shadows.lg,
              height: 85,
              paddingBottom: 25,
              paddingTop: 10,
            },
            tabBarActiveTintColor: Colors.brand,
            tabBarInactiveTintColor: Colors.secondary,
            tabBarLabelStyle: {
              ...TextStyles.caption1,
              fontWeight: '600',
              marginTop: 4,
            },
            tabBarIconStyle: {
              marginTop: 4,
            },
          }}
        >
          <Tab.Screen
            name="Home"
            options={{
              headerShown: false,  // Hide the Home header
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                // Reset the Home stack to UserSummary when tab is pressed
                navigation.navigate('Home', { screen: 'UserSummary' });
              },
            })}
          >
            {() => <HomeStack onOpenMenu={() => setShowMenu(true)} />}
          </Tab.Screen>

          <Tab.Screen
            name="MyBookings"
            options={{
              headerShown: false,  // Hide the header
              tabBarLabel: 'My Bookings',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar" size={size} color={color} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                // Prevent default behavior
                e.preventDefault();
                // Always navigate to MyBookingsList when tab is pressed
                navigation.navigate('MyBookings', {
                  screen: 'MyBookingsList',
                  initial: false
                });
              },
            })}
          >
            {() => <BookingsStack onOpenMenu={() => setShowMenu(true)} />}
          </Tab.Screen>

          <Tab.Screen
            name="Friends"
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="people-outline" size={size} color={color} />
              ),
            }}
          >
            {() => <FriendsScreen onBack={() => {}} />}
          </Tab.Screen>

          <Tab.Screen
            name="Chat"
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="chatbubbles-outline" size={size} color={color} />
              ),
            }}
            component={ChatStack}
          />

          <Tab.Screen
            name="Communities"
            options={{
              headerShown: false,  // Hide the header
              tabBarIcon: ({ color, size}) => (
                <Ionicons name="people" size={size} color={color} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                // Always navigate to CommunitiesList when tab is pressed
                navigation.navigate('Communities', { screen: 'CommunitiesList' });
              },
            })}
          >
            {() => <CommunitiesStack isSuperAdmin={isSuperAdmin} onOpenMenu={() => setShowMenu(true)} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {/* Burger Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            {/* Profile */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowProfile(true);
              }}
            >
              <Ionicons name="person-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            {/* Settings */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowSettings(true);
              }}
            >
              <Ionicons name="settings-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            {/* Switch Role */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onSwitchRole();
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>Switch Role</Text>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            {/* Support */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSupport}
            >
              <Ionicons name="help-circle-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>Support</Text>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            {/* Legal Section Header - Clickable */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowLegalItems(!showLegalItems)}
            >
              <Text style={styles.menuItemText}>Legal</Text>
              <Ionicons
                name={showLegalItems ? "chevron-up" : "chevron-down"}
                size={20}
                color="#000000"
              />
            </TouchableOpacity>

            {/* Legal Items - Show only when expanded */}
            {showLegalItems && (
              <>
                {/* Privacy Policy */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleLegalItem('Privacy Policy', 'Privacy policy will be available soon.')}
                >
                  <Ionicons name="shield-checkmark-outline" size={22} color={Colors.secondary} />
                  <Text style={[styles.menuItemText, styles.menuSubItemText]}>Privacy Policy</Text>
                </TouchableOpacity>

                {/* Terms of Use */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleLegalItem('Terms of Use', 'Terms of use will be available soon.')}
                >
                  <Ionicons name="document-text-outline" size={22} color={Colors.secondary} />
                  <Text style={[styles.menuItemText, styles.menuSubItemText]}>Terms of Use</Text>
                </TouchableOpacity>

                {/* Cookies Policy */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleLegalItem('Cookies Policy', 'Cookies policy will be available soon.')}
                >
                  <Ionicons name="nutrition-outline" size={22} color={Colors.secondary} />
                  <Text style={[styles.menuItemText, styles.menuSubItemText]}>Cookies Policy</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.menuSeparator} />

            {/* Sign Out (Clear All Data) */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color={Colors.red} />
              <Text style={[styles.menuItemText, { color: Colors.red }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Screen Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ProfileScreen onBack={() => setShowProfile(false)} />
      </Modal>

      {/* Settings Screen Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SettingsScreen onBack={() => setShowSettings(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  burgerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: 60,
    marginRight: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minWidth: 200,
    ...Shadows.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  menuItemText: {
    ...TextStyles.body,
    color: '#000000',
  },
  menuSeparator: {
    height: 0.5,
    backgroundColor: Colors.separator,
    marginHorizontal: Spacing.md,
  },
  menuSectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundTertiary,
  },
  menuSectionHeaderText: {
    ...TextStyles.caption1,
    color: Colors.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuSubItemText: {
    ...TextStyles.callout,
    color: Colors.secondary,
  },
});
