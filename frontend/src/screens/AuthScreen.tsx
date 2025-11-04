import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Colors, TextStyles, Spacing, Shadows, BorderRadius } from '../styles/appleDesignSystem';

type AuthStep = 'choice' | 'register' | 'otp' | 'login' | 'forgotPassword' | 'resetPassword';

interface AuthScreenProps {
  initialStep?: 'register' | 'login';
}

export default function AuthScreen({ initialStep = 'choice' }: AuthScreenProps = {}) {
  const { login } = useAuth();
  const [step, setStep] = useState<AuthStep>(initialStep as AuthStep);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Registration fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Password reset fields
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // OTP verification
  const [otp, setOtp] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Pulse animation for logo
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleRegister = async () => {
    // Validation
    if (!email.trim() || !name.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await api.register({
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
      });

      // Send WhatsApp OTP
      await api.sendOTP(phone.trim(), 'whatsapp');

      Alert.alert('Success', 'Registration successful! Please verify your phone number.');
      setStep('otp');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.verifyRegistrationOTP(phone.trim(), otp.trim());

      // Log user in directly after OTP verification
      // Users can join communities later via the Community tab
      await login(response);
      Alert.alert('Success', 'Registration complete! Welcome to Padel ONE.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      Alert.alert('Error', 'Please enter your email/phone and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login(loginIdentifier.trim(), loginPassword.trim());
      await login(response);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetIdentifier.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.forgotPassword(resetIdentifier.trim());
      setResetPhone(response.phone || '');
      Alert.alert('Success', response.message);
      setStep('resetPassword');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim() || resetCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit reset code');
      return;
    }

    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      Alert.alert('Error', 'Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(resetPhone, resetCode.trim(), newPassword.trim());
      Alert.alert('Success', 'Password reset successful! You can now login with your new password.');
      setStep('login');
      // Clear reset fields
      setResetIdentifier('');
      setResetPhone('');
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderChoiceStep = () => (
    <>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setStep('register')}
      >
        <Text style={styles.primaryButtonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('login')}
      >
        <Text style={styles.secondaryButtonText}>Sign In</Text>
      </TouchableOpacity>
    </>
  );

  const renderRegisterStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.stepContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Fill in your details to get started</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number (+1234567890)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStep('choice')}>
          <Text style={styles.linkText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Verify Phone</Text>
      <Text style={styles.subtitle}>
        We sent a code via WhatsApp to {phone}
      </Text>

      <TextInput
        style={[styles.input, styles.otpInput]}
        placeholder="000000"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerifyOTP}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          try {
            await api.sendOTP(phone.trim(), 'whatsapp');
            Alert.alert('Success', 'OTP sent again');
          } catch (error) {
            Alert.alert('Error', 'Failed to resend OTP');
          }
        }}
      >
        <Text style={styles.linkText}>Resend OTP</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep('register')}>
        <Text style={styles.linkText}>Change phone number</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoginStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Phone Number"
        value={loginIdentifier}
        onChangeText={setLoginIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={loginPassword}
        onChangeText={setLoginPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep('forgotPassword')}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep('choice')}>
        <Text style={styles.linkText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderForgotPasswordStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email or phone to reset your password</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Phone Number"
        value={resetIdentifier}
        onChangeText={setResetIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleForgotPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep('login')}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResetPasswordStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.stepContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          We sent a code via WhatsApp to {resetPhone}
        </Text>

        <TextInput
          style={[styles.input, styles.otpInput]}
          placeholder="000000"
          value={resetCode}
          onChangeText={setResetCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TextInput
          style={styles.input}
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            try {
              await api.forgotPassword(resetIdentifier);
              Alert.alert('Success', 'Reset code sent again');
            } catch (error) {
              Alert.alert('Error', 'Failed to resend code');
            }
          }}
        >
          <Text style={styles.linkText}>Resend Code</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStep('login')}>
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            {/* Padel ONE Logo */}
            <View style={styles.logoContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.appNameRow}>
                  {/* Padel text - black */}
                  <Text style={styles.logoText}>Padel </Text>

                  {/* Tennis ball replacing 'O' - black */}
                  <Ionicons name="tennisball" size={48} color="#000000" style={styles.ballIcon} />

                  {/* NE text - black */}
                  <Text style={styles.logoText}>NE</Text>
                </View>
              </Animated.View>
              <Text style={styles.joinText}>JOIN THE COMMUNITY</Text>
            </View>

            {step === 'choice' && renderChoiceStep()}
            {step === 'register' && renderRegisterStep()}
            {step === 'otp' && renderOTPStep()}
            {step === 'login' && renderLoginStep()}
            {step === 'forgotPassword' && renderForgotPasswordStep()}
            {step === 'resetPassword' && renderResetPasswordStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8FFE09',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 90,
    paddingTop: 40,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  ballIcon: {
    marginLeft: 2,
    marginRight: -2,
  },
  joinText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 90,
    letterSpacing: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  stepContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#000000',
    padding: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
    color: '#000000',
  },
  otpInput: {
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#8FFE09',
    borderWidth: 2,
    borderColor: '#000000',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#8FFE09',
    borderWidth: 2,
    borderColor: '#000000',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#000000',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  secondaryButtonText: {
    color: '#8FFE09',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#000000',
    textAlign: 'center',
    marginTop: Spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
});
