# Annadhara REST API Documentation

**Project Title:** Annadhara | **Team:** Team Seva Shakti (MERNOVA X 2026)  
**Version:** 1.0.0  
**Base URL:**
- Web / Desktop Development: `http://localhost:5000/api`
- Android Emulator: `http://10.0.2.2:5000/api`
- Production: `https://api.annadhara.org/api`

---

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` HTTP header:

```http
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. System Health
- **`GET /api/health`**
  - **Access:** Public
  - **Response (200):**
    ```json
    {
      "success": true,
      "message": "Annadhara API service is active",
      "status": "online",
      "database": {
        "status": "connected",
        "readyState": 1
      },
      "timestamp": "2026-11-09T14:24:00.425Z"
    }
    ```

---

### 2. Authentication
- **`POST /api/auth/register`**
  - **Access:** Public (Admin registration blocked)
  - **Body:**
    ```json
    {
      "name": "Green Bistro",
      "email": "donor@greenbistro.com",
      "password": "Password@123",
      "role": "DONOR",
      "phone": "+1-555-0199",
      "organizationName": "Green Bistro LLC",
      "organizationType": "Restaurant",
      "registrationNumber": "TAX-99214",
      "address": { "street": "42 Market St", "city": "Metropolis" }
    }
    ```
- **`POST /api/auth/login`**
  - **Access:** Public
  - **Body:** `{ "email": "donor@greenbistro.com", "password": "Password@123" }`
  - **Response (200):** Returns `{ token, user }`.
- **`GET /api/auth/me`**
  - **Access:** Authenticated
  - **Response (200):** Returns current user account and linked organization.
- **`POST /api/auth/logout`**
  - **Access:** Authenticated
  - **Response (200):** Revokes token on server and clears active session.

---

### 3. User Profile
- **`GET /api/users/me`** (Alias: `GET /api/users/profile`)
  - **Access:** Authenticated
- **`PATCH /api/users/me`** (Aliases: `PUT /api/users/me`, `PUT /api/users/profile`)
  - **Access:** Authenticated
  - **Body:** `{ "name": "Updated Name", "phone": "+1-555-0200" }`

---

### 4. Organizations
- **`POST /api/organizations`**
  - **Access:** Authenticated (Donor / Recipient)
  - **Body:**
    ```json
    {
      "name": "Community Food Pantry",
      "type": "NGO",
      "registrationNumber": "NGO-88219",
      "address": { "street": "12 Charity Lane", "city": "Metropolis" }
    }
    ```
- **`GET /api/organizations/me`**
  - **Access:** Authenticated
- **`PATCH /api/organizations/:id/verify`**
  - **Access:** Admin only
  - **Body:** `{ "status": "VERIFIED", "reviewerNotes": "Documents approved" }`

---

### 5. Food Donations
- **`GET /api/donations`**
  - **Access:** Public / Optional Auth
  - **Query Params:** `category`, `search`, `limit`, `page`
- **`GET /api/donations/my-donations`** (Alias: `GET /api/donations/my`)
  - **Access:** Donor / Admin
- **`GET /api/donations/:id`**
  - **Access:** Authenticated
- **`POST /api/donations`**
  - **Access:** Donor / Admin
  - **Body:**
    ```json
    {
      "title": "25 Trays Veggie Pasta",
      "category": "cooked_meals",
      "description": "Freshly cooked pasta packaged in heat-sealed containers",
      "totalQuantity": 25,
      "unit": "meals",
      "storageHandling": "hot_held",
      "allergens": ["gluten", "dairy"],
      "prepDateTime": "2026-11-09T12:00:00Z",
      "pickupStartTime": "2026-11-09T13:00:00Z",
      "pickupEndTime": "2026-11-09T19:00:00Z",
      "expiryDateTime": "2026-11-10T00:00:00Z",
      "pickupLocation": {
        "address": { "street": "425 Garden Way", "city": "Metropolis" },
        "location": { "type": "Point", "coordinates": [-73.99, 40.73] }
      },
      "safetyGuidelinesAccepted": true
    }
    ```
- **`PUT /api/donations/:id`**
  - **Access:** Donor (Owner) / Admin
- **`DELETE /api/donations/:id`**
  - **Access:** Donor (Owner) / Admin
- **`POST /api/donations/:id/report`**
  - **Access:** Authenticated

---

### 6. Reservations
- **`POST /api/reservations`**
  - **Access:** Verified Recipient / Admin
  - **Body:**
    ```json
    {
      "donationId": "6af1d794c1789d86f45f9071",
      "requestedQuantity": 10,
      "requestNotes": "For evening community soup kitchen"
    }
    ```
- **`GET /api/reservations`**
  - **Access:** Authenticated (Role-aware: Recipients get their requests; Donors get incoming requests for their food; Admins get all).
- **`PATCH /api/reservations/:id/status`**
  - **Access:** Donor (Owner) / Admin
  - **Body:** `{ "status": "approved" }` or `{ "status": "rejected", "donorNotes": "Capacity full" }`
- **`POST /api/reservations/:id/cancel`**
  - **Access:** Recipient / Donor / Admin
  - **Body:** `{ "reason": "No longer needed" }`

---

### 7. Pickups & Volunteers
- **`GET /api/pickups`**
  - **Access:** Volunteer / Admin
  - **Query Params:** `view=available` (unassigned) or `view=my` (assigned to caller)
- **`POST /api/pickups/:id/claim`**
  - **Access:** Volunteer
- **`PATCH /api/pickups/:id/status`**
  - **Access:** Assigned Volunteer / Admin
  - **Body:** `{ "status": "in_progress" | "collected" | "completed" }`

---

### 8. Handover Verification
- **`POST /api/handover/confirm`**
  - **Access:** Donor / Recipient / Volunteer / Admin
  - **Body:**
    ```json
    {
      "reservationId": "by_code",
      "handoverCode": "FB-8942",
      "notes": "Verified via mobile app",
      "verificationMethod": "code"
    }
    ```
- **`GET /api/handover/reservation/:reservationId`**
  - **Access:** Authenticated parties

---

### 9. Notifications
- **`GET /api/notifications`**
  - **Access:** Authenticated
- **`PATCH /api/notifications/:id/read`**
  - **Access:** Authenticated
- **`PATCH /api/notifications/read-all`** (Alias: `PATCH /api/notifications/mark-all-read`)
  - **Access:** Authenticated

---

### 10. Dashboard Analytics
- **`GET /api/dashboard/stats`**
  - **Access:** Authenticated (Returns role-tailored real DB stats for DONOR, RECIPIENT, VOLUNTEER, or ADMIN)

---

### 11. Admin Governance
- **`GET /api/admin/organizations`**
  - **Access:** Admin only
- **`PATCH /api/admin/organizations/:id/verification`** (Alias: `PATCH /api/admin/organizations/:id/verify`)
  - **Access:** Admin only
  - **Body:** `{ "status": "VERIFIED" | "REJECTED", "reviewerNotes": "..." }`
- **`GET /api/admin/users`**
  - **Access:** Admin only
- **`PATCH /api/admin/users/:id/status`**
  - **Access:** Admin only
  - **Body:** `{ "accountStatus": "ACTIVE" | "INACTIVE" }`
- **`GET /api/admin/audit-logs`**
  - **Access:** Admin only

