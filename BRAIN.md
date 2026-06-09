# PropSeekr — AI Brain 🧠
> **This is the single source of truth for the entire PropSeekrUI project.**  
> Every new screen, component, feature, or bug fix must reference and update this file.  
> Last updated: June 2026

---

## 📌 What is PropSeekr?

**PropSeekr** is a **broker-to-broker real estate platform** for India.  
Brokers can post properties, post client requirements, match with other brokers, and unlock contact details using a **credit system**.

### Core Value Proposition
> *"Find. Match. Close."*
- A broker has a property → finds another broker who has a buyer requirement
- They match → one broker pays credits to unlock the other's contact
- They close the deal together

### Target Users
- Real estate brokers in India (Tier 1 & 2 cities)
- Primary launch city: **Indore, Madhya Pradesh**
- Language style: Mix of Hindi + English ("Aaj dala", "Mera client hai", "Kiraya")

---

## ⚙️ Backend Stack

| Item | Detail |
|---|---|
| **Framework** | **.NET 9 Web API** (C#) |
| **Auth** | JWT Bearer tokens (access + refresh token pattern) |
| **API version** | `/api/v1/` prefix |
| **Dev URL (Android emulator)** | `http://10.0.2.2:5079/api/v1` |
| **Dev URL (iOS simulator)** | `http://localhost:5079/api/v1` |
| **Prod URL** | `https://api.propseekr.in/v1` *(to be set)* |
| **API client file** | `src/api/client.ts` (Axios, JWT auto-attach, refresh interceptor) |

### API Client features (already built)
- ✅ Axios instance with `baseURL`, `timeout: 15s`, JSON headers
- ✅ Request interceptor: auto-attaches `Authorization: Bearer <token>` from MMKV
- ✅ Response interceptor: on 401 → auto-calls `/auth/refresh`, retries original request
- ✅ On refresh fail: clears tokens from storage (TODO: redirect to Login)

### Expected .NET 9 API Endpoints (to be confirmed when shared)

#### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/send-otp` | Send OTP to mobile number |
| POST | `/auth/verify-otp` | Verify OTP → returns JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/register` | Register new broker |
| POST | `/auth/logout` | Invalidate refresh token |

#### Properties
| Method | Endpoint | Description |
|---|---|---|
| GET | `/properties` | List properties (with filters) |
| GET | `/properties/{id}` | Property detail |
| POST | `/properties` | Create new listing |
| PUT | `/properties/{id}` | Update listing |
| DELETE | `/properties/{id}` | Remove listing |

#### Requirements
| Method | Endpoint | Description |
|---|---|---|
| GET | `/requirements` | List requirements |
| POST | `/requirements` | Post new requirement |
| PUT | `/requirements/{id}` | Update requirement |

#### Matches
| Method | Endpoint | Description |
|---|---|---|
| GET | `/matches` | My matches |
| POST | `/matches/{id}/unlock` | Unlock contact (costs credits) |

#### Credits
| Method | Endpoint | Description |
|---|---|---|
| GET | `/credits/balance` | Current balance |
| POST | `/credits/purchase` | Buy credit pack |
| GET | `/credits/history` | Transaction history |

#### Broker Profile
| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile` | My profile |
| PUT | `/profile` | Update profile |

> **Note:** All endpoints will be confirmed and updated once you share the .NET 9 API project.

---

## 🗂️ Project Structure

```
PropSeekrUI/
├── src/
│   ├── api/
│   │   └── client.ts              # Axios API client
│   ├── assets/images/
│   │   └── logo.png               # Static logo (not used — we use vector)
│   ├── components/
│   │   ├── PropSeekrLogo.tsx      # ✅ MASTER vector logo component
│   │   ├── cards/
│   │   │   ├── LiveOverviewCard.tsx
│   │   │   └── PropertyCard.tsx
│   │   ├── common/
│   │   │   └── SectionToggle.tsx
│   │   └── modals/
│   │       ├── CreateRequirementModal.tsx
│   │       └── ListPropertyModal.tsx
│   ├── constants/
│   │   ├── colors.ts              # Legacy color constants
│   │   ├── index.ts
│   │   └── theme.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx      # Stack navigator (Auth → Main)
│   │   └── BottomTabNavigator.tsx # Tab bar for main app
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx        ✅ Built & themed
│   │   │   ├── RegistrationScreen.tsx ✅ Built & themed
│   │   │   └── OTPScreen.tsx          🔲 Exists, needs theme
│   │   ├── Dashboard/
│   │   │   └── DashboardScreen.tsx    ✅ Built & themed
│   │   ├── Credits/
│   │   │   ├── BuyCreditsScreen.tsx   🔲 Exists, needs theme
│   │   │   └── CreditsScreen.tsx      🔲 Exists, needs theme
│   │   ├── Matches/
│   │   │   ├── MatchesScreen.tsx      🔲 Exists, needs theme
│   │   │   └── MatchDetailScreen.tsx  🔲 Exists, needs theme
│   │   ├── Profile/
│   │   │   ├── ProfileScreen.tsx      🔲 Exists, needs theme
│   │   │   └── NotificationsScreen.tsx 🔲 Exists, needs theme
│   │   ├── Properties/
│   │   │   ├── AddPropertyScreen.tsx  🔲 Exists, needs theme
│   │   │   ├── InventoryScreen.tsx    🔲 Exists, needs theme
│   │   │   └── PropertyDetailScreen.tsx 🔲 Exists, needs theme
│   │   ├── Requirements/
│   │   │   ├── AddRequirementScreen.tsx 🔲 Exists, needs theme
│   │   │   └── RequirementDetailScreen.tsx 🔲 Exists, needs theme
│   │   └── Search/
│   │       └── SearchScreen.tsx       🔲 Exists, needs theme
│   ├── store/
│   │   ├── appStore.ts            # Zustand: theme, sectionType, credits
│   │   └── authStore.ts           # Zustand: user auth state
│   ├── theme/
│   │   └── useAppTheme.ts         # ✅ Dynamic Light/Dark theme hook
│   └── utils/
│       ├── formatters.ts
│       └── storage.ts
├── skills.md                      # Design system reference (AUTH screens)
└── BRAIN.md                       # ← THIS FILE (full project AI brain)
```

**Legend:** ✅ Done | 🔲 Exists but not themed | ❌ Not built yet

---

## 🎨 Theme System

### Dynamic Theme Engine
File: `src/theme/useAppTheme.ts`

```ts
import { useAppTheme, Brand } from '../theme/useAppTheme';

// In any component:
const { colors, Brand, type, isDark } = useAppTheme();
```

### Brand Tokens (NEVER change, same in both themes)
```ts
Brand.blue     = '#2563EB'  // Primary blue
Brand.teal     = '#10B981'  // Primary teal
Brand.white    = '#FFFFFF'
Brand.blueBorder = 'rgba(37,99,235,0.3)'
```

### Dynamic Color Tokens
| Token | Dark Mode | Light Mode |
|---|---|---|
| `colors.navy` | `#050D1F` | `#FFFFFF` |
| `colors.bgStart` | `#0B1B4D` | `#FFFFFF` |
| `colors.bgMid` | `#050D1F` | `#F8FAFF` |
| `colors.bgEnd` | `#020810` | `#F0F4F8` |
| `colors.cardBg` | `rgba(255,255,255,0.07)` | `#FFFFFF` |
| `colors.cardBgLight` | `rgba(255,255,255,0.1)` | `#F8FAFF` |
| `colors.inputBg` | `rgba(37,99,235,0.10)` | `#FFFFFF` |
| `colors.textPrimary` | `#FFFFFF` | `#050D1F` |
| `colors.textSecondary` | `rgba(255,255,255,0.5)` | `#64748B` |
| `colors.textDim` | `rgba(255,255,255,0.3)` | `#94A3B8` |
| `colors.borderFaint` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.05)` |
| `colors.successFaint` | `rgba(16,185,129,0.15)` | `#DCFCE7` |
| `colors.errorFaint` | `rgba(239,68,68,0.12)` | `#FEE2E2` |
| `colors.errorText` | `#F87171` | `#EF4444` |

### Theme Toggle
- Stored in: `useAppStore` → `theme: 'dark' | 'light'`
- Persisted to device storage via MMKV
- Toggle function: `useAppStore(s => s.toggleTheme)`
- Toggle button on: **ProfileScreen** (only)

---

## 🏠 PropSeekrLogo Component

File: `src/components/PropSeekrLogo.tsx`

### Props
```ts
<PropSeekrLogo 
  size={88}           // scales everything proportionally
  theme="dark"        // 'dark' | 'light' — controls roof & text color
  layout="vertical"   // 'vertical' (auth) | 'horizontal' (dashboard header)
/>
```

### Usage per screen
| Screen | size | layout |
|---|---|---|
| Login | `88` | `vertical` |
| Registration | `64` | `vertical` |
| Dashboard header | `30` | `horizontal` |

### Logo anatomy (all proportional to `size`)
- **Chevron roof**: two rotated arms, white in dark / navy in light
- **Chimney**: at `roofW * 0.75` (right arm), `roofH * 0.4` (lower on arm)
- **2×2 window**: blue→teal gradient matching Seekr text
  - Top-left: `#2563EB` | Top-right: `#1799C4`
  - Bottom-left: `#1E7FD8` | Bottom-right: `#10B981`
- **"Prop"**: white/navy text
- **"Seekr"**: 5-character gradient — `#2563EB → #1E7FD8 → #1799C4 → #10B2B0 → #10B981`

---

## 🗺️ Navigation Structure

```
RootNavigator (Stack)
├── Auth Group (when !isAuthenticated)
│   ├── Login
│   ├── Registration
│   └── OTP
└── Main Group (when isAuthenticated)
    ├── Dashboard (Stack screen)
    ├── BuyCredits (Stack screen)
    └── BottomTabNavigator
        ├── Dashboard tab
        ├── Search tab
        ├── Matches tab
        ├── Inventory (Properties) tab
        └── Profile tab
```

---

## 🗃️ State Management

### authStore (`src/store/authStore.ts`)
```ts
{
  user: User | null,
  accessToken: string | null,
  refreshToken: string | null,
  isAuthenticated: boolean,
  setAuth(user, accessToken, refreshToken): void,
  clearAuth(): void,
}
```

### appStore (`src/store/appStore.ts`)
```ts
{
  theme: 'dark' | 'light',           // persisted
  sectionType: 'Rentals' | 'Buying', // persisted
  creditsBalance: number,             // persisted
  toggleTheme(): void,
  setTheme(theme): void,
  setSectionType(type): void,
}
```

---

## 📊 Core Data Models

### Property
```ts
{
  id: string,
  title: string,         // e.g. "2BHK Semi-Furnished Flat"
  subtitle: string,      // area + floor + facing
  type: 'Residential' | 'Commercial' | 'Plot' | 'Villa',
  section: 'Rentals' | 'Buying',
  kiraya?: string,       // rental price
  price?: string,        // buy/sell price
  area: string,          // sqft
  available: string,     // availability date
  features: Feature[],   // { icon, label }
  preferences: Preference[], // owner preferences (allowed: boolean)
  location: string,
  brokerName: string,
  brokerInitials: string,
  unlockCost: number,    // credits needed to unlock
  isNearby: boolean,
  freshLabel: string,    // "Aaj dala" etc.
}
```

### Requirement (Client Need)
```ts
{
  id: string,
  title: string,         // e.g. "3BHK flat for family"
  sub: string,           // budget + area
  initials: string,      // client initials
  color: string,         // avatar bg color
}
```

### User / Broker
```ts
{
  id: string,
  name: string,
  phone: string,
  agency: string,
  locality: string,
  isAadhaarVerified: boolean,
  isReraVerified: boolean,
  ratingScore: number,
}
```

---

## 🖥️ Screens — Detailed Status

### ✅ LoginScreen
- **Route**: `Login`
- **Features**: Mobile number input, Send OTP CTA, nav to Registration
- **Mock**: Pressing "Send OTP" logs in directly (bypasses OTP for now)

### ✅ RegistrationScreen
- **Route**: `Registration`
- **Features**: Name, Mobile, Aadhaar/PAN (KYC), GST, RERA
- **Validation**: react-hook-form + zod

### ✅ DashboardScreen
- **Route**: `Dashboard`
- **Features**:
  - Header: Logo (horizontal) + Rental/Buy toggle + Credits chip
  - Location bar: Current area + listing count
  - Search box + Filter button
  - BHK filter chips (Sab, 1BHK, 2BHK, 3BHK, Commercial, Plot, Villa)
  - Tabs: Available / Looking / Matched (with count badges)
  - "AAPKE AAS-PAAS" section with PropertyCard
  - "ACTIVE REQUIREMENTS" section with RequirementRow
  - FAB (+) button
- **Data**: Currently mock data

### 🔲 OTPScreen
- Exists, needs theme applied

### 🔲 BuyCreditsScreen / CreditsScreen
- Credit purchase flow — needs design + theme

### 🔲 MatchesScreen / MatchDetailScreen
- Where matched properties/requirements are shown

### ✅ ProfileScreen / NotificationsScreen
- Broker profile with editable details (Photo, Name, GST, Address, Email)
- Theme toggle: ☀️/🌙 switch is exclusively available here
- Log Out button
- RERA/Aadhaar badges, rating (planned)

### 🔲 Properties screens (Add/Inventory/Detail)
- Broker's own listed properties

### 🔲 Requirements screens (Add/Detail)
- Client requirements broker has

### 🔲 SearchScreen
- Search across the platform

---

## 🎨 Design System Rules (apply to ALL screens)

### 1. Every screen must have
```tsx
// Background gradient
<LinearGradient colors={[colors.bgStart, colors.bgMid, colors.bgEnd]} 
  locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

// Top accent bar
<LinearGradient colors={[Brand.blue, Brand.teal]} 
  start={{x:0,y:0}} end={{x:1,y:0}}
  style={{ height: 3, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />

// StatusBar
<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />
```

### 2. Theme hook — import in every screen
```tsx
import { useAppTheme, Brand } from '../../theme/useAppTheme';
const { colors, type, isDark } = useAppTheme();
```

### 3. Glass card pattern (dark theme)
```tsx
backgroundColor: colors.cardBg,   // rgba(255,255,255,0.07) in dark
borderWidth: 1.5,
borderColor: Brand.blueBorder,     // rgba(37,99,235,0.3)
borderRadius: 18,
```

### 4. Primary gradient button
```tsx
<LinearGradient colors={[Brand.blue, '#1A8CD8', Brand.teal]}
  start={{x:0,y:0}} end={{x:1,y:0}}
  style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    shadowColor: Brand.blue, shadowOffset: {width:0, height:6},
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8 }}
>
  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Label →</Text>
</LinearGradient>
```

### 5. Typography scale
| Use | fontSize | fontWeight | color |
|---|---|---|---|
| Screen headline | 30 | 800 | `colors.textPrimary` |
| Card title | 17 | 800 | `colors.textPrimary` |
| Body | 14 | 400 | `colors.textSecondary` |
| Label | 13 | 600 | `colors.textSecondary` |
| Caption | 11 | 500 | `colors.textDim` |
| Micro label | 9 | 700 | `colors.textDim` |

### 6. Section header pattern
```tsx
<Text style={{ fontSize: 11, fontWeight: '800', color: Brand.teal, 
  letterSpacing: 1.5, textTransform: 'uppercase' }}>
  SECTION TITLE
</Text>
```

---

## 💡 Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| State management | Zustand | Simple, no boilerplate |
| Storage | MMKV (via zustand persist) | Fast native key-value store |
| Form validation | react-hook-form + zod | Type-safe, performant |
| Gradients | react-native-linear-gradient | Native performance |
| Navigation | @react-navigation/native-stack | Standard RN navigation |
| Logo | Pure RN Vector (no SVG) | No library dep, scales perfectly |
| Theme | Custom `useAppTheme` hook | Full control, persisted |

---

## 🔮 Features Roadmap (Not Built Yet)

| Priority | Feature | Screen(s) | Notes |
|---|---|---|---|
| 🔴 High | OTP Verification | OTPScreen | 6-digit OTP input, resend timer |
| 🔴 High | Property Listing Flow | AddPropertyScreen | Multi-step form |
| 🔴 High | Requirement Posting | AddRequirementScreen | Client budget, BHK, area |
| 🔴 High | Credit Purchase | BuyCreditsScreen | Razorpay/UPI integration |
| 🟡 Medium | Broker Profile | ProfileScreen | KYC badges, rating, listings count |
| 🟡 Medium | Matches Feed | MatchesScreen | Properties matching my client needs |
| 🟡 Medium | Search & Filters | SearchScreen | Area, BHK, budget filters |
| 🟡 Medium | Property Detail | PropertyDetailScreen | Full property view, unlock button |
| 🟢 Low | Notifications | NotificationsScreen | Match alerts, unlock alerts |
| 🟢 Low | Inventory | InventoryScreen | My listed properties |

---

## 📏 Do's & Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Always use `useAppTheme()` for colors | Hardcode hex colors in components |
| Import `Brand` from `useAppTheme` | Redefine Brand constants locally |
| Use `colors.*` tokens for all text/bg | Use `Brand.*` for text/backgrounds (Brand is only for blue/teal/white) |
| Proportional sizing (`size * 0.x`) | Fixed pixel sizes in reusable components |
| `layout="horizontal"` for small header logos | Use vertical layout in tight header rows |
| Keep Hindi/English mix in UI copy | Use pure English (breaks the brand voice) |
| `activeOpacity={0.85}` on all buttons | Use default opacity |
| `SafeAreaView edges={['top','bottom']}` | Skip safe area insets |

---

## 🔧 Troubleshooting & Android Emulator Setup

### 1. Metro Port Config / "Unable to load script"
If the emulator fails to fetch the JavaScript bundle from the host and shows a red "Unable to load script" screen, it is likely due to a Metro server port mismatch (usually defaulting to `8082` because port `8081` was occupied at some point).

**Resolution steps:**
1. Check the emulator's current bundle configuration in the React Native Dev Menu (`Cmd+M` on macOS / `adb shell input keyevent 82` -> **Change Bundle Location**).
2. If it is configured to `10.0.2.2:8082` (or `8082` is mentioned in the instructions), launch Metro explicitly on port `8082`:
   ```bash
   npm run start -- --port 8082
   ```
3. Set up double ADB reverse port mappings so both `8081` and `8082` requests from the emulator are forwarded to Metro's active port `8082` on the host:
   ```bash
   export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
   adb reverse tcp:8081 tcp:8082
   adb reverse tcp:8082 tcp:8082
   ```

### 2. White Screen on Startup
If the app loads the bundle but displays a blank/white screen instead of rendering the `Login` or `Dashboard` UI:
- **`enableScreens(false)` issue**: Setting `enableScreens(false)` under `react-native-screens` can crash/freeze the native stack navigator on Android. Ensure it is set to `enableScreens(true)` in [RootNavigator.tsx](file:///Users/shubhammali/Personal%20Project/PropSeekrUI/src/navigation/RootNavigator.tsx).
- **Stale MMKV Cache**: Clear the app storage to reset state:
  ```bash
  export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
  adb shell pm clear com.propseekrui
  ```

