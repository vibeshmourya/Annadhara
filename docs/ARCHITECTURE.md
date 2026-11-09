# FoodBridge System Architecture & Specifications

**Tagline:** *Surplus Food. Shared Hope. Zero Waste.*

---

## 1. High-Level System Architecture

FoodBridge connects donors (restaurants, bakeries, caterers, hotels, canteens) with recipient charities/NGOs and delivery volunteers. Both the React.js web application and the Flutter mobile application interact with the exact same shared backend and database:

```
  ┌─────────────────────────┐             ┌─────────────────────────┐
  │     React.js Web App    │             │   Flutter Mobile App    │
  │ (Tailwind CSS, Vite)    │             │ (Dart, Material 3, QR)  │
  └────────────┬────────────┘             └────────────┬────────────┘
               │                                       │
               │ HTTP / JSON REST API                  │ HTTP / JSON REST API
               │ (Bearer JWT Auth)                     │ (Bearer JWT Auth)
               ▼                                       ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │              Node.js + Express.js REST API Server               │
  │                                                                 │
  │  • Auth & RBAC Middleware (Donor, Recipient, Volunteer, Admin)  │
  │  • Rate Limiting & Security Headers (Helmet, CORS)              │
  │  • Atomic Quantity Reservation Service                          │
  │  • 6-Character Verification Code & QR Handover Engine           │
  │  • Geospatial Distance & Expiry Urgency Ranking                 │
  │  • In-App Event Notifications & Immutable Audit Trail           │
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

A core architectural principle of FoodBridge is strict mathematical inventory integrity without oversubscription race conditions:

### Mathematical Invariants
Across any donation listing at all points in time:
$$\text{totalQuantity} = \text{availableQuantity} + \text{reservedQuantity} + \text{collectedQuantity}$$
$$\text{availableQuantity} \ge 0, \quad \text{reservedQuantity} \ge 0, \quad \text{collectedQuantity} \ge 0$$

### Quantity Definitions
- **`totalQuantity`**: The initial published quantity of surplus food.
- **`availableQuantity`**: The portion currently available for discovery and reservation requests.
- **`reservedQuantity`**: The portion committed to active pending or approved reservations awaiting pickup.
- **`collectedQuantity`**: The portion that has completed physical handover and has been rescued.

### Atomic State Transitions
1. **Initial Publication:**
   - `availableQuantity = totalQuantity`
   - `reservedQuantity = 0`
   - `collectedQuantity = 0`
   - `status = 'available'`
2. **Atomic Reservation (`reserveDonationQuantity`):**
   - Executed via atomic MongoDB query:
     ```javascript
     Donation.findOneAndUpdate(
       {
         _id: donationId,
         status: { $in: ['available', 'partially_reserved'] },
         pickupEndTime: { $gt: new Date() },
         availableQuantity: { $gte: requestedQuantity }
       },
       {
         $inc: { availableQuantity: -requestedQuantity, reservedQuantity: requestedQuantity }
       },
       { new: true }
     );
     ```
   - If `availableQuantity == 0`, status becomes `'fully_reserved'`.
   - If `availableQuantity > 0`, status becomes `'partially_reserved'`.
3. **Cancellation or Rejection (`releaseReservedQuantity`):**
   - If a reservation is rejected or cancelled before handover:
     `$inc: { availableQuantity: requestedQuantity, reservedQuantity: -requestedQuantity }`
   - Re-evaluates status back to `'available'` or `'partially_reserved'`.
4. **Handover Confirmation (`completeHandoverQuantity`):**
   - When the recipient/volunteer presents the 6-character code or QR:
     `$inc: { reservedQuantity: -requestedQuantity, collectedQuantity: requestedQuantity }`
   - If all food is collected, status becomes `'completed'`.

---

## 3. Database Schema Design

### 1. `User`
- `name`: String, required.
- `email`: String, unique, indexed.
- `passwordHash`: String, bcrypt hashed (salt rounds = 10).
- `phone`: String.
- `role`: Enum `['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN']`.
- `accountStatus`: Enum `['ACTIVE', 'INACTIVE', 'SUSPENDED']`.
- `organizationId`: ObjectId, ref `Organization`.
- `isVerified`: Boolean.

### 2. `Organization`
- `organizationName`: String, required, indexed.
- `organizationType`: Enum `['Restaurant', 'Hotel', 'College Canteen', 'Event Organizer', 'NGO', 'Food Distribution Organization', 'Other']`.
- `registrationNumber`: String.
- `address`: `{ street, city, state, postalCode }`.
- `verificationStatus`: Enum `['PENDING', 'VERIFIED', 'REJECTED']`.
- `verifiedBy`: ObjectId, ref `User`.
- `verifiedAt`: Date.
- `reviewerNotes`: String.

### 3. `Donation`
- `title`: String, required, indexed.
- `category`: Enum `['cooked_meals', 'bakery_grains', 'produce_fresh', 'packaged_groceries', 'dairy', 'beverages', 'prepared_catering', 'other']`.
- `description`: String.
- `totalQuantity`: Number, min 1.
- `availableQuantity`: Number, min 0.
- `reservedQuantity`: Number, min 0.
- `collectedQuantity`: Number, min 0.
- `unit`: Enum `['meals', 'kg', 'portions', 'boxes', 'liters', 'packs']`.
- `prepDateTime`: Date, required.
- `expiryDateTime`: Date, required, indexed.
- `storageHandling`: Enum `['room_temperature', 'refrigerated', 'frozen', 'hot_held']`.
- `allergens`: `[String]`.
- `pickupLocation`: `{ address: { street, city }, location: { type: 'Point', coordinates: [lng, lat] } }`.
- `pickupStartTime`: Date.
- `pickupEndTime`: Date, indexed.
- `status`: Enum `['available', 'partially_reserved', 'fully_reserved', 'completed', 'expired', 'cancelled']`.
- `donor`: ObjectId, ref `User`.

### 4. `Reservation`
- `donation`: ObjectId, ref `Donation`.
- `recipient`: ObjectId, ref `User`.
- `donor`: ObjectId, ref `User`.
- `requestedQuantity`: Number, min 1.
- `unit`: String.
- `status`: Enum `['pending', 'approved', 'rejected', 'completed', 'cancelled']`.
- `handoverCode`: String, unique, uppercase 6-char (e.g. `FB-8942`).
- `requestNotes`: String.
- `donorNotes`: String.

### 5. `PickupTask`
- `reservation`: ObjectId, ref `Reservation`.
- `donation`: ObjectId, ref `Donation`.
- `volunteer`: ObjectId, ref `User` (null when unassigned).
- `donor`: ObjectId, ref `User`.
- `recipient`: ObjectId, ref `User`.
- `status`: Enum `['pending', 'assigned', 'in_progress', 'collected', 'completed', 'cancelled']`.
- `pickupAddress`: Object.
- `deliveryAddress`: Object.
- `pickupWindowEnd`: Date.

### 6. `HandoverRecord`
- `reservation`: ObjectId, ref `Reservation`, unique index (prevents duplicate handover).
- `donation`: ObjectId, ref `Donation`.
- `donor`: ObjectId, ref `User`.
- `recipient`: ObjectId, ref `User`.
- `volunteer`: ObjectId, ref `User`.
- `quantityHandedOver`: Number.
- `unit`: String.
- `handoverCode`: String.
- `verificationMethod`: Enum `['code', 'qr']`.
- `confirmedByDonor`: Boolean.
- `confirmedByRecipient`: Boolean.

### 7. `Notification`
- `recipient`: ObjectId, ref `User`, indexed.
- `title`: String.
- `message`: String.
- `type`: String.
- `isRead`: Boolean, default false.
- `relatedId`: ObjectId.

### 8. `AuditLog`
- `action`: String, indexed.
- `user`: ObjectId, ref `User`.
- `role`: String.
- `entityType`: String.
- `entityId`: ObjectId.
- `details`: Mixed.
- `ipAddress`: String.
- `createdAt`: Date.

---

## 4. Security Architecture

1. **Password Protection**: Passwords are saved with bcrypt hashing (10 salt rounds) via virtual properties; plaintext passwords are never persisted.
2. **JWT Authentication**: Stateless Bearer tokens signed with HMAC-SHA256 and configurable expiration (`JWT_EXPIRES_IN=7d`).
3. **Server-Side Token Revocation**: Logouts execute `POST /api/auth/logout` storing the token hash in an in-memory TTL set. Reused tokens are rejected with `401 Unauthorized`.
4. **Role-Based Access Control (RBAC)**: Enforced via `protect` and `authorize('DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN')` middleware. Non-admins cannot invoke admin routes, and recipients cannot edit donor listings.
5. **Organization Verification Gate**: `requireVerifiedOrg` blocks recipients from reserving food until an administrator reviews and approves their organization.
6. **Rate Limiting**: In-memory IP-based rate limiter protects `/api/auth/login` and `/api/auth/register` against brute-force attacks.
7. **Security Headers**: Express uses `helmet()` to configure CSP, HSTS, and XSS filtering. CORS is restricted to authorized origins.
