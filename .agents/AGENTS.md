# PropSeekr mobile working rules

Read `BRAIN.md` and `MATCHING_FLOW_UI_CONTEXT.md` before changing this repository. Update `BRAIN.md` whenever a change alters a journey, API contract, navigation route, persisted state, integration, or build requirement.

- The user GUID is the account identity; numeric broker ID owns listings, requirements, wallet, notifications, and matches.
- Admin inventory and match reads intentionally include every broker but remain filtered and paginated.
- Listing counts open matches with `listingId`; requirement counts use `requirementId`. Never interchange them.
- Aggregate totals come from API metadata, not loaded array length.
- Regular unlocking always calls `POST /api/v1/user-matches/matches/{matchId}/confirm`. The first broker requests and the second accepts through the same endpoint.
- Never bypass mutual confirmation with a direct reveal call. Never show contacts without backend reveal/contact fields.
- One token is deducted from each broker only after both confirm and atomic reveal succeeds. Waiting, rejection, expiration, and insufficient credit are not unlocks.
- WhatsApp delivery is planned, not active. Never say a message was sent.
- Refresh wallet state from the backend after token-affecting actions.
- Google map rendering, geocoding, GPS, and backend locality persistence are separate. Never commit keys or secrets.
- Keep API calls in `src/api`, shared state in stores/services, and styling in the current theme system.

Run focused tests plus lint/build appropriate to each change. Preserve loading, empty, error, pagination, accessibility, and light/dark states.
