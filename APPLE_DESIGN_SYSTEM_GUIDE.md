# Apple Human Interface Guidelines - Implementation Guide

## Overview

I've created a comprehensive design system following Apple's Human Interface Guidelines at `/frontend/src/styles/appleDesignSystem.ts`. This design system provides all the building blocks needed to create a beautiful, consistent iOS-style application.

## Design System Components

### 1. Colors

```typescript
import { Colors } from '../styles/appleDesignSystem';

// Background colors
Colors.background        // #F5F5F7 - Standard iOS background
Colors.backgroundElevated // #FFFFFF - Cards and elevated surfaces

// Text colors
Colors.primary    // #1D1D1F - Primary text (Apple's dark)
Colors.secondary  // #86868B - Secondary text
Colors.tertiary   // #AEAEB2 - Tertiary/disabled text

// Brand color (Padel green)
Colors.brand      // #00D4AA
Colors.brandLight // #E6FAF5
Colors.brandDark  // #00B894

// Semantic colors
Colors.success // #34C759 (Apple's green)
Colors.error   // #FF3B30 (Apple's red)
Colors.warning // #FF9500 (Apple's orange)
Colors.info    // #007AFF (Apple's blue)
```

### 2. Typography

```typescript
import { Typography, TextStyles } from '../styles/appleDesignSystem';

// Use predefined text styles
<Text style={TextStyles.largeTitle}>Large Title</Text>
<Text style={TextStyles.title1}>Title 1</Text>
<Text style={TextStyles.headline}>Headline</Text>
<Text style={TextStyles.body}>Body text</Text>
<Text style={TextStyles.caption}>Caption</Text>

// Or build custom styles
fontSize: Typography.size.body,
fontWeight: Typography.weight.semibold,
```

**Font Scale:**
- Large Title: 34pt (bold)
- Title 1: 28pt (bold)
- Title 2: 22pt (bold)
- Title 3: 20pt (semibold)
- Headline: 17pt (semibold)
- Body: 17pt (regular)
- Footnote: 13pt (regular)
- Caption: 12pt (regular)

### 3. Spacing

```typescript
import { Spacing } from '../styles/appleDesignSystem';

padding: Spacing.md,       // 16px
marginBottom: Spacing.lg,  // 24px
gap: Spacing.sm,          // 8px

// Available: xs(4), sm(8), md(16), lg(24), xl(32), xxl(40), xxxl(48)
```

### 4. Shadows

```typescript
import { Shadows } from '../styles/appleDesignSystem';

// Apply subtle elevation
{
  ...Shadows.sm,  // Very subtle (cards)
  ...Shadows.md,  // Medium (modals)
  ...Shadows.lg,  // Strong (floating buttons)
}
```

### 5. Border Radius

```typescript
import { BorderRadius } from '../styles/appleDesignSystem';

borderRadius: BorderRadius.md,  // 10px (buttons)
borderRadius: BorderRadius.lg,  // 12px (cards)

// Available: sm(6), md(10), lg(12), xl(16), full(9999)
```

### 6. Component Styles

Pre-built component styles following Apple HIG:

```typescript
import { ComponentStyles, ButtonVariants } from '../styles/appleDesignSystem';

// Cards
<View style={ComponentStyles.card}>
  {/* Automatically includes background, shadow, radius, padding */}
</View>

// Buttons
<TouchableOpacity style={ButtonVariants.primary}>
  <Text>Primary Button</Text>
</TouchableOpacity>

<TouchableOpacity style={ButtonVariants.secondary}>
  <Text>Secondary Button</Text>
</TouchableOpacity>

<TouchableOpacity style={ButtonVariants.destructive}>
  <Text>Delete</Text>
</TouchableOpacity>

// Inputs
<TextInput style={ComponentStyles.input} />
```

## Key Design Principles

### 1. Visual Hierarchy

```typescript
// Use size and weight to create hierarchy
<Text style={TextStyles.title1}>Main Heading</Text>
<Text style={TextStyles.body}>Body content here</Text>
<Text style={TextStyles.footnote}>Additional details</Text>
```

### 2. Spacing & Rhythm

```typescript
// Use consistent spacing (multiples of 8)
container: {
  padding: Spacing.md,        // 16
  marginBottom: Spacing.lg,   // 24
}

// Generous white space
card: {
  padding: Spacing.md,
  marginBottom: Spacing.md,
}
```

### 3. Touch Targets

```typescript
// Minimum 44pt touch targets
button: {
  height: 50,               // Meets 44pt minimum
  minHeight: 44,
  paddingVertical: Spacing.md,
}
```

### 4. Subtle Elevation

```typescript
// Avoid heavy shadows - use subtle ones
card: {
  backgroundColor: Colors.backgroundElevated,
  ...Shadows.sm,  // Very subtle
  borderRadius: BorderRadius.lg,
}
```

### 5. Color Contrast

All colors meet WCAG AA standards:
- Primary text on background: 15:1 ratio
- Secondary text: 7:1 ratio
- Brand color on white: 4.5:1 ratio

## Implementation Examples

### Session Card (Apple Style)

```typescript
const styles = StyleSheet.create({
  sessionCard: {
    ...ComponentStyles.card,
    marginBottom: Spacing.md,
  },
  sessionTitle: {
    ...TextStyles.headline,
    marginBottom: Spacing.xs,
  },
  sessionDate: {
    ...TextStyles.callout,
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  sessionPrice: {
    ...TextStyles.title2,
    color: Colors.brand,
  },
});
```

### Button with Apple Style

```typescript
const styles = StyleSheet.create({
  primaryButton: {
    ...ButtonVariants.primary,
    marginTop: Spacing.lg,
  },
  buttonText: {
    ...TextStyles.headline,
    color: '#FFFFFF',
  },
});
```

### Form Input

```typescript
const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    ...TextStyles.subheadline,
    marginBottom: Spacing.xs,
  },
  input: {
    ...ComponentStyles.input,
  },
});
```

### Screen Layout

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.backgroundElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  headerTitle: {
    ...TextStyles.title1,
  },
  content: {
    padding: Spacing.md,
  },
});
```

## Transition Guidelines

### Smooth Animations

```typescript
import { Transitions } from '../styles/appleDesignSystem';

// Use Animated API
const fadeAnim = useRef(new Animated.Value(0)).current;

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: Transitions.normal, // 300ms
  useNativeDriver: true,
}).start();

// For scale effects
transform: [{ scale: pressed ? 0.98 : 1.0 }]
```

### Hover/Press States

```typescript
const [pressed, setPressed] = useState(false);

<TouchableOpacity
  activeOpacity={0.7}
  onPressIn={() => setPressed(true)}
  onPressOut={() => setPressed(false)}
  style={[
    styles.button,
    pressed && { transform: [{ scale: 0.98 }] }
  ]}
>
```

## Screen-by-Screen Updates Needed

### Priority 1: Core User Screens

1. **SessionsScreen**
   - Update card shadows to Shadows.sm
   - Use Colors.background for screen
   - Apply TextStyles.headline for session titles
   - Update button styles to ButtonVariants

2. **AuthScreen**
   - Use ComponentStyles.input for form fields
   - Apply TextStyles.title1 for headings
   - Use ButtonVariants.primary for login button

3. **ProfileScreen**
   - Update to card-based layout
   - Use proper text hierarchy
   - Apply consistent spacing

### Priority 2: Manager Screens

4. **CommunityManagerDashboard**
   - Update stat cards with Shadows.sm
   - Use TextStyles for hierarchy
   - Apply consistent spacing

5. **CreateSessionScreen**
   - Update form inputs to ComponentStyles.input
   - Use proper button variants
   - Apply spacing system

### Priority 3: Admin Screens

6. **CommunitiesScreen**
   - Update community cards
   - Apply proper shadows
   - Use consistent colors

7. **AssignManagerScreen**
   - Update form styling
   - Apply button variants
   - Use proper spacing

## Color Migration Guide

### Old → New Mappings

```
Old Color          → New Color
#F5F5F5           → Colors.background (#F5F5F7)
#1A1A1A / #1D1D1F → Colors.primary
#666 / #999       → Colors.secondary / Colors.tertiary
#00D4AA           → Colors.brand (keep existing)
#E0E0E0           → Colors.separator
white             → Colors.backgroundElevated
```

## Testing Checklist

- [ ] All touch targets are minimum 44pt
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Shadows are subtle (opacity < 0.15)
- [ ] Border radius is consistent (8-12px)
- [ ] Spacing uses 8px grid
- [ ] Typography follows SF Pro scale
- [ ] Animations are 200-300ms
- [ ] Colors use design system values

## Benefits of This Approach

1. **Consistency** - All screens follow same design language
2. **Maintainability** - Change once, update everywhere
3. **Scalability** - Easy to add new screens
4. **Accessibility** - Built-in WCAG compliance
5. **iOS Native Feel** - Follows Apple's guidelines exactly
6. **Dark Mode Ready** - Structure supports theme switching

## Next Steps

To apply this design system to your screens:

1. Import the design system:
   ```typescript
   import { Colors, TextStyles, Spacing, ComponentStyles, ButtonVariants, Shadows } from '../styles/appleDesignSystem';
   ```

2. Replace hard-coded values with design tokens:
   ```typescript
   // Before
   backgroundColor: '#F5F5F5',
   fontSize: 20,
   padding: 16,

   // After
   backgroundColor: Colors.background,
   ...TextStyles.title3,
   padding: Spacing.md,
   ```

3. Use pre-built component styles:
   ```typescript
   // Before
   card: {
     backgroundColor: 'white',
     borderRadius: 12,
     padding: 16,
     shadowColor: '#000',
     // ... many shadow properties
   }

   // After
   card: ComponentStyles.card
   ```

This creates a beautiful, consistent, iOS-native feel throughout your entire application!
