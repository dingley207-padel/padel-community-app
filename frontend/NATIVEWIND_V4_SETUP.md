# NativeWind v4 Setup - Quick Reference

This project uses **NativeWind v4** which has a different setup than v2/v3.

## ✅ Correct Setup (v4)

### 1. babel.config.js
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // NO nativewind/babel plugin in v4!
  };
};
```

### 2. metro.config.js
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

### 3. global.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. tailwind.config.js
```javascript
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")], // Important!
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 5. App.tsx
```typescript
import './global.css'; // Import at the top

export default function App() {
  // ...
}
```

### 6. nativewind-env.d.ts
```typescript
/// <reference types="nativewind/types" />
```

## ❌ Common Mistakes

1. **Using `nativewind/babel` plugin** - Not needed in v4!
2. **Forgetting to import global.css** - Required for styles to work
3. **Missing NativeWind preset** - Must be in tailwind.config.js
4. **Not clearing cache** - Always clear after config changes

## 🚀 Usage in Components

```tsx
import { View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-primary">
        Hello NativeWind v4!
      </Text>
    </View>
  );
}
```

## 🔄 After Config Changes

Always clear cache:
```bash
npx expo start -c
```

## 📚 Key Differences from v2/v3

| Feature | v2/v3 | v4 |
|---------|-------|-----|
| Babel Plugin | ✅ Required | ❌ Not used |
| Metro Config | ❌ Not needed | ✅ Required |
| CSS File | ❌ Not needed | ✅ Required (global.css) |
| Preset | ❌ Not available | ✅ Required |
| Processing | Runtime | Build-time |

## 📖 More Info

- [NativeWind v4 Docs](https://www.nativewind.dev/v4/overview)
- [Expo Integration](https://www.nativewind.dev/v4/getting-started/expo-router)

---

**Setup Status:** ✅ Complete and Working
