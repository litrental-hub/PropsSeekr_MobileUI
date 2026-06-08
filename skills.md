# PropSeekr — Auth Screen Design System & Skills

> **Purpose**: This file documents every design token, component pattern, and coding convention
> used in `LoginScreen.tsx` and `RegistrationScreen.tsx`. Reference this whenever building any
> new screen in the PropSeekr app to ensure 100% visual and code consistency.

---

## 1. Brand Palette

The single source of truth for all colors used across auth screens.

```ts
const Brand = {
  navy:    '#050D1F',   // deepest background / StatusBar
  navyMid: '#0B1B4D',  // background gradient top
  blue:    '#2563EB',   // primary brand blue (buttons, borders, windows)
  teal:    '#10B981',   // secondary brand teal (CTAs, links, accents)
  white:   '#FFFFFF',   // text, logo roof
};

// Derived / used inline
'#020810'   // background gradient bottom (deepest)
'#1A8CD8'   // button gradient mid-stop (blue → this → teal)
'#0E9A77'   // Seekr text mid-letter (blue→teal transition)
'#4FA3E8'   // tagline "MATCH." color (between blue and teal)
```

### Usage Rules
| Token     | Use for                                              |
|-----------|------------------------------------------------------|
| `Brand.navy`    | Screen background, StatusBar bg                |
| `Brand.navyMid` | Gradient top stop                              |
| `Brand.blue`    | Borders, window squares, tagline "FIND.", button gradient start |
| `Brand.teal`    | Links, tagline "CLOSE.", button gradient end, section dividers |
| `Brand.white`   | Headlines, logo roof, input text, button text  |

---

## 2. Background Pattern

Every dark-theme screen uses a 3-stop LinearGradient as the full-screen background,
plus a thin blue→teal accent bar pinned to the very top.

```tsx
// Full screen background (place first, with absoluteFill)
<LinearGradient
  colors={[Brand.navyMid, Brand.navy, '#020810']}
  locations={[0, 0.6, 1]}
  style={StyleSheet.absoluteFill}
/>

// Top accent bar (3px, pinned, zIndex: 10)
<LinearGradient
  colors={[Brand.blue, Brand.teal]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={{ height: 3, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
/>
```

### StatusBar
```tsx
<StatusBar barStyle="light-content" backgroundColor={Brand.navy} />
```

---

## 3. PropSeekrLogo Component

A **pure React Native vector component** — no images, no SVG library needed.
Renders the PropSeekr brand mark at any size via a single `size` prop.

### What it draws
- **White ∧ roof chevron**: two mathematically-positioned rotated rectangles
- **2 × 2 blue window squares**: centred beneath the roof peak
- **"Prop"** in white bold + **"Seekr"** in per-letter blue→teal gradient

### Copy-paste component
```tsx
function PropSeekrLogo({ size = 88 }: { size?: number }) {
  const strokeW  = size * 0.075;
  const roofW    = size;
  const roofH    = size * 0.44;
  const armLen   = Math.sqrt((roofW / 2) ** 2 + roofH ** 2);
  const angleDeg = Math.atan(roofH / (roofW / 2)) * (180 / Math.PI);
  const winSz    = size * 0.155;
  const winGap   = size * 0.045;
  const fontSize = size * 0.34;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: roofW, alignItems: 'center' }}>
        {/* Roof chevron */}
        <View style={{ width: roofW, height: roofH, position: 'relative', marginBottom: 4 }}>
          <View style={{
            position: 'absolute', width: armLen, height: strokeW,
            backgroundColor: '#FFFFFF', borderRadius: strokeW,
            left: roofW / 4 - armLen / 2, top: roofH / 2 - strokeW / 2,
            transform: [{ rotate: `-${angleDeg}deg` }],
          }} />
          <View style={{
            position: 'absolute', width: armLen, height: strokeW,
            backgroundColor: '#FFFFFF', borderRadius: strokeW,
            left: (3 * roofW) / 4 - armLen / 2, top: roofH / 2 - strokeW / 2,
            transform: [{ rotate: `${angleDeg}deg` }],
          }} />
        </View>
        {/* 2x2 windows */}
        <View style={{ flexDirection: 'row', gap: winGap, marginBottom: 10 }}>
          {[0, 1].map(col => (
            <View key={col} style={{ gap: winGap }}>
              <View style={{ width: winSz, height: winSz, backgroundColor: '#2563EB', borderRadius: 2 }} />
              <View style={{ width: winSz, height: winSz, backgroundColor: '#2563EB', borderRadius: 2 }} />
            </View>
          ))}
        </View>
      </View>
      {/* PropSeekr text */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 }}>Prop</Text>
        <Text style={{ fontSize, fontWeight: '800', color: '#2563EB', letterSpacing: -0.3 }}>S</Text>
        <Text style={{ fontSize, fontWeight: '800', color: '#2563EB', letterSpacing: -0.3 }}>e</Text>
        <Text style={{ fontSize, fontWeight: '800', color: '#0E9A77', letterSpacing: -0.3 }}>e</Text>
        <Text style={{ fontSize, fontWeight: '800', color: '#10B981', letterSpacing: -0.3 }}>k</Text>
        <Text style={{ fontSize, fontWeight: '800', color: '#10B981', letterSpacing: -0.3 }}>r</Text>
      </View>
    </View>
  );
}
```

### Size guide
| Screen             | `size` prop |
|--------------------|-------------|
| Login (large)      | `88`        |
| Registration       | `64`        |
| Header / Nav       | `36`        |
| Splash screen      | `120`       |

---

## 4. FIND. MATCH. CLOSE. Tagline

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
  <View style={{ width: 18, height: 1.5, backgroundColor: '#2563EB', marginHorizontal: 6 }} />
  <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB', letterSpacing: 1.5 }}>FIND.</Text>
  <Text style={{ fontSize: 11, fontWeight: '700', color: '#4FA3E8', letterSpacing: 1.5 }}> MATCH.</Text>
  <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981', letterSpacing: 1.5 }}> CLOSE.</Text>
  <View style={{ width: 18, height: 1.5, backgroundColor: '#10B981', marginHorizontal: 6 }} />
</View>
```

---

## 5. Typography Scale

```ts
// Screen headlines
fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, lineHeight: 38

// Subtitles
fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 22

// Form labels
fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)'

// Section titles (KYC, Business etc.)
fontSize: 15, fontWeight: '700', color: '#10B981'

// Button text
fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3

// Legal / fine print
fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 18

// Links
color: '#10B981', fontWeight: '700'

// Back button
fontSize: 15, fontWeight: '600', color: '#10B981'
```

---

## 6. Input Field Patterns

### Phone input (prefix + TextInput)
```tsx
<View style={{ borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(37,99,235,0.4)', overflow: 'hidden', marginBottom: 14 }}>
  <LinearGradient
    colors={['rgba(37,99,235,0.15)', 'rgba(16,185,129,0.08)']}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
  >
    <Text style={{ fontSize: 15, color: '#FFFFFF', fontWeight: '600' }}>🇮🇳 +91</Text>
    <View style={{ width: 1, height: 20, backgroundColor: 'rgba(37,99,235,0.4)' }} />
    <TextInput
      style={{ flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '500', padding: 0 }}
      placeholder="Enter your mobile number"
      placeholderTextColor="rgba(255,255,255,0.35)"
      keyboardType="phone-pad"
      maxLength={10}
      returnKeyType="done"
    />
  </LinearGradient>
</View>
```

### General form input
```tsx
// Normal state
backgroundColor: 'rgba(37,99,235,0.10)'
borderWidth: 1.5, borderColor: 'rgba(37,99,235,0.3)'
borderRadius: 14, height: 54

// Error state
borderColor: '#EF4444'
backgroundColor: 'rgba(239,68,68,0.06)'
```

### Input prefix icons
| Field    | Prefix |
|----------|--------|
| Phone    | `🇮🇳 +91` |
| Name     | `👤`   |
| Aadhaar  | `🆔`   |
| PAN      | `🗂️`  |
| GST      | `🧾`   |
| RERA     | `🏅`   |

---

## 7. Primary CTA Button

```tsx
<TouchableOpacity onPress={onPress} activeOpacity={0.85}>
  <LinearGradient
    colors={['#2563EB', '#1A8CD8', '#10B981']}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
    style={{
      borderRadius: 16, paddingVertical: 16, alignItems: 'center',
      shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45, shadowRadius: 14, elevation: 8, marginBottom: 16,
    }}
  >
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 }}>
      Button Label →
    </Text>
  </LinearGradient>
</TouchableOpacity>
```

> **Rule**: Always use `colors={['#2563EB', '#1A8CD8', '#10B981']}` for all primary CTAs.

---

## 8. Section Divider

```tsx
<View style={{ marginVertical: 20 }}>
  <LinearGradient
    colors={['#2563EB', '#10B981']}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
    style={{ height: 1.5, borderRadius: 1, marginBottom: 12 }}
  />
  <Text style={{ fontSize: 15, fontWeight: '700', color: '#10B981', marginBottom: 3 }}>
    Section Title
  </Text>
  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
    Optional description text.
  </Text>
</View>
```

---

## 9. Step Progress Indicator

```tsx
<View style={{ flexDirection: 'row', gap: 6, marginBottom: 28 }}>
  <LinearGradient
    colors={['#2563EB', '#10B981']}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
    style={{ flex: 2, height: 4, borderRadius: 2 }}    // active step
  />
  <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' }} />
</View>
```

---

## 10. Error Text

```tsx
{error && (
  <Text style={{ fontSize: 12, color: '#F87171', marginTop: 5, fontWeight: '500' }}>
    {error}
  </Text>
)}
```

---

## 11. Navigation Link Pattern

```tsx
<TouchableOpacity onPress={() => navigation.navigate('Screen')} activeOpacity={0.75}
  style={{ alignItems: 'center', paddingVertical: 12 }}>
  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
    Prefix?{' '}
    <Text style={{ color: '#10B981', fontWeight: '700' }}>Action</Text>
  </Text>
</TouchableOpacity>
```

---

## 12. New Screen Template

```tsx
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const Brand = {
  navy: '#050D1F', navyMid: '#0B1B4D',
  blue: '#2563EB', teal: '#10B981', white: '#FFFFFF',
};

export default function NewScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Brand.navy }}>
      <StatusBar barStyle="light-content" backgroundColor={Brand.navy} />
      <LinearGradient
        colors={[Brand.navyMid, Brand.navy, '#020810']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ height: 3, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 28 }}>
          {/* Content here */}
        </View>
      </SafeAreaView>
    </View>
  );
}
```

---

## 13. Required Dependencies

```json
"react-native-linear-gradient": "^2.x",
"react-native-safe-area-context": "^4.x",
"@react-navigation/native": "^6.x",
"react-hook-form": "^7.x",
"@hookform/resolvers": "^3.x",
"zod": "^3.x"
```

---

## 14. Do's and Don'ts

| ✅ Do                                              | ❌ Don't                                           |
|----------------------------------------------------|----------------------------------------------------|
| Use `Brand.*` constants for all colors             | Hardcode hex values without Brand constant         |
| Use `LinearGradient` for all primary buttons       | Use plain `backgroundColor` for CTA buttons        |
| Use `PropSeekrLogo` component for branding         | Use emoji 🏠 or a PNG image as the logo            |
| `SafeAreaView edges={['top','bottom']}` on every screen | Forget safe area insets                       |
| `rgba(37,99,235,0.x)` for subtle blue tints        | Use plain `blue` or `opacity` wrapper              |
| `borderRadius: 16` on inputs and buttons           | Mix different borderRadius values                  |
| `placeholderTextColor="rgba(255,255,255,0.35)"`    | Leave placeholder default (shows black)            |
| `elevation: 8` + `shadowColor: Brand.blue` on buttons | Skip shadows on CTAs                          |
