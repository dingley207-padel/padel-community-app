import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SplashScreenProps {
  onFinish: (step: 'register' | 'login') => void;
  onShowAuth?: (step: 'register' | 'login') => void;
}

export default function SplashScreen({ onFinish, onShowAuth }: SplashScreenProps) {
  const [stage, setStage] = useState<'green' | 'logo' | 'complete'>('green');

  // Text animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;

  // Ball animations
  const ballY = useRef(new Animated.Value(-300)).current;
  const ballRotate = useRef(new Animated.Value(0)).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;

  // Join text and buttons animations
  const joinTextOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stage 1: Just green screen for 0.5 seconds
    const stage1Timer = setTimeout(() => {
      setStage('logo');

      // Stage 2: Show text first, then ball bounces in - 2.5 seconds total
      Animated.parallel([
        // Text appears immediately when logo stage starts
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Ball bouncing animation with multiple big bounces
        Animated.sequence([
          // Small delay so text appears first
          Animated.delay(100),
          // Make ball visible
          Animated.timing(ballOpacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          // First big drop from top
          Animated.timing(ballY, {
            toValue: 0,
            duration: 600,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          // Big bounce back up
          Animated.timing(ballY, {
            toValue: -100,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Second bounce down
          Animated.timing(ballY, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          // Medium bounce up
          Animated.timing(ballY, {
            toValue: -50,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Third bounce down
          Animated.timing(ballY, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          // Small bounce up
          Animated.timing(ballY, {
            toValue: -20,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Final settle
          Animated.timing(ballY, {
            toValue: 0,
            duration: 120,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Ball rotation while bouncing (4 full spins during the entire sequence)
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(ballRotate, {
            toValue: 4,
            duration: 1840,
            useNativeDriver: true,
          }),
        ]),
        // After ball finishes bouncing (~1940ms), fade in "JOIN THE COMMUNITY" and buttons
        Animated.sequence([
          Animated.delay(2000),
          Animated.parallel([
            Animated.timing(joinTextOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(buttonsOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();

      // Don't auto-transition anymore - stay on splash with buttons visible
      return () => {};

      return () => clearTimeout(stage2Timer);
    }, 500);

    return () => clearTimeout(stage1Timer);
  }, [onFinish, onShowAuth]);

  const spin = ballRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {stage !== 'green' && (
        <>
          <View style={styles.logoContainer}>
            {/* Padel text */}
            <Animated.View
              style={[
                styles.textContainer,
                {
                  opacity: textOpacity,
                  transform: [{ scale: textScale }],
                },
              ]}
            >
              <View style={styles.appNameRow}>
                <Text style={styles.logoText}>Padel </Text>

                {/* Bouncing ball */}
                <Animated.View
                  style={{
                    opacity: ballOpacity,
                    transform: [
                      { translateY: ballY },
                      { rotate: spin },
                    ],
                  }}
                >
                  <Ionicons name="tennisball" size={64} color="#000000" />
                </Animated.View>

                <Text style={styles.logoText}>NE</Text>
              </View>
            </Animated.View>

            {/* JOIN THE COMMUNITY text */}
            <Animated.Text
              style={[
                styles.joinText,
                { opacity: joinTextOpacity }
              ]}
            >
              JOIN THE COMMUNITY
            </Animated.Text>
          </View>

          {/* Login buttons */}
          <Animated.View
            style={[
              styles.buttonsContainer,
              { opacity: buttonsOpacity }
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => onFinish('register')}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => onFinish('login')}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8FFE09',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  textContainer: {
    alignItems: 'center',
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  joinText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 40,
    letterSpacing: 1,
  },
  buttonsContainer: {
    width: '80%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#8FFE09',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});
