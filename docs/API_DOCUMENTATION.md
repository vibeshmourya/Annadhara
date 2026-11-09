# FoodBridge REST API Documentation

**Tagline:** *Surplus Food. Shared Hope. Zero Waste.*  
**Base URL:** `http://localhost:5000/api`  
**Authentication Scheme:** Bearer JWT in `Authorization` header (`Bearer <token>`).

---

## 1. Authentication & User Profile

### Register User
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Elena Rostova",
  "email": "elena@sunrisebakery.com",
  "password": "Password@123",
  "role": "donor",
  "phone": "+1 (555) 882-9341",
  "organizationName": "Sunrise Artisanal Bakery",
  "organizationType": "bakery"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "67cf6a...",
      "name": "Elena Rostova",
      "email": "elena@sunrisebakery.com",
      "role": "donor",
      "organization": {
        "_id": "67cf6b...",
        "name": "Sunrise Artisanal Bakery",
        "type": "bakery",
        "verificationStatus": "verified"
      }
    }
  }
}
```

### Login User
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "donor@greengarden.com",
  "password": "Donor@123"
}
```

### Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Access:** Authenticated (Any role)

### Update User Profile
- **Endpoint:** `PUT /api/auth/profile`
- **Access:** Authenticated
- **Body:** `{ "name": "...", "phone": "...", "address": { ... } }`

---

## 2. Organization Management

### Get Organizations
- **Endpoint:** `GET /api/organizations`
- **Access:** Authenticated
- **Query Params:** `status=verified|pending|rejected`, `type=restaurant|ngo|...`

### Verify Organization (Admin only)
- **Endpoint:** `PATCH /api/organizations/:id/verify`
- **Access:** Admin only
- **Body:** `{ "status": "verified" | "rejected", "notes": "Approved tax-exempt non-profit" }`

---

## 3. Surplus Food Donations

### Discover Available Food
- **Endpoint:** `GET /api/donations`
- **Access:** Public / Authenticated
- **Query Params:**
  - `category`: `cooked_meals`, `bakery_grains`, `produce_fresh`, `packaged_groceries`, `dairy`, `prepared_catering`, `other`
  - `search`: Keyword string matching title, description, or city
  - `lat`, `lng`: Coordinates for geospatial proximity ranking
  - `status`: `available`, `partially_reserved`, `completed`

### Create Food Donation
- **Endpoint:** `POST /api/donations`
- **Access:** Donors & Admins
- **Body:**
```json
{
  "title": "40 Portions Vegetarian Lunch Trays",
  "category": "cooked_meals",
  "description": "Prepared fresh today. Sealed in aluminum catering containers.",
  "totalQuantity": 40,
  "unit": "meals",
  "prepDateTime": "2026-11-09T10:00:00Z",
  "expiryDateTime": "2026-11-09T20:00:00Z",
  "storageHandling": "hot_held",
  "allergens": ["Dairy"],
  "pickupLocation": {
    "address": { "street": "425 Garden Way", "city": "Metropolis" },
    "location": { "type": "Point", "coordinates": [-73.9912, 40.7258] }
  },
  "pickupStartTime": "2026-11-09T11:00:00Z",
  "pickupEndTime": "2026-11-09T17:00:00Z",
  "imageUrl": "https://...",
  "safetyGuidelinesAccepted": true
}
```

### View Donor's Own Listings
- **Endpoint:** `GET /api/donations/my-donations`
- **Access:** Donors & Admins

### Report Listing for Food Safety Concern
- **Endpoint:** `POST /api/donations/:id/report`
- **Access:** Authenticated
- **Body:** `{ "reason": "Expired food or bad odor", "details": "Observed off-temperature food." }`

---

## 4. Reservation System (Atomic Oversubscription Protection)

### Request Food Reservation
- **Endpoint:** `POST /api/reservations`
- **Access:** Verified Recipients & Admins
- **Body:**
```json
{
  "donationId": "67cf6a...",
  "requestedQuantity": 15,
  "requestNotes": "For evening family shelter feeding program"
}
```
- **Backend Rules:**
  - Strictly validates that `availableQuantity >= requestedQuantity`.
  - Atomically decrements `availableQuantity` and increments `reservedQuantity`.
  - Generates secure unique 6-character `handoverCode` (e.g. `FB-7294`).
  - Creates status `pending` and notifies the donor.

### Donor Approve or Reject Reservation
- **Endpoint:** `PATCH /api/reservations/:id/status`
- **Access:** Listing Donor & Admin
- **Body:**
```json
{
  "status": "approved",
  "donorNotes": "Side kitchen door pickup. Please bring thermal bag."
}
```
- **If Approved:** Automatically generates coordinated `PickupTask`.
- **If Rejected:** Atomically restores reserved quantity back to `availableQuantity` pool!

### Cancel Reservation
- **Endpoint:** `POST /api/reservations/:id/cancel`
- **Access:** Recipient, Donor, or Admin
- **Body:** `{ "reason": "Change in collection schedule" }`
- **Backend Invariant:** Automatically restores quantity to available pool and cancels open pickup tasks.

---

## 5. Pickup & Logistics Management

### Get Pickup Tasks
- **Endpoint:** `GET /api/pickups`
- **Access:** Authenticated (Volunteers view assigned and unclaimed missions; Donors/Recipients view their tasks)

### Volunteer Claims Task
- **Endpoint:** `POST /api/pickups/:id/claim`
- **Access:** Volunteers & Admins

### Update Transport Progress
- **Endpoint:** `PATCH /api/pickups/:id/status`
- **Access:** Assigned Volunteer, Donor, Recipient, Admin
- **Body:** `{ "status": "in_progress" | "collected" | "completed" }`

---

## 6. Food Handover Confirmation (Zero Waste Invariant)

### Confirm Handover
- **Endpoint:** `POST /api/handover/confirm`
- **Access:** Listing Donor, Recipient, or Assigned Volunteer
- **Body:**
```json
{
  "reservationId": "67cf6a...",
  "handoverCode": "FB-7294",
  "notes": "Verified in thermal containers",
  "verificationMethod": "code"
}
```
- **Backend Processing:**
  - Verifies exact match of `handoverCode`.
  - Creates unique `HandoverRecord`.
  - Atomically decrements `reservedQuantity` and increments `collectedQuantity` on `Donation`.
  - Marks `Reservation` and `PickupTask` as `completed`.
  - Broadcasts success notifications to all parties.

---

## 7. In-App Notifications

- `GET /api/notifications`: Retrieve current user notifications and unread badge count.
- `PATCH /api/notifications/:id/read`: Mark single notification as read.
- `PATCH /api/notifications/mark-all-read`: Mark all notifications as read.

---

## 8. Database-Driven Dashboards & Admin Operations

- `GET /api/dashboard/stats`: Returns role-specific real metrics from actual database collections.
- `GET /api/admin/users`: Search, filter, and review users.
- `PATCH /api/admin/users/:id/status`: Activate or deactivate user accounts.
- `GET /api/admin/reported-donations`: Review listings flagged by the community.
- `PATCH /api/admin/donations/:id/resolve-report`: Dismiss report or cancel unsafe listing.
- `GET /api/admin/audit-logs`: Inspect comprehensive platform audit history.

