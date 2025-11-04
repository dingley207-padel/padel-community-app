import React, { useState } from 'react';
import { View } from 'react-native';

// Import screens (we'll create these)
import AuthScreen from '../screens/AuthScreen';
import SessionsScreen from '../screens/SessionsScreen';

export type Screen = 'auth' | 'sessions';

export interface NavigationProps {
  navigate: (screen: Screen) => void;
}

export default function SimpleNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  return (
    <View className="flex-1">
      {currentScreen === 'auth' && <AuthScreen navigate={navigate} />}
      {currentScreen === 'sessions' && <SessionsScreen navigate={navigate} />}
    </View>
  );
}
