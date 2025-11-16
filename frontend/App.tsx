import React, { useState, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { InAppNotificationProvider } from './src/contexts/InAppNotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import InAppNotificationDisplay from './src/components/InAppNotificationDisplay';
import './global.css';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SNG6W32VHBL4G3NlNXbZInGS45jJ2S35cj41DyZYyZ2JFPqF1RzQa6N3chijnvMTHRUkSbdLoE2pTDijiOQhJk100mv5z0KGu';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [initialAuthStep, setInitialAuthStep] = useState<'register' | 'login'>('register');
  const authOpacity = useRef(new Animated.Value(0)).current;

  const handleShowAuth = (step: 'register' | 'login') => {
    setInitialAuthStep(step);
    setShowAuth(true);
    Animated.timing(authOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // After auth is fully visible, hide splash
      setTimeout(() => setShowSplash(false), 100);
    });
  };

  if (!showSplash && !showAuth) {
    return (
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.lovethepadel">
        <InAppNotificationProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <View style={{ flex: 1 }}>
              <AppNavigator />
              <InAppNotificationDisplay />
            </View>
          </AuthProvider>
        </InAppNotificationProvider>
      </StripeProvider>
    );
  }

  return (
    <>
      {showSplash && (
        <SplashScreen
          onFinish={handleShowAuth}
          onShowAuth={handleShowAuth}
        />
      )}
      {showAuth && (
        <Animated.View style={[styles.authOverlay, { opacity: authOpacity }]}>
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.lovethepadel">
            <InAppNotificationProvider>
              <AuthProvider>
                <StatusBar style="light" />
                <View style={{ flex: 1 }}>
                  <AppNavigator initialAuthStep={initialAuthStep} />
                  <InAppNotificationDisplay />
                </View>
              </AuthProvider>
            </InAppNotificationProvider>
          </StripeProvider>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  authOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
