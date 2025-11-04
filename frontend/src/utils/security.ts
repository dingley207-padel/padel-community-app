import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'user_pin';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const PIN_ENABLED_KEY = 'pin_enabled';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | null;

// Check if device supports biometric authentication
export const checkBiometricSupport = async (): Promise<{
  isSupported: boolean;
  type: BiometricType;
}> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return { isSupported: false, type: null };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      return { isSupported: false, type: null };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let type: BiometricType = null;
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      type = 'facial';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      type = 'fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      type = 'iris';
    }

    return { isSupported: true, type };
  } catch (error) {
    console.error('Biometric check error:', error);
    return { isSupported: false, type: null };
  }
};

// Authenticate with biometrics
export const authenticateWithBiometric = async (): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your account',
    });

    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

// Save PIN securely
export const savePin = async (pin: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  } catch (error) {
    console.error('Error saving PIN:', error);
    throw new Error('Failed to save PIN');
  }
};

// Verify PIN
export const verifyPin = async (pin: string): Promise<boolean> => {
  try {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    return storedPin === pin;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
};

// Check if PIN is set
export const isPinSet = async (): Promise<boolean> => {
  try {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    console.log('[Security] isPinSet check:', pin !== null, 'PIN value exists:', !!pin);
    return pin !== null;
  } catch (error) {
    console.error('Error checking PIN:', error);
    return false;
  }
};

// Remove PIN
export const removePin = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(PIN_KEY);
  } catch (error) {
    console.error('Error removing PIN:', error);
  }
};

// Enable/disable biometric authentication
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting biometric preference:', error);
  }
};

export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric preference:', error);
    return false;
  }
};

// Enable/disable PIN authentication
export const setPinEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await SecureStore.setItemAsync(PIN_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting PIN preference:', error);
  }
};

export const isPinEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(PIN_ENABLED_KEY);
    console.log('[Security] isPinEnabled check:', enabled);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking PIN preference:', error);
    return false;
  }
};

// Clear all security settings
export const clearSecuritySettings = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(PIN_ENABLED_KEY);
  } catch (error) {
    console.error('Error clearing security settings:', error);
  }
};
