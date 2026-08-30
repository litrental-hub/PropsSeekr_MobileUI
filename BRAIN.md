# PropSeekr mobile application context

Last verified against the local implementation on 2026-08-30.

This is the mobile repository's current source of truth. Read it before adding a screen, feature, API call, state transition, or business rule. Update it whenever implementation changes the product flow, UI/API contract, navigation, persistent state, integration, or build process. Never store secrets or customer data here.

The backend companion is `PropSeekrMobileAPI/PropsSeekr-MobileAPI/APPLICATION_CONTEXT.md` in the shared workspace. Backend code and the database are authoritative for security, matching, wallet, and reveal decisions.

Legacy `PropertyRequests`, `UnlockedProperty`, GUID `Notifications`, and account/broker credit mirror columns are historical-only. Their old routes return `410 Gone`; active UI/API paths use canonical listings, requirements, broker wallets, broker notifications, matches, confirmations, and reveals. Retire the historical tables only through a separately verified data-archive migration.

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

The public token-pack catalogue is persisted in MMKV and rendered synchronously on Credits. A valid cache is fresh for six hours; stale data remains visible while one deduplicated background refresh runs, and a failed refresh falls back to the last valid catalogue. Wallet balances and payment order amounts are never sourced from this catalogue cache.

`src/api/client.ts` is the single Axios client and attaches the bearer token. The API has no refresh-token endpoint or persisted refresh-token flow, so a 401 clears local authentication and returns the user to login. Do not promise silent renewal until both sides implement it.

## Current journeys

### Authentication

Registration posts account/KYC fields and moves to OTP. Unified login accepts an admin username, mobile, or email plus password. Tokens/profile persist locally, then PIN setup and optional biometrics protect later access. Recheck mobile OTP field names against backend DTOs before changing that path.

### Dashboard

The dashboard has an explicit location gate. A fresh/legacy install requests current-location permission and performs no marketplace request until a real GPS or manually selected location is available. Denial/unavailable states offer app settings and the map picker; no fallback city or coordinate is submitted.

Dashboard discovery uses only canonical `/search/properties`. It does not combine matches or owned inventory. Rentals/Buy-Sell map to the server transaction direction, Available/Looking map to `SUPPLY`/`DEMAND`, property/configuration filters and debounced text search run server-side, and counts/pagination share the same filters.

Listing and requirement cards are separate, strictly typed, and render only non-null database fields. Missing prices, areas, distances, amenities, preferences, freshness, and actions are omitted rather than replaced with mock content. Home discovery must never render or receive broker names, initials, brokerage details, phone numbers, other contact identity, or raw ingestion messages that may contain those values. Titles use structured property fields with neutral fallbacks. Its protected-contact action routes to the corresponding Matches view; only the mutual unlock flow may reveal contact data. Pull-to-refresh, retry, empty, loading, stale-request protection, and explicit load-more states are required.

`/search/properties` reads canonical listings and requirements for every caller. It is a discovery feed, not an authorization to reveal broker identity or contact details. Canonical inventory and matching use the same listings and requirements.

### Google Map and location

`SearchScreen` renders `react-native-maps`; Android uses `PROVIDER_GOOGLE`. It supports marker placement, a radius circle, GPS, text search, and persistent location. With no resolved location it shows a neutral India viewport but no marker and cannot confirm until the user selects a real point.

The Android Maps key is injected through the manifest placeholder from `GOOGLE_MAPS_API_KEY` in `android/local.properties` or the environment. Never commit it. Restrict it to the Android application ID and signing certificate fingerprints and enable only required APIs.

Map rendering is Google, but `src/utils/location.ts` currently uses OpenStreetMap Nominatim for forward/reverse geocoding. Enabling the Android Maps SDK does not switch geocoding to Google. A migration must address restrictions, rate limits, attribution/privacy, and errors.

### Add property

The active multi-step flow is under `src/screens/Properties/AddProperty/`, ending in `ReviewCardSection`. It maps UI values to backend tokens (`RENT`/`SELL`, `APARTMENT`, `BUNGALOW`, `PER_MONTH`, sizes/configuration) and posts `/listings`. The API derives the broker from the JWT.

The form geocodes the entered property locality/city and sends those coordinates. The API resolves them to a canonical master locality and assigns the listing `master_id`; it must not use the broker's current GPS position as the property's location.

The success alert does not claim embedding/matching completed unless that backend flag is explicitly handled. If status is shown, distinguish completed from failed/retry-required.

The property form persists its property-type-specific fields in the listing `details` object. Matching-critical values use canonical fields instead: project/society name, numeric floor when parseable, road width/access, and fixed/negotiable price status are sent explicitly alongside property type, configuration, price, size, furnishing, facing, and canonical location. When photo sharing is enabled, brokers may select up to 12 photos/videos from the device; the listing is created first, then media is uploaded to `/listings/{listingId}/media`. A media failure is reported as a partial success because the canonical listing already exists. Do not retry listing creation to retry media.

Important current API contract: manual listing and requirement create/update handlers still execute targeted embedding and matching synchronously after saving. Listing responses return snake-case `embedding_completed` and `match_count`; requirement responses return camel-case `embeddingCompleted` and `matchCount`. `embedding_jobs` endpoints and the mobile job client exist, but the manual handlers do not currently enqueue jobs or return job IDs. Do not claim queued-job behavior for manual form submissions until that server wiring is completed.

Bulk `.txt` uploads first ask the broker to confirm a fallback city. The field starts with the current selected city and falls back to `Indore` when that city is unavailable or the input is blank. The fallback is used only for records that do not explicitly name a city. The UI sends it as `defaultCity` when creating the broker-owned job through `/bulk-imports/uploads`, PUTs the text to its presigned URL (or uses authenticated multipart upload in local Development), then calls `/bulk-imports/{jobId}/complete` for S3 mode. The UI must say the import is queued, never completed, at this point. Parsing, Google server-side geocoding, canonical ingestion, embedding, and matching occur in the API worker; job status is available at `/bulk-imports/{jobId}`.

Inventory passes `editId` and initial data. The review submission uses `PATCH /listings/{listingId}` when editing; a new form uses `POST /listings`.

When a canonical listing is patched, the API invalidates every unrevealed match calculated from the prior content, expires pending connection requests, clears confirmations, and queues a replacement embedding/matching job. Revealed connections remain historical contact records. The worker clears the target embedding immediately before each job so an edit that races an active job is re-embedded from the newest persisted content.

### Add requirement

`AddRequirementScreen` maps transaction/property/configuration, converts minimum/maximum area to square feet, supports fixed/flexible/discuss budget modes and minimum/maximum budget, accepts up to five semicolon-separated same-city preferred localities, exposes a 2/3/5/10 km radius, and sends optional furnishing, facing, project, and notes. It geocodes every locality and posts `/requirements`; the API resolves them to `master` and persists the IDs in `preferred_locality_ids`. Broker name/contact are derived from authenticated identity and are not duplicated in the requirement form payload.

Requirement creation follows the same durable embedding-job contract as listings. The screen can prefill initial data; canonical updates use `PATCH /requirements/{requirementId}` and follow the same invalidation and durable re-embedding rules as listings.

### My Listings and Requirements

`MyPropertiesScreen` loads both collections on focus:

- `GET /listings/mine?page=1&limit=20&transactionType=...`
- `GET /requirements/mine?page=1&limit=20&transactionType=...`

Normal users see broker-owned data; admins intentionally see all brokers. Cards use backend `matchCount` or `matchesFound`. Inventory loads the first 20 rows and exposes an incremental Load More action for subsequent pages. Tab counts use the API's aggregate `totalCount`, not the loaded array length.

A listing count opens Matches with `listingId`; a requirement count opens with `requirementId`. `resolveMatchSourceIds` protects this direction. Never pass one as the other.

### Matches and connection

`MatchesScreen` calls `GET /user-matches` with pagination, transaction type, and optional listing, requirement, or exact match ID. It supports infinite paging, refresh, quality tabs, source headers, and notification deep links.

`View Details` navigates to `MatchDetail`. The screen loads `GET /user-matches/matches/{matchId}/details`, shows the real listing and client requirement, renders persisted structured fields, and presents an authenticated photo/video gallery. Media bytes use bearer-authenticated `/user-matches/matches/{matchId}/media/{mediaId}` URLs; video opens in the in-app viewer. Missing media is an explicit empty state, never a stock image.

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
- Match details and media are visible to both brokers who are parties to the match. Broker name, phone, and email remain hidden until the API returns `isRevealed` with `unlockedContact`; notes can contain contact text and therefore rely on server redaction before reveal.
- Requestor sees waiting; only the receiving broker sees Accept/Reject.
- After the requestor confirms, the match card uses a highlighted, disabled `Unlock requested` action with `Waiting for other broker to accept`; it must not claim the contact is unlocked before a backend reveal exists.
- Rejection, expiration, or insufficient credit spends nothing.
- `credit_required` is not success.
- Refresh the wallet after a response that can reveal/charge.
- WhatsApp delivery for an unregistered broker is planned, not sent.
- Reading a notification does not accept a request.

See `MATCHING_FLOW_UI_CONTEXT.md` for detailed state/copy rules.

Match quality uses one product definition everywhere: 80–100 is Excellent, 60–79 is Good, and below 60 is Fair.

### Notifications, wallet, payments, upload

The active notification API uses numeric broker routes under `/brokers/{brokerId}/notifications`. Taps can deep-link to an exact match. Unread count polls every 30 seconds.

The Notifications screen refreshes on focus and silently every 15 seconds while visible. Broker A receives a distinct accepted/unlocked notification after Broker B accepts. Broker B's original request card also derives its presentation from the linked request status, so it becomes an accepted/handled card instead of continuing to ask for acceptance. Accepted cards use success styling and deep-link to the exact unlocked match.

Wallet and ledger use `/brokers/{brokerId}/wallet` and `/credit-transactions`. Packs use `/credit-packs`; Razorpay uses `/payment/order` and `/payment/verify`.

Bulk `.txt` ingestion uses the authenticated durable `/bulk-imports` workflow described above. The mobile app never calls the internal file-processor facade or receives its service key.

## Design system

The active authority is `src/theme/useAppTheme.ts` plus `src/constants/theme.ts`, not older hard-coded examples in `skills.md`.

- Brand blue `#2563EB`, teal `#10B981`, blue-to-teal primary gradient.
- Dynamic palettes provide surfaces, text, borders, and semantic colors.
- Reuse spacing, radius, font, card, shadow, button, and `PropSeekrLogo` tokens.
- Use safe areas, theme-aware status bars, accessibility labels, and all relevant loading/empty/error states.
- User strings belong in the English/Hindi/Marathi locale files.
- All user-facing app alerts use the global `AppAlertProvider` and `useAppAlert()` from `src/components/alerts/AppAlertProvider.tsx`. Do not add React Native `Alert.alert` calls. The shared modal preserves success/error/warning/info treatments, cancel/destructive buttons, and action callbacks. OS-owned runtime permission prompts remain native; any denial or follow-up message uses the app alert.

An older static `Colors` palette remains in shell/tab code. Prefer the dynamic system for new screens; do not introduce a third palette.

## Compatibility and known gaps

- `createRequirement()` calls nonexistent `/requirements/create`; the active form uses `addRequirement()`.
- Direct-reveal and legacy unlocked-history adapters have been removed. The active UI uses `confirmMatch()` only; a reveal record returned by canonical match reads is the sole contact authority.
- `admin.ts` exposes internal maintenance operations, not normal user actions.
- Property and requirement standalone detail screens are still placeholders; match detail is implemented and database-backed.
- Historical inventory without canonical locality coordinates is intentionally absent from nearby search until backfilled.
- Several non-marketplace DTOs still allow broad `any` shapes; narrow contracts instead of extending ambiguity.
- Android release currently uses debug signing.
- Android builds use the developer or CI environment's Java 17 and Node installations; do not commit machine-specific executable paths. React Native 0.85 uses the New Architecture by default.

## Build and verification

```bash
npm run start
npm test -- --runInBand
npm run lint
cd android
./gradlew assembleDebug
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
- `src/components/alerts/AppAlertProvider.tsx`: global branded alerts and confirmations.
- `MATCHING_FLOW_UI_CONTEXT.md`: detailed match UX contract.
