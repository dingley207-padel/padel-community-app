import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { savePin, setPinEnabled, checkBiometricSupport, setBiometricEnabled } from '../utils/security';

interface PinSetupScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function PinSetupScreen({ onComplete, onSkip }: PinSetupScreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handlePinPress = (digit: string) => {
    if (isConfirming) {
      if (confirmPin.length < 4) {
        const newConfirmPin = confirmPin + digit;
        setConfirmPin(newConfirmPin);

        if (newConfirmPin.length === 4) {
          verifyPin(newConfirmPin);
        }
      }
    } else {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);

        if (newPin.length === 4) {
          setIsConfirming(true);
        }
      }
    }
  };

  const handleDelete = () => {
    if (isConfirming) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const verifyPin = async (confirmedPin: string) => {
    if (pin === confirmedPin) {
      try {
        await savePin(pin);
        await setPinEnabled(true);

        // Check if biometric is available and offer to enable it
        const biometric = await checkBiometricSupport();
        if (biometric.isSupported) {
          Alert.alert(
            'Enable Biometric Login?',
            `Would you like to use ${biometric.type === 'facial' ? 'Face ID' : 'fingerprint'} for quick login?`,
            [
              {
                text: 'No Thanks',
                style: 'cancel',
                onPress: onComplete,
              },
              {
                text: 'Enable',
                onPress: async () => {
                  await setBiometricEnabled(true);
                  Alert.alert('Success', 'Biometric login enabled!');
                  onComplete();
                },
              },
            ]
          );
        } else {
          Alert.alert('Success', 'PIN set successfully!');
          onComplete();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to save PIN');
        resetPin();
      }
    } else {
      Alert.alert('Error', 'PINs do not match. Please try again.');
      resetPin();
    }
  };

  const resetPin = () => {
    setPin('');
    setConfirmPin('');
    setIsConfirming(false);
  };

  const renderPinDots = () => {
    const currentPin = isConfirming ? confirmPin : pin;
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < currentPin.length && styles.dotFilled,
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
      ['', '0', 'del'],
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.key} />;
              }

              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={handleDelete}
                  >
                    <Text style={styles.keyTextSpecial}>⌫</Text>
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
    <LinearGradient colors={['#00D4AA', '#B4FF39']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isConfirming ? 'Confirm PIN' : 'Set up PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {isConfirming
              ? 'Enter your PIN again to confirm'
              : 'Create a 4-digit PIN for quick login'}
          </Text>
        </View>

        {renderPinDots()}
        {renderKeypad()}

        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 40,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: 'white',
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
  },
  keyTextSpecial: {
    fontSize: 28,
    color: 'white',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
