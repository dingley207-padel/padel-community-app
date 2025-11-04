import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  verifyPin,
  authenticateWithBiometric,
  checkBiometricSupport,
  isBiometricEnabled,
  BiometricType,
} from '../utils/security';
import { Colors, Spacing, BorderRadius } from '../styles/appleDesignSystem';

interface QuickLoginScreenProps {
  onSuccess: () => void;
  onUsePassword: () => void;
  userName?: string;
}

export default function QuickLoginScreen({
  onSuccess,
  onUsePassword,
  userName,
}: QuickLoginScreenProps) {
  const [pin, setPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(null);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    console.log('[QuickLoginScreen] Screen mounted');
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    try {
      const biometricEnabled = await isBiometricEnabled();
      const biometric = await checkBiometricSupport();

      console.log('[QuickLoginScreen] Biometric enabled:', biometricEnabled);
      console.log('[QuickLoginScreen] Biometric supported:', biometric.isSupported);
      console.log('[QuickLoginScreen] Biometric type:', biometric.type);

      if (biometricEnabled && biometric.isSupported) {
        setBiometricAvailable(true);
        setBiometricType(biometric.type);
        console.log('[QuickLoginScreen] Biometric available - showing button');

        // Automatically trigger biometric authentication on mount
        console.log('[QuickLoginScreen] Auto-triggering biometric authentication');
        setTimeout(() => {
          handleBiometricAuth();
        }, 500); // Small delay to let the screen render first
      } else {
        console.log('[QuickLoginScreen] Biometric not available');
      }
    } catch (error) {
      console.error('[QuickLoginScreen] Error checking biometric:', error);
    }
  };

  const handleBiometricAuth = async () => {
    const success = await authenticateWithBiometric();
    if (success) {
      onSuccess();
    }
  };

  const handlePinPress = async (digit: string) => {
    const newPin = pin + digit;
    setPin(newPin);
    console.log('[QuickLoginScreen] PIN entered, length:', newPin.length);

    if (newPin.length === 4) {
      console.log('[QuickLoginScreen] Verifying 4-digit PIN');
      const isValid = await verifyPin(newPin);
      console.log('[QuickLoginScreen] PIN valid:', isValid);

      if (isValid) {
        console.log('[QuickLoginScreen] PIN correct, calling onSuccess');
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          Alert.alert(
            'Too Many Attempts',
            'Please use your password to login.',
            [{ text: 'OK', onPress: onUsePassword }]
          );
        } else {
          Alert.alert('Incorrect PIN', `${MAX_ATTEMPTS - newAttempts} attempts remaining`);
        }

        setPin('');
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const renderPinDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < pin.length && styles.dotFilled,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      [biometricAvailable ? 'bio' : '', '0', 'del'],
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.key} />;
              }

              if (key === 'bio') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={handleBiometricAuth}
                  >
                    <Text style={styles.keyTextSpecial}>
                      {biometricType === 'facial' ? '👤' : '👆'}
                    </Text>
                  </TouchableOpacity>
                );
              }

              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={handleDelete}
                  >
                    <Ionicons name="backspace-outline" size={28} color="#000000" />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.key}
                  onPress={() => handlePinPress(key)}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Green Header with Padel ONE Branding */}
      <View style={styles.header}>
        <View style={styles.appNameRow}>
          {/* Padel text - black */}
          <Text style={styles.appName}>Padel </Text>

          {/* Tennis ball replacing 'O' - black */}
          <Ionicons name="tennisball" size={40} color="#000000" style={styles.ballIcon} />

          {/* NE text - black */}
          <Text style={styles.appName}>NE</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Welcome Back</Text>
          {userName && (
            <Text style={styles.userName}>{userName}</Text>
          )}
          <Text style={styles.subtitle}>Enter your PIN to continue</Text>
        </View>

        {renderPinDots()}
        {renderKeypad()}

        <TouchableOpacity style={styles.usePasswordButton} onPress={onUsePassword}>
          <Text style={styles.usePasswordText}>Use Password Instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    backgroundColor: '#8FFE09',
    alignItems: 'center',
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  ballIcon: {
    marginHorizontal: 2,
    marginBottom: -2,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    marginBottom: Spacing.sm,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: Spacing.xxl,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8FFE09',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#8FFE09',
  },
  keypad: {
    gap: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
  },
  keyTextSpecial: {
    fontSize: 28,
  },
  usePasswordButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  usePasswordText: {
    fontSize: 16,
    color: '#8FFE09',
    fontWeight: '700',
  },
});
