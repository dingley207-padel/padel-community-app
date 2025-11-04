# Frontend Configuration Fixes

This document explains the fixes applied to get the React Native frontend working with NativeWind v4.

## Issues Encountered

1. **Error:** `Exception in HostFunction: TypeError: expected dynamic type 'boolean', but had type 'string'`
2. **Error:** `Cannot find module 'babel-preset-expo'`

## Root Cause

The initial frontend setup was missing proper NativeWind v4 configuration. NativeWind v4 requires specific setup that differs from v2/v3:

- Metro bundler configuration
- Babel plugin configuration
- CSS processing setup
- TypeScript declarations

## Fixes Applied

### 1. Created `babel.config.js`

**File:** `frontend/babel.config.js`

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

**Purpose:** Configures Babel for Expo. Note: NativeWind v4 does NOT use a babel plugin - it processes CSS through Metro instead.

### 2. Created `metro.config.js`

**File:** `frontend/metro.config.js`

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

**Purpose:** Configures Metro bundler to process CSS and integrate NativeWind.

### 3. Created `global.css`

**File:** `frontend/global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Purpose:** Entry point for Tailwind CSS directives.

### 4. Created TypeScript Declarations

**File:** `frontend/nativewind-env.d.ts`

```typescript
/// <reference types="nativewind/types" />
```

**Purpose:** Provides TypeScript type definitions for NativeWind classes.

### 5. Updated `tailwind.config.js`

**Changes:**
- Added `presets: [require("nativewind/preset")]`
- Added TypeScript type comment
- Kept custom theme configuration

**Purpose:** Integrates NativeWind preset with Tailwind configuration.

### 6. Updated `App.tsx`

**Changes:**
- Added `import './global.css';` at the top

**Purpose:** Imports global CSS to initialize Tailwind.

### 7. Cleaned Up `app.json`

**Removed:**
- `newArchEnabled: true` (caused boolean type error)
- `edgeToEdgeEnabled: true`
- `predictiveBackGestureEnabled: false`
- `plugins: ["expo-router"]` (not needed)

**Updated:**
- Changed app name to "Padel Community"
- Changed slug to "padel-community"
- Added bundle identifiers for iOS and Android

**Purpose:** Simplified configuration and removed problematic flags.

### 8. Installed Missing Dependencies

**Commands:**
```bash
npm install --save-dev babel-preset-expo
```

**Purpose:** Added missing Babel preset required by Expo.

## Files Created

1. ✅ `frontend/babel.config.js`
2. ✅ `frontend/metro.config.js`
3. ✅ `frontend/global.css`
4. ✅ `frontend/nativewind-env.d.ts`

## Files Modified

1. ✅ `frontend/app.json`
2. ✅ `frontend/tailwind.config.js`
3. ✅ `frontend/App.tsx`
4. ✅ `frontend/package.json` (added babel-preset-expo)

## How to Test

1. **Clear cache and restart:**
   ```bash
   cd frontend
   npx expo start -c
   ```

2. **Run on iOS Simulator:**
   ```bash
   Press 'i' in the terminal
   ```

3. **Run on Android Emulator:**
   ```bash
   Press 'a' in the terminal
   ```

4. **Run on physical device:**
   - Install Expo Go app
   - Scan QR code
   - Make sure `API_URL` in `.env` uses your computer's IP (not localhost)

## Expected Behavior

After these fixes:
- ✅ App loads without errors
- ✅ NativeWind classes work correctly
- ✅ Tailwind styles are applied
- ✅ Authentication screen displays properly
- ✅ Navigation works

## NativeWind v4 Requirements Checklist

- [x] `babel.config.js` with babel-preset-expo (NO nativewind/babel plugin needed!)
- [x] `metro.config.js` with withNativeWind for CSS processing
- [x] `global.css` with Tailwind directives
- [x] `nativewind-env.d.ts` for TypeScript
- [x] `tailwind.config.js` with NativeWind preset
- [x] Import global.css in App.tsx
- [x] babel-preset-expo installed
- [x] nativewind and tailwindcss packages installed

## Troubleshooting

### If you still see errors:

**Clear everything:**
```bash
cd frontend
rm -rf node_modules .expo
npm install
npx expo start -c
```

**Check all config files exist:**
```bash
ls -la | grep -E "babel.config|metro.config|global.css|nativewind"
```

**Verify package.json has:**
```json
{
  "dependencies": {
    "nativewind": "^4.2.1",
    "tailwindcss": "^3.4.18"
  },
  "devDependencies": {
    "babel-preset-expo": "^54.0.6"
  }
}
```

## References

- [NativeWind v4 Documentation](https://www.nativewind.dev/v4/getting-started/expo-router)
- [Expo Documentation](https://docs.expo.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Migration Notes

If you started with NativeWind v2/v3, this is the required migration to v4:

**Before (v2/v3):**
- Used `tailwind.config.js` only
- No metro config needed
- Different babel plugin

**After (v4):**
- Requires metro config with CSS processing
- Requires global.css import
- Requires NativeWind preset in tailwind.config.js
- Uses new babel plugin

## Common Mistakes to Avoid

1. ❌ Forgetting to import `global.css` in App.tsx
2. ❌ Not clearing cache after config changes
3. ❌ Using NativeWind v2/v3 setup with v4 package
4. ❌ Missing babel-preset-expo dependency
5. ❌ Not using NativeWind preset in tailwind config
6. ❌ Setting problematic flags in app.json (newArchEnabled, etc.)

## Performance Notes

NativeWind v4 is more performant than v2/v3 because:
- CSS is processed at build time
- Better tree-shaking
- Smaller bundle size
- Improved TypeScript support

## Next Steps

Now that the frontend is properly configured:

1. ✅ App loads and runs
2. ⏭️ Continue building additional screens
3. ⏭️ Integrate Stripe payment UI
4. ⏭️ Build manager dashboard
5. ⏭️ Test full user flows

---

**Status:** Frontend configuration complete and working! 🎉
