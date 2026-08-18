# Match Unlock Flow (Module 4)

**CRITICAL BUSINESS LOGIC RULE:**

Always keep the following mutual handshake flow in mind when modifying code related to unlocking matches or contact details:

1. **Broker A (Requestor) finds a match** with Broker B's listing.
2. Broker A clicks **"Unlock Contact"**. 
3. This DOES NOT reveal the contact immediately. Instead, it hits the `confirmMatch` API (`/api/v1/matches/{match_id}/confirm`) to submit Broker A's pre-reveal checklist.
4. The match state moves to `PENDING` (pending confirmation), and a notification goes to Broker B. Broker A CANNOT see the contact yet.
5. **Broker B (Receiver) gets the notification** and clicks "Accept".
6. This hits the exact same `confirmMatch` API. 
7. ONLY AFTER Broker B accepts will the backend deduct tokens (1 from each) and unlock the contact details for BOTH brokers.

**Never bypass this two-step handshake by using the `/reveal` API for regular unlocking.** Always use the `confirm` API to ensure mutual consent.
