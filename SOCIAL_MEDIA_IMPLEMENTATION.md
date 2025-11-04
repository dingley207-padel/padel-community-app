# Social Media Links Implementation Guide

## Overview
Adding social media links (X/Twitter, Instagram, TikTok, Facebook, YouTube) to community profiles with display on community detail page and edit functionality for community managers.

## Status: Backend Complete, Frontend Ready, Database Pending

---

## ✅ COMPLETED

### 1. Backend Type Updates
**File:** `/backend/src/types/index.ts`

Added to Community interface:
```typescript
twitter_url?: string;
instagram_url?: string;
tiktok_url?: string;
facebook_url?: string;
youtube_url?: string;
banner_image?: string;
member_count?: number;
```

### 2. Database Migration Created
**Files:**
- `/backend/migrations/add_community_social_media.sql`
- `/backend/add-social-columns.js` (checker script)

**SQL to run:**
```sql
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS banner_image TEXT;
```

---

## 🔄 NEXT STEPS

### Step 1: Run Database Migration
**Option A - Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy the SQL from `/backend/migrations/add_community_social_media.sql`
5. Execute

**Option B - Command Line:**
```bash
cd /Users/ross/Desktop/Padel/backend
node add-social-columns.js  # This will show you the SQL to run
```

### Step 2: Update Frontend CommunityDetailScreen
**File:** `/frontend/src/screens/CommunityDetailScreen.tsx`

Add to Community interface (line 16):
```typescript
interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  profile_image?: string;
  banner_image?: string;
  manager_id: string;
  member_count?: number;
  twitter_url?: string;      // ADD
  instagram_url?: string;    // ADD
  tiktok_url?: string;       // ADD
  facebook_url?: string;     // ADD
  youtube_url?: string;      // ADD
}
```

Add import for Linking:
```typescript
import { Linking } from 'react-native';
```

Add social media handler function (after loadCommunityDetails):
```typescript
const openSocialLink = (url?: string, platform: string) => {
  if (!url) return;

  // Add https:// if not present
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  Linking.canOpenURL(fullUrl).then(supported => {
    if (supported) {
      Linking.openURL(fullUrl);
    } else {
      Alert.alert('Error', `Cannot open ${platform} link`);
    }
  });
};
```

Add social media icons row (after the statsRow section, around line 155):
```typescript
{/* Social Media Links */}
{(community.twitter_url || community.instagram_url || community.tiktok_url ||
  community.facebook_url || community.youtube_url) && (
  <View style={styles.socialRow}>
    {community.twitter_url && (
      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => openSocialLink(community.twitter_url, 'X')}
      >
        <Ionicons name="logo-twitter" size={24} color={Colors.primary} />
      </TouchableOpacity>
    )}

    {community.instagram_url && (
      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => openSocialLink(community.instagram_url, 'Instagram')}
      >
        <Ionicons name="logo-instagram" size={24} color={Colors.primary} />
      </TouchableOpacity>
    )}

    {community.tiktok_url && (
      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => openSocialLink(community.tiktok_url, 'TikTok')}
      >
        <Ionicons name="logo-tiktok" size={24} color={Colors.primary} />
      </TouchableOpacity>
    )}

    {community.facebook_url && (
      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => openSocialLink(community.facebook_url, 'Facebook')}
      >
        <Ionicons name="logo-facebook" size={24} color={Colors.primary} />
      </TouchableOpacity>
    )}

    {community.youtube_url && (
      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => openSocialLink(community.youtube_url, 'YouTube')}
      >
        <Ionicons name="logo-youtube" size={24} color={Colors.primary} />
      </TouchableOpacity>
    )}
  </View>
)}
```

Add styles (in StyleSheet.create):
```typescript
socialRow: {
  flexDirection: 'row',
  gap: Spacing.md,
  marginTop: Spacing.lg,
  justifyContent: 'center',
  flexWrap: 'wrap',
},
socialButton: {
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: Colors.brandLight,
  justifyContent: 'center',
  alignItems: 'center',
  ...Shadows.sm,
},
```

### Step 3: Create Community Manager Edit Screen
**File:** `/frontend/src/screens/EditCommunityScreen.tsx` (NEW FILE)

This screen needs to:
1. Load current community data
2. Display form with TextInputs for each social media URL
3. Display TextInput for banner image URL
4. Save button that calls PUT /api/communities/:id

### Step 4: Update communityService.ts
**File:** `/backend/src/services/communityService.ts`

The `updateCommunity` function likely already handles all fields automatically through Supabase, but verify it includes social media fields in the update.

### Step 5: Add Navigation to Edit Screen
**Where:** Community Manager Dashboard

Add an "Edit Community" button that navigates to the Edit Community screen for managers.

---

## Testing Checklist

Once database columns are added:

- [ ] View community detail page - should show social media icons if URLs exist
- [ ] Click social media icons - should open respective platforms
- [ ] Community Manager can edit social media links
- [ ] Social media links save correctly
- [ ] Banner image displays if provided
- [ ] Member count shows correctly

---

## Icon Reference
- X (Twitter): `logo-twitter`
- Instagram: `logo-instagram`
- TikTok: `logo-tiktok`
- Facebook: `logo-facebook`
- YouTube: `logo-youtube`

All icons from `@expo/vector-icons` Ionicons

---

## Database Column Details
- `twitter_url` - VARCHAR(255) - Full URL to X/Twitter profile
- `instagram_url` - VARCHAR(255) - Full URL to Instagram profile
- `tiktok_url` - VARCHAR(255) - Full URL to TikTok profile
- `facebook_url` - VARCHAR(255) - Full URL to Facebook page
- `youtube_url` - VARCHAR(255) - Full URL to YouTube channel
- `banner_image` - TEXT - URL to banner image (displayed at top of community page)

All fields are optional (nullable).
