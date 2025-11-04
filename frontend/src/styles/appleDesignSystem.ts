/**
 * Padel App Design System - Dark Mode with Neon Accents
 * Bold, modern design with black backgrounds and vibrant neon green
 */

export const Colors = {
  // Dark backgrounds - Deep black
  background: '#000000',  // Pure black
  backgroundElevated: '#1A1A1A',  // Dark gray for cards
  backgroundSecondary: '#0A0A0A',  // Slightly lighter black

  // Glass/Card surfaces - dark with slight transparency
  glass: 'rgba(26, 26, 26, 0.9)',  // Dark glass
  glassDark: 'rgba(26, 26, 26, 0.7)',  // More transparent
  glassHighlight: 'rgba(40, 40, 40, 0.95)',  // Lighter glass

  // Padel Brand - Neon Green (signature color)
  brand: '#8FFE09',  // Electric Padel Green
  brandLight: '#A8FF3A',  // Lighter neon green
  brandDark: '#6FD300',  // Darker green for depth
  brandGlow: 'rgba(143, 254, 9, 0.5)',  // Strong green glow

  // Text Colors - White for contrast
  textPrimary: '#FFFFFF',  // Pure white
  textSecondary: '#B0B0B0',  // Light gray
  textTertiary: '#808080',  // Medium gray
  textOnBrand: '#0D1B2A',  // Dark text on neon green

  // Accents for variety
  accent1: '#FFB84D',  // Warm orange
  accent2: '#A8DAFF',  // Soft blue
  accent3: '#FF6B9D',  // Soft pink

  // Semantic colors
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',

  // UI elements
  separator: 'rgba(255, 255, 255, 0.1)',
  separatorLight: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // iOS Standard colors
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  purple: '#AF52DE',
  pink: '#FF2D55',
};

export const Gradients = {
  // Padel brand gradients
  brand: {
    colors: ['#8FFE09', '#6FD300'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  brandSubtle: {
    colors: ['rgba(143, 254, 9, 0.2)', 'rgba(111, 211, 0, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Dark background gradients
  background: {
    colors: ['#000000', '#0A0A0A'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  // Dark glass shimmer
  glass: {
    colors: ['rgba(40, 40, 40, 0.8)', 'rgba(26, 26, 26, 0.6)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  size: {
    largeTitle: 34,
    title1: 28,
    title2: 22,
    title3: 20,
    headline: 17,
    body: 17,
    callout: 16,
    subheadline: 15,
    footnote: 13,
    caption1: 12,
    caption2: 11,
  },

  weight: {
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
    heavy: '800' as '800',
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,  // Very rounded - Lumy style
  full: 9999,
};

export const Shadows = {
  // Stronger shadows for dark mode
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 5,
  },
  // Strong green glow for brand elements
  brandGlow: {
    shadowColor: '#8FFE09',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 6,
  },
  // Glass effect for dark mode
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 1,
  },
};

export const Animations = {
  fast: 200,
  normal: 300,
  slow: 400,
  verySlow: 600,
};

export const Layout = {
  minTouchTarget: 44,
  buttonHeight: 56,
  inputHeight: 56,
  headerHeight: 96,
  maxContentWidth: 1200,
};

// Premium component styles
export const ComponentStyles = {
  // Dark glass card
  glassCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    ...Shadows.glass,
    borderWidth: 1,
    borderColor: Colors.separatorLight,
  },

  // Elevated card
  elevatedCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },

  // Brand button - vibrant neon green
  brandButton: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    backgroundColor: Colors.brand,
    ...Shadows.brandGlow,
  },

  // Ghost button
  ghostButton: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.brand,
  },

  // Input with dark glass
  input: {
    height: Layout.inputHeight,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.separator,
    fontSize: Typography.size.body,
    color: Colors.textPrimary,
  },
};

// Text styles with white text
export const TextStyles = {
  largeTitle: {
    fontSize: Typography.size.largeTitle,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.largeTitle * Typography.lineHeight.tight,
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: Typography.size.title1,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.title1 * Typography.lineHeight.tight,
    letterSpacing: -0.3,
  },
  title2: {
    fontSize: Typography.size.title2,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.title2 * Typography.lineHeight.tight,
  },
  title3: {
    fontSize: Typography.size.title3,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.title3 * Typography.lineHeight.normal,
  },
  headline: {
    fontSize: Typography.size.headline,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.headline * Typography.lineHeight.normal,
  },
  body: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.regular,
    color: Colors.textPrimary,
    lineHeight: Typography.size.body * Typography.lineHeight.normal,
  },
  bodyBold: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.body * Typography.lineHeight.normal,
  },
  callout: {
    fontSize: Typography.size.callout,
    fontWeight: Typography.weight.regular,
    color: Colors.textPrimary,
    lineHeight: Typography.size.callout * Typography.lineHeight.normal,
  },
  subheadline: {
    fontSize: Typography.size.subheadline,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.size.subheadline * Typography.lineHeight.normal,
  },
  footnote: {
    fontSize: Typography.size.footnote,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.size.footnote * Typography.lineHeight.normal,
  },
  caption: {
    fontSize: Typography.size.caption1,
    fontWeight: Typography.weight.regular,
    color: Colors.textTertiary,
    lineHeight: Typography.size.caption1 * Typography.lineHeight.normal,
  },

  // Special text styles
  brandText: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.semibold,
    color: Colors.brand,
  },
  brandTextLarge: {
    fontSize: Typography.size.title3,
    fontWeight: Typography.weight.bold,
    color: Colors.brand,
  },
};

// Button text styles
export const ButtonTextStyles = {
  primary: {
    fontSize: Typography.size.callout,
    fontWeight: Typography.weight.semibold,
    color: Colors.textOnBrand,
    letterSpacing: 0.5,
  },
  secondary: {
    fontSize: Typography.size.callout,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  ghost: {
    fontSize: Typography.size.callout,
    fontWeight: Typography.weight.semibold,
    color: Colors.brand,
  },
};
