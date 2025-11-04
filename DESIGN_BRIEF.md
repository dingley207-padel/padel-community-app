# 🎾 Padel Community iOS App — Design Brief

## Overview
This document defines the visual design system for the **Padel Community App**, an iOS-first application that allows users to book padel sessions, join communities, and manage memberships.

The goal is to achieve an **Apple-style, modern, and premium look** that works seamlessly in both **Dark Mode** and **Light Mode**.

---

## 🎨 Color System

### Brand Accent
- **Padel Green**: `#8FFE09`
  Used for primary actions, highlights, icons, and status indicators.

### Dark Mode Palette
| Role | Hex | Usage |
|------|-----|--------|
| **Primary Background** | `#0D1B2A` | App background |
| **Surface** | `#1B263B` | Cards, modals |
| **Text Primary** | `#FFFFFF` | Main text |
| **Text Secondary** | `#AAB6C4` | Subtext |
| **Divider/Border** | `#23344D` | Thin separators |
| **Accent** | `#8FFE09` | Buttons, links, highlights |

### Light Mode Palette
| Role | Hex | Usage |
|------|-----|--------|
| **Primary Background** | `#FFFFFF` | App background |
| **Surface** | `#F5F7FA` | Cards, modals |
| **Text Primary** | `#0D1B2A` | Main text |
| **Text Secondary** | `#7A8799` | Subtext |
| **Divider/Border** | `#E4E7EB` | Thin separators |
| **Accent** | `#8FFE09` | Buttons, links, highlights |

---

## 🌗 Color Tokens (for implementation)

```ts
// design/tokens/colors.ts

export const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F7FA',
    textPrimary: '#0D1B2A',
    textSecondary: '#7A8799',
    divider: '#E4E7EB',
    accent: '#8FFE09',
  },
  dark: {
    background: '#0D1B2A',
    surface: '#1B263B',
    textPrimary: '#FFFFFF',
    textSecondary: '#AAB6C4',
    divider: '#23344D',
    accent: '#8FFE09',
  },
};
```

---

## 🔠 Typography

Use Apple's system font family:
- **Font:** SF Pro (SF Pro Display / SF Pro Text)
- **Line height & spacing:** follow iOS HIG standards (1.4× body size)

| Role | Weight | Size | Example |
|------|---------|------|---------|
| Title | Bold | 28 pt | "Join a Session" |
| Subtitle | Semibold | 22 pt | "Upcoming Games" |
| Body | Regular | 16 pt | "2 spots left · Dubai Marina" |
| Caption | Regular | 13 pt | "Today 7:30 PM" |
| Button | Semibold | 16 pt | "Join Now" |

---

## 🔘 Buttons

### Primary Button
- **Background:** `#8FFE09`
- **Text:** Dark Blue (`#0D1B2A`)
- **Radius:** 12 pt
- **Padding:** 16 pt × 12 pt
- **Pressed:** accent darkened 10 %
- **Disabled:** opacity 40 %

### Secondary Button
- **Background:** Transparent
- **Border:** 1 pt accent
- **Text:** accent
- **Radius:** 12 pt

---

## 🧭 Navigation

- **Tab Bar:**
  - Active icon → accent green
  - Inactive icon → textSecondary
  - Background → surface

- **Top Bar (Header):**
  - Transparent blur (Apple default)
  - Title centered bold
  - Back/Profile icons use accent color in dark mode

---

## 🧱 Layout & Spacing
- **Grid:** 8 pt system
- **Container padding:** 16 pt
- **Card radius:** 16 pt
- **Modal radius:** 24 pt
- **Elevation/Shadow:**
  - Light mode: rgba(0, 0, 0, 0.05)
  - Dark mode: rgba(143, 254, 9, 0.15) (soft glow)

---

## 🪄 Components Summary

### Card
```jsx
<Card>
  <Title>Social Padel - Level B+</Title>
  <Subtitle>Dubai Marina • 7 PM</Subtitle>
  <Tag>2 spots left</Tag>
  <Button>Join Now</Button>
</Card>
```
- Surface background
- Rounded 16 pt
- Accent button

### Profile Chip
- Circle avatar + player name + skill badge (A / B / C / D)
- Badge colors can follow intensity gradient (green → orange → red)

### Session List
- Scrollable cards with availability indicator bar (accent green for remaining slots)

---

## 🌗 Theme Switching

Use React Native Appearance API or Expo System UI Mode:

```ts
import { Appearance } from 'react-native';
import { colors } from './design/tokens/colors';

const theme = Appearance.getColorScheme() === 'dark' ? colors.dark : colors.light;
```

Apply to styled components / ThemeProvider globally.

---

## 🖼️ Imagery

- Use **padel court photography** for banners & headers.
- Apply subtle dark overlay (`rgba(0, 0, 0, 0.25)`) for text readability.
- Empty states: vector illustrations with Padel Green accents on white or navy background.
- Keep imagery dynamic, social, and energetic — reflect real community energy.

---

## 🧩 Iconography

Use **SF Symbols** (Apple) for consistency:
| Function | Symbol |
|-----------|---------|
| Home | house.fill |
| Sessions | calendar |
| Chat | bubble.right.fill |
| Players | person.2.fill |
| Profile | person.crop.circle |

Active icons → accent green
Inactive → textSecondary

---

## ⚙️ Implementation Notes

- All components must support **dark and light mode**.
- Follow **Apple Human Interface Guidelines** (HIG).
- Ensure **contrast ratio ≥ 4.5:1** for legibility.
- Use **React Native Paper** or **Expo** UI components for accessibility.
- Respect **iOS Safe Areas** and gestures.
- Use **0.25s ease-in-out** for transitions and button animations.

---

## 💬 Keywords for AI/Design Tools
> "iOS app, dark mode, light mode, Apple HIG style, sporty UI, neon accent #8FFE09, navy base, SF Pro font, Padel booking app, modern and premium aesthetic."

---

## ✅ Summary

A clean, professional sport community app with Apple-like visuals.
- Light mode → white base + neon accents
- Dark mode → navy base + neon accents
- Buttons → Apple rounded + accent green
- Typography → SF Pro hierarchy
- Components → Card, Session List, Profile Chip, Booking Flow

---
