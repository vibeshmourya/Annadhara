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
      "title": "30 Plates Fresh Veg Biryani & Dal",
      "category": "rice_meals",
      "dietaryType": "Vegetarian",
      "description": "Prepared fresh in commercial kitchen, packed in sealed aluminum trays",
      "totalQuantity": 30,
      "unit": "plates",
      "storageHandling": "hot_held",
      "allergens": ["dairy"],
      "pickupStartTime": "2026-11-18T13:00:00Z",
      "pickupEndTime": "2026-11-18T19:00:00Z",
      "imageUrl": "/uploads/donations/donation-1795008686969-203a3008eab5.png",
      "pickupLocation": {
        "address": {
          "street": "124, 1st Cross, Indiranagar",
          "areaLocality": "Indiranagar",
          "city": "Bengaluru",
          "district": "Bengaluru Urban",
          "state": "Karnataka",
          "postalCode": "560038",
          "country": "India"
        },
        "location": { "type": "Point", "coordinates": [77.6412, 12.9719] }
      },
      "safetyGuidelinesAccepted": true
    }
    ```
  - **Note on Dates:** `prepDateTime` and `expiryDateTime` are optional and managed automatically. Donors only provide the operational `pickupStartTime` and `pickupEndTime` window.
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

---

### 12. Image Upload & Validation
- **`POST /api/upload/image`**
  - **Access:** Authenticated
  - **Content-Type:** `multipart/form-data`
  - **Form Field:** `image` (JPEG, JPG, PNG, or WebP; maximum 5 MB)
  - **Response (201):**
    ```json
    {
      "success": true,
      "message": "Image uploaded successfully",
      "data": {
        "url": "/uploads/donations/donation-1795008686969-203a3008eab5.png",
        "filename": "donation-1795008686969-203a3008eab5.png",
        "mimetype": "image/png",
        "size": 70
      }
    }
    ```
- **`POST /api/upload/validate-url`**
  - **Access:** Authenticated
  - **Body:** `{ "url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" }`
  - **Security:** Blocks SSRF attempts to private networks or localhost.
  - **Response (200):**
    ```json
    {
      "success": true,
      "message": "Image URL is valid",
      "data": {
        "url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
      }
    }
    ```
- **Static Assets:** Accessible at `GET /uploads/donations/:filename` (CORS and cross-origin resource policy enabled).

