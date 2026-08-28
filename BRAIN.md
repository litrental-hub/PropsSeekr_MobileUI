# PropSeekr mobile application context

Last verified against `main` on 2026-08-28.

This is the mobile repository's current source of truth. Read it before adding a screen, feature, API call, state transition, or business rule. Update it whenever implementation changes the product flow, UI/API contract, navigation, persistent state, integration, or build process. Never store secrets or customer data here.

The backend companion is `PropSeekrMobileAPI/PropsSeekr-MobileAPI/APPLICATION_CONTEXT.md` in the shared workspace. Backend code and the database are authoritative for security, matching, wallet, and reveal decisions.

## Product model

PropSeekr is a broker-to-broker Indian real-estate marketplace: brokers publish property supply (listings) and client demand (requirements), receive compatible cross-broker matches, request a connection, and reveal contact details only after mutual consent.

- A match connects one listing and one requirement from different brokers.
- A match does not reveal a broker's identity or contact details.
- A connection request is the mutual-consent workflow.
- One token is charged to each broker only after both confirm and reveal succeeds.
- A backend reveal record—not a UI label—is the authority to show contact data.

## Stack and local runtime

- React Native 0.85.3, React 19.2, and TypeScript.
- React Navigation native stack and bottom tabs.
- Zustand with MMKV persistence.
- Axios API client and a TanStack Query provider.
- `react-native-maps`, Google provider on Android, plus device geolocation.
- English, Hindi, and Marathi through react-i18next.
- Hermes enabled.

The checked-in Android-emulator API URL is `http://10.0.2.2:5150/api/v1`. `10.0.2.2` reaches the host machine from an Android emulator. iOS, physical devices, and production require a platform/release-aware base URL. Centralize that work in `src/constants/index.ts`; do not scatter URLs through screens.

## App composition and navigation

`App.tsx` provides gesture handling, safe areas, TanStack Query, a global error boundary, and `RootNavigator`.

```text
No token -> Login -> Registration / OTP
Authenticated + locked -> LockScreen
Authenticated + no PIN -> PinSetup
Authenticated + unlocked -> MainTabs
  Dashboard | Matches | MyProperties | Credits | Profile
  plus AddProperty, AddRequirement, details, Search, Notifications, Settings
```

The app locks when backgrounded if an app PIN exists, unless a controlled native flow temporarily disables the lock.

## Identity and shared state

`authStore` owns the user, access token, app PIN, biometric preference, and lock state. The user GUID identifies the account; the numeric `brokerId` owns listings, requirements, wallet, notifications, and matches. Never interchange them.

`appStore` owns:

- light/dark theme;
- Rentals versus Buy/Sell section;
- notification/match badges;
- authoritative wallet snapshot and sync state;
- active city, locality, coordinates, and radius.

Wallet values are refreshed from `/brokers/{brokerId}/wallet` at startup/resume and after connection actions. Do not mutate the displayed balance optimistically as the source of truth.

`src/api/client.ts` is the single Axios client and attaches the bearer token. Known gap: its 401 interceptor calls `POST /auth/refresh`, but the current API has no refresh endpoint or persisted refresh-token flow. Expired tokens therefore cause logout. Do not promise silent renewal until both sides implement it.

## Current journeys

### Authentication

Registration posts account/KYC fields and moves to OTP. Unified login accepts an admin username, mobile, or email plus password. Tokens/profile persist locally, then PIN setup and optional biometrics protect later access. Recheck mobile OTP field names against backend DTOs before changing that path.

### Dashboard

The dashboard toggles Rentals/Buy-Sell, detects location, opens the map picker, filters by category/text, shows token/notification context, and exposes add-property, add-requirement, and bulk text upload.

It currently combines search results, matches, and owned listings into one card shape and de-duplicates by title plus subtitle. Individual failures are swallowed for resilience. This mixes marketplace, matched, and owned semantics; preserve it unless a feature deliberately separates these feeds.

Known backend seam: non-admin `/search/properties` uses legacy `PropertyRequests`; admin search reads canonical listings/requirements. Canonical inventory and matching use listings and requirements.

### Google Map and location

`SearchScreen` renders `react-native-maps`; Android uses `PROVIDER_GOOGLE`. It supports marker placement, a radius circle, GPS, text search, and persistent location.

The Android Maps key is injected through the manifest placeholder from `GOOGLE_MAPS_API_KEY` in `android/local.properties` or the environment. Never commit it. Restrict it to the Android application ID and signing certificate fingerprints and enable only required APIs.

Map rendering is Google, but `src/utils/location.ts` currently uses OpenStreetMap Nominatim for forward/reverse geocoding. Enabling the Android Maps SDK does not switch geocoding to Google. A migration must address restrictions, rate limits, attribution/privacy, and errors.

### Add property

The active multi-step flow is under `src/screens/Properties/AddProperty/`, ending in `ReviewCardSection`. It maps UI values to backend tokens (`RENT`/`SELL`, `APARTMENT`, `BUNGALOW`, `PER_MONTH`, sizes/configuration) and posts `/listings`. The API derives the broker from the JWT.

The form requests GPS and reads coordinates, but does not send them; the current listing contract has no direct coordinate fields. Do not claim manual listing radius matching is implemented.

The success alert does not inspect backend `embedding_completed`; it says matching began for any successful create. If status is shown, distinguish completed from failed/retry-required.

Inventory passes `editId` and initial data, but submission still creates a new listing. This is not a complete edit workflow.

### Add requirement

`AddRequirementScreen` maps transaction/property/configuration, converts area to square feet, collects budget, city/locality, GPS, radius, furnishing/facing, and posts `/requirements`.

Current backend behavior validates location/GPS/radius but persists only city plus locality text in `RawMessageText`; canonical locality IDs/coordinates/radius remain unset. Do not claim exact manual radius matching until persistence is completed.

The screen can prefill initial data, but submission creates a new requirement; there is no canonical update endpoint.

### My Listings and Requirements

`MyPropertiesScreen` loads both collections on focus:

- `GET /listings/mine?page=1&limit=20&transactionType=...`
- `GET /requirements/mine?page=1&limit=20&transactionType=...`

Normal users see broker-owned data; admins intentionally see all brokers. Cards use backend `matchCount` or `matchesFound`. Only the first 20 inventory rows are currently loaded; aggregate totals may be larger.

A listing count opens Matches with `listingId`; a requirement count opens with `requirementId`. `resolveMatchSourceIds` protects this direction. Never pass one as the other.

### Matches and connection

`MatchesScreen` calls `GET /user-matches` with pagination, transaction type, and optional listing, requirement, or exact match ID. It supports infinite paging, refresh, quality tabs, source headers, and notification deep links.

The API response includes both match sides, score, current broker role, state, confirmation expiry, connection request direction/status, reveal state, and contact only after reveal. Use backend aggregate totals; loaded array length is only the current pages.

Critical flow:

```text
Broker A taps Unlock
 -> POST /user-matches/matches/{matchId}/confirm
 -> pending for four hours; no charge; no contact
Broker B accepts through the same endpoint or rejects
 -> if both confirm and both have a token:
    backend atomically reveals and deducts one token from each
```

Rules:

- Never use a direct reveal endpoint for regular unlocking.
- Never infer contacts from listing, requirement, broker, notification, or cache.
- Requestor sees waiting; only the receiving broker sees Accept/Reject.
- Rejection, expiration, or insufficient credit spends nothing.
- `credit_required` is not success.
- Refresh the wallet after a response that can reveal/charge.
- WhatsApp delivery for an unregistered broker is planned, not sent.
- Reading a notification does not accept a request.

See `MATCHING_FLOW_UI_CONTEXT.md` for detailed state/copy rules.

Known mismatch: API aggregate quality bands are 90/75, while current match cards and SQL tiers use 80/60. Resolve SQL, API, UI, and tests as one product decision.

### Notifications, wallet, payments, upload

The active notification API uses numeric broker routes under `/brokers/{brokerId}/notifications`. Taps can deep-link to an exact match. Unread count polls every 30 seconds.

Wallet and ledger use `/brokers/{brokerId}/wallet` and `/credit-transactions`. Packs use `/credit-packs`; Razorpay uses `/payment/order` and `/payment/verify`.

Bulk `.txt` ingestion requests a presigned URL, uploads directly to S3, then calls `/file-processor/pipeline`. The server owns the bucket and runs extraction, ingestion, Gemini embeddings, and matching.

## Design system

The active authority is `src/theme/useAppTheme.ts` plus `src/constants/theme.ts`, not older hard-coded examples in `skills.md`.

- Brand blue `#2563EB`, teal `#10B981`, blue-to-teal primary gradient.
- Dynamic palettes provide surfaces, text, borders, and semantic colors.
- Reuse spacing, radius, font, card, shadow, button, and `PropSeekrLogo` tokens.
- Use safe areas, theme-aware status bars, accessibility labels, and all relevant loading/empty/error states.
- User strings belong in the English/Hindi/Marathi locale files.

An older static `Colors` palette remains in shell/tab code. Prefer the dynamic system for new screens; do not introduce a third palette.

## Compatibility and known gaps

- `createRequirement()` calls nonexistent `/requirements/create`; the active form uses `addRequirement()`.
- `revealMatch()` exists as compatibility code; the active UI uses `confirmMatch()`.
- `admin.ts` exposes internal maintenance operations, not normal user actions.
- Older detail screens/modals coexist with active flows.
- Dashboard mock constants supply fallback presentation values.
- Several DTOs allow broad `any` shapes; narrow contracts instead of extending ambiguity.
- Android release currently uses debug signing.
- `android/gradle.properties` contains Windows-specific Node/Java paths and `newArchEnabled=false`, which RN 0.85 warns is unsupported.

## Build and verification

```bash
npm run start
npm test -- --runInBand
npm run lint
cd android
./gradlew assembleDebug
```

On the current Mac, the Windows Java property needs a Java 17 override:

```bash
./gradlew -Dorg.gradle.java.home=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home assembleDebug
```

Metro normally uses 8081; the API uses 5150. They are separate processes.

## Future-change checklist

1. Identify user/admin behavior and GUID-versus-broker identity.
2. Preserve listing-versus-requirement direction.
3. Verify the endpoint and DTO exist in the current API.
4. Keep aggregate totals separate from loaded pages.
5. Trace new listing/requirement fields through persistence, embedding, matching, and display.
6. Preserve deterministic match constraints before semantic scoring.
7. Preserve mutual consent, reveal gating, atomic two-wallet charge, and retry safety.
8. Refresh wallet state from the backend after mutations.
9. Treat Google map rendering, geocoding, GPS, and database locality as separate layers.
10. Add focused tests and update this file when behavior changes.

## Code map

- `App.tsx`: providers/error boundary.
- `src/navigation/`: auth/PIN/main route graph.
- `src/api/`: backend adapters.
- `src/store/`: persistent state.
- `src/screens/Dashboard/`: combined discovery feed and bulk upload.
- `src/screens/Properties/`, `Requirements/`: canonical forms/inventory.
- `src/screens/Matches/`: pagination and mutual connection.
- `src/screens/Credits/`: wallet, ledger, packs.
- `src/screens/Search/`: Google map picker.
- `src/utils/location.ts`: GPS and Nominatim.
- `src/utils/matchFilters.ts`: source-ID routing.
- `src/services/walletSync.ts`: authoritative wallet refresh.
- `MATCHING_FLOW_UI_CONTEXT.md`: detailed match UX contract.
