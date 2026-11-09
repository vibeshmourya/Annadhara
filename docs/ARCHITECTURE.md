# FoodBridge System Architecture & Specifications

**Tagline:** *Surplus Food. Shared Hope. Zero Waste.*

---

## 1. High-Level System Architecture

Both the React Web Application and the Flutter Mobile Application interact with the exact same shared backend and database:

```
  ┌─────────────────────────┐             ┌─────────────────────────┐
  │     React.js Web App    │             │   Flutter Mobile App    │
  │ (Tailwind CSS, Chart.js)│             │  (Dart, QR Code, Dio)   │
  └────────────┬────────────┘             └────────────┬────────────┘
               │                                       │
               │ HTTP / JSON REST API                  │ HTTP / JSON REST API
               │ (Bearer JWT Auth)                     │ (Bearer JWT Auth)
               ▼                                       ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │              Node.js + Express.js REST API Server               │
  │                                                                 │
  │  • Auth & RBAC Middleware (Donor, Recipient, Volunteer, Admin)   │
  │  • Atomic Quantity Reservation Service                          │
  │  • 6-Character Verification Code & QR Handover Engine           │
  │  • Explainable Geospatial Distance & Expiry Ranking             │
  │  • In-App Event Notifications & Audit Trail                     │
  └────────────────────────────────┬────────────────────────────────┘
                                   │
                                   │ Mongoose ODM
                                   ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                         MongoDB Database                        │
  │                                                                 │
  │  Collections:                                                   │
  │  1. Users             5. PickupTasks                            │
  │  2. Organizations     6. HandoverRecords                        │
  │  3. Donations         7. Notifications                          │
  │  4. Reservations      8. AuditLogs                              │
  └─────────────────────────────────────────────────────────────────┘
```

---

## 2. Quantity Management & Zero-Waste Invariants

A key architectural requirement of FoodBridge is strict mathematical inventory integrity without oversubscription race conditions:

### Mathematical Invariants
At all times across any donation listing:
$$\text{totalQuantity} = \text{availableQuantity} + \text{reservedQuantity} + \text{collectedQuantity}$$
$$\text{collectedQuantity} \le \text{reservedQuantity} + \text{collectedQuantity} \le \text{totalQuantity}$$
$$\text{availableQuantity} \ge 0, \quad \text{reservedQuantity} \ge 0, \quad \text{collectedQuantity} \ge 0$$

### Atomic State Transitions
1. **Initial Publication:**
   - `availableQuantity = totalQuantity`
   - `reservedQuantity = 0`
   - `collectedQuantity = 0`
   - `status = 'available'`

2. **Reservation Request (Atomic Check & Decrement):**
   ```javascript
   Donation.findOneAndUpdate(
     {
       _id: donationId,
       status: { $in: ['available', 'partially_reserved'] },
       pickupEndTime: { $gt: new Date() },
       availableQuantity: { $gte: requestedQuantity } // Atomic guarantee
     },
     {
       $inc: {
         availableQuantity: -requestedQuantity,
         reservedQuantity: requestedQuantity
       }
     }
   );
   ```
   If two recipients submit requests concurrently for the last 10 meals, MongoDB evaluates the condition atomically; exactly one succeeds and the other is safely rejected with an informative error message.

3. **Cancellation or Rejection (Atomic Quantity Restoration):**
   ```javascript
   Donation.findOneAndUpdate(
     { _id: donationId },
     {
       $inc: {
         availableQuantity: requestedQuantity,
         reservedQuantity: -requestedQuantity
       }
     }
   );
   ```
   Releases food back to the public discovery pool immediately.

4. **Handover Confirmation (Final Zero-Waste Collection):**
   ```javascript
   Donation.findOneAndUpdate(
     { _id: donationId },
     {
       $inc: {
         reservedQuantity: -requestedQuantity,
         collectedQuantity: requestedQuantity
       }
     }
   );
   ```

---

## 3. Role-Based Access Control (RBAC) Matrix

| Action / Capability | Donor | Recipient NGO | Volunteer | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Register & Log In | ✅ | ✅ | ✅ | ✅ |
| Publish Food Donation | ✅ | ❌ | ❌ | ✅ |
| Edit Owned Donation | ✅ | ❌ | ❌ | ✅ |
| Discover & Filter Food | ✅ | ✅ | ✅ | ✅ |
| Request Food Reservation | ❌ | ✅ (Verified) | ❌ | ✅ |
| Approve / Reject Requests | ✅ | ❌ | ❌ | ✅ |
| Cancel Reservation | ✅ | ✅ | ❌ | ✅ |
| Browse Unassigned Pickups | ❌ | ❌ | ✅ | ✅ |
| Claim Pickup Mission | ❌ | ❌ | ✅ | ✅ |
| Update Transport Milestone | ✅ | ✅ | ✅ | ✅ |
| Verify Handover Code / QR | ✅ | ✅ | ✅ | ✅ |
| In-App Notification Stream | ✅ | ✅ | ✅ | ✅ |
| Verify Organization Credentials | ❌ | ❌ | ❌ | ✅ |
| Manage Reported Food Listings | ❌ | ❌ | ❌ | ✅ |
| Platform Audit Logs | ❌ | ❌ | ❌ | ✅ |

---

## 4. Privacy Masking & Food Safety Principles

1. **Address Privacy Protection:**
   In general discovery mode (`GET /api/donations`), specific street address details are masked as `"Available upon reservation approval"` to protect donor premises until an NGO reservation is approved.

2. **Food Safety Declarations:**
   Every donation requires:
   - Preparation timestamp
   - Definite pickup deadline
   - Storage handling classification (`hot_held`, `refrigerated`, `room_temperature`, `frozen`)
   - Allergen declarations (`Dairy`, `Gluten`, `Nuts`, `Eggs`, etc.)
   - Mandatory affirmative confirmation of hygienic preparation protocols.

3. **Community Reporting & Auto-Flagging:**
   Any authenticated user can report suspicious, expired, or off-temperature listings. Listings receiving multiple reports are automatically withheld from the discovery feed pending administrator review.

