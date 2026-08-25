# PropSeekr Matching Flow — UI Context

## Purpose

PropSeekr connects a broker's property listing with another broker's client requirement.

A match only means the property and requirement are compatible. It does not mean the brokers are already connected, and it does not reveal either broker's contact details.

Contact details are revealed only after both brokers consent and the backend successfully deducts one token from each broker.

## Core Entities

- **Listing:** A property available for rent or sale.
- **Requirement:** A property requirement posted for a broker's client.
- **Match:** A record connecting one listing, one requirement, the two brokers, and a match score.
- **Connection request:** The mutual-consent process required before contact details are revealed.

Every match connects:

```text
Listing
  +
Requirement
  +
Listing broker
  +
Requirement broker
  +
Match score
```

## The Two Directions of the Flow

The same match can be opened from either side.

### Property listing to requirements

A property card represents supply.

Its match count means:

> The number of client requirements from other brokers that match this property.

When the broker selects the match count, the next screen should show the selected property at the top and its matching client requirements below it.

Recommended CTA copy:

```text
114 Matching Requirements
```

### Client requirement to properties

A requirement card represents demand.

Its match count means:

> The number of properties from other brokers that match this client requirement.

When the broker selects the match count, the next screen should show the selected requirement at the top and its matching properties below it.

Recommended CTA copy:

```text
707 Matching Properties
```

The shorter label `707 Matches` can be used where card width is limited, but the destination screen should make the direction clear.

## My Listings Screen

The inventory screen contains:

- Rental / Buy-Sell switch
- My Listings tab
- My Requirements tab
- Add Property action
- Add Requirement action
- Property and requirement cards
- Dynamic match-count CTA on every card

### Property card content

- Rental or Buy/Sell badge
- Property image
- Property title and configuration
- Location
- Price
- Active, Under Review, Rented, or Sold status
- Match count
- Views, when available
- Edit action

Property inventory API:

```http
GET /api/v1/listings/mine?page=1&limit=20&transactionType=RENTAL
```

The backend returns `matchCount`, calculated using the selected `listingId`.

### Requirement card content

- Client Requirement badge
- Requirement image or neutral placeholder
- Client requirement description
- Preferred location
- Budget
- Active or closed status
- Match count
- Edit action

Requirement inventory API:

```http
GET /api/v1/requirements/mine?page=1&limit=20&transactionType=BUY_SELL
```

The backend returns `matchesFound`, calculated using the selected `requirementId`.

## Opening the Matches Screen

Clicking a property match count sends the selected listing ID:

```http
GET /api/v1/user-matches?listingId={listingId}&page=1&limit=20
```

Clicking a requirement match count sends the selected requirement ID:

```http
GET /api/v1/user-matches?requirementId={requirementId}&page=1&limit=20
```

A notification deep link opens one exact match:

```http
GET /api/v1/user-matches?matchId={matchId}
```

The frontend must preserve whether the user entered through a listing or a requirement. A requirement ID must never be sent as a listing ID.

## Match Count and Pagination

The inventory card and Matches screen must use the same aggregate count from the backend.

For example:

```text
707 Total Matches
20 Currently Loaded
```

The API initially returns a maximum of 20 match cards because the results are paginated. This does not mean there are only 20 total matches.

The UI should:

- Display the server's `totalCount` as the total.
- Display or silently manage the number currently loaded.
- Load subsequent pages on scroll or through a Load More action.
- Never replace the aggregate count with the current array length.

## Matches Screen Context Header

The top section should preserve and summarize the source card.

### Entered through a property

```text
Your Property
2 BHK Apartment
Vijay Nagar
₹55L

Matching Client Requirements
114 Total Matches
```

Each result below represents another broker's client requirement.

### Entered through a requirement

```text
Your Client Requirement
Looking for 2 BHK Apartment
Vijay Nagar
Budget ₹60L

Matching Properties
707 Total Matches
```

Each result below represents another broker's property listing.

Avoid the generic message `Brokers interested in your property` when the source is a requirement. Use role-aware copy.

## Match Quality Filters

The backend score bands are:

| Quality | Score |
|---|---:|
| Excellent | 90–100 |
| Good | 75–89 |
| Fair | Below 75 or unavailable |

These definitions should be used consistently for badges, tabs, counts, and filtering.

Suggested tabs:

- All Matches
- Excellent
- Good
- Fair
- Unlocked

## Match Result Card

Before contacts are unlocked, a card can display:

- Match score
- Excellent, Good, or Fair badge
- Property or requirement summary
- Location
- Price or budget
- Size and configuration
- Match date
- Hidden broker name
- Masked phone number
- Connection status
- Primary action

Contact details must not be inferred from other API fields or shown before a reveal record exists.

### Recommended action states

| State | Primary UI |
|---|---|
| New match | Unlock Contact |
| Request sent by current broker | Waiting for Response |
| Incoming request | Accept and Reject |
| Token problem | Retry Connection / Add Tokens |
| Accepted and revealed | Call Broker / View Contact |
| Rejected | Request Declined |
| Expired | Request Expired / Send Again |

## End-to-End Connection Flow

```text
Broker A opens a match
        ↓
Broker A selects Unlock Contact
        ↓
Connection request is created
        ↓
Broker B receives a notification
        ↓
Broker B opens the exact match
      ↙   ↘
  Reject   Accept
     ↓       ↓
 No charge  Validate both wallets
             ↓
      Deduct 1 token from each
             ↓
        Reveal both contacts
             ↓
    Notify Broker A: Accepted
```

## Step 1 — Send Connection Request

Broker A selects `Unlock Contact`.

The request confirmation UI should explain:

- A connection request will be sent to the other broker.
- Contact details will not be revealed yet.
- Tokens will not be deducted yet.
- One token from each broker is deducted only after both brokers agree and contact reveal succeeds.

API:

```http
POST /api/v1/user-matches/matches/{matchId}/confirm
```

Payload:

```json
{
  "matchId": 500,
  "availabilityConfirmed": true,
  "priceValid": true,
  "priceNegotiable": false,
  "readyToConnect": true
}
```

After the first confirmation:

- Match state becomes `pending_confirmation`.
- Connection request state becomes `pending`.
- A four-hour response window begins.
- Broker A sees `Waiting for Response`.
- No token is deducted.
- Contact details remain hidden.

## Registered and Unregistered Brokers

The backend checks whether the receiving broker is connected to a PropSeekr user account.

### Registered broker

- Create an in-app notification.
- Notification opens the exact match.
- Broker can accept or reject inside the app.

### Unregistered broker

The UI should state:

> This broker is not currently registered on PropSeekr. WhatsApp notification support is planned.

WhatsApp integration is not currently active. Do not display `WhatsApp message sent`.

Recommended status:

```text
WhatsApp delivery planned
```

## Incoming Request Notification

Broker B receives:

```text
Another broker wants to connect regarding this match.
```

Selecting the notification should:

1. Mark the notification as read.
2. Open the Matches tab.
3. Load the exact `matchId`.
4. Display Accept and Reject actions.

Notification read/unread status is separate from the connection request status. Reading a notification does not accept the request.

## Accept Request

The receiving broker reviews a modal or bottom sheet.

### Receiving broker owns the property

Confirm:

- Property is still available.
- Price is still valid.
- Property or price is negotiable: Yes or No.
- Broker is ready to connect.

### Receiving broker owns the client requirement

Confirm:

- Client requirement is still active.
- Budget is still valid.
- Budget is negotiable: Yes or No.
- Broker is ready to connect.

The sheet must clearly state:

> One token will be deducted from each broker only when both confirmations and contact reveal succeed.

Broker B accepts through the same confirmation endpoint:

```http
POST /api/v1/user-matches/matches/{matchId}/confirm
```

The mobile UI must not directly call the reveal API as part of the regular unlock journey. The backend owns the mutual-confirmation and reveal transaction.

## Successful Acceptance

The backend atomically:

1. Validates both broker confirmations.
2. Validates that both wallets contain at least one token.
3. Creates the reveal record.
4. Deducts one token from Broker A.
5. Deducts one token from Broker B.
6. Creates both token ledger entries.
7. Marks the connection request `accepted`.
8. Reveals contact details to both brokers.
9. Marks the incoming request notification handled.
10. Sends an accepted notification to Broker A.

Broker A receives:

```text
Your request has been accepted. You can now connect with the other broker.
```

The unlocked UI can show:

- Broker name
- Phone number
- Email, when available
- Call action
- Accepted/unlocked status
- Updated token balance

The system must never charge only one broker or reveal contact details to only one side.

## Insufficient Token State

If either broker has insufficient tokens:

- Do not reveal contacts.
- Do not partially deduct tokens.
- Set the connection request to `credit_required`.
- Explain that both brokers need one token.
- Offer `Add Tokens` or `Retry Connection` where appropriate.

Acceptance must not be presented as successful until both deductions and contact reveal complete.

## Reject Request

The receiving broker can select `Reject Request`.

Recommended reasons:

- Property unavailable
- Price or budget changed
- Client requirement closed
- Deal already closed
- Incorrect match
- Other

When `Other` is selected, additional text is required.

API:

```http
POST /api/v1/user-matches/matches/{matchId}/reject
```

Example payload:

```json
{
  "matchId": 500,
  "connectionRequestId": 91,
  "reasonCode": "PRICE_CHANGED",
  "reasonText": "The owner changed the expected price."
}
```

After rejection:

- No tokens are deducted.
- Contact details remain hidden.
- Connection request becomes `rejected`.
- Pending confirmations are cleared.
- Broker A receives a rejected notification.
- The underlying match may remain available for a future request if it is still valid.

## Expiration

The confirmation window is four hours.

If Broker B does not respond:

- Request becomes expired.
- No tokens are deducted.
- Contact details remain hidden.
- Broker A sees `Request Expired`.
- The UI can offer `Send Again`.

## Separate State Models

The UI must not combine notification state with connection state.

### Match state

```text
matched
pending_confirmation
confirmed
revealed
expired
```

### Connection request state

```text
pending
accepted
rejected
expired
credit_required
```

### Notification delivery/read state

```text
pending
sent
delivered
failed
read
```

Examples:

- A notification can be read while its connection request remains pending.
- A connection request is accepted only after reveal and both token deductions succeed.
- A planned WhatsApp delivery is not equivalent to a sent notification.

## Notification Types

The UI should support:

- New match
- Incoming unlock request
- Request accepted
- Request rejected
- Confirmation window expired
- Credit required

Accepted and rejected notifications should open the exact match but should not show an Accept CTA.

## API Summary

```http
# Inventory
GET /api/v1/listings/mine
GET /api/v1/requirements/mine

# Match results
GET /api/v1/user-matches?listingId={listingId}
GET /api/v1/user-matches?requirementId={requirementId}
GET /api/v1/user-matches?matchId={matchId}

# Connection actions
POST /api/v1/user-matches/matches/{matchId}/confirm
POST /api/v1/user-matches/matches/{matchId}/reject

# Notifications
GET /api/v1/brokers/{brokerId}/notifications
PATCH /api/v1/brokers/{brokerId}/notifications/{notificationId}/read
POST /api/v1/brokers/{brokerId}/notifications/mark-all-read
```

## Required UI Designs

1. My Listings/My Requirements inventory screen.
2. Property card with a matching-requirements count.
3. Requirement card with a matching-properties count.
4. Source-specific Matches screen.
5. Hidden-contact match card.
6. Send connection request sheet.
7. Waiting-for-response state.
8. Incoming request notification.
9. Accept checklist sheet.
10. Reject reason sheet.
11. Credit-required state.
12. Accepted/contact-unlocked state.
13. Rejected state.
14. Expired state.
15. Unregistered broker/WhatsApp-planned state.
16. Loading, empty, API error, and paginated-loading states.

## UX Principles

- Matching discovers compatible supply and demand.
- Unlocking is a separate mutual-consent transaction.
- Never reveal contact details before both brokers confirm.
- Never deduct tokens when only one broker has confirmed.
- Never partially charge only one broker.
- Use role-aware property-versus-requirement copy.
- Keep aggregate match counts separate from paginated loaded counts.
- Do not claim a WhatsApp message was sent until WhatsApp integration is active.
- Explain token consequences before the user confirms.
- Make waiting, accepted, rejected, expired, and credit-required states visually distinct.
