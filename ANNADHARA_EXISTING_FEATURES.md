# Annadhara — Existing Features & Capabilities Inventory
**Project:** Annadhara (Surplus Food Rescue & Intelligent Distribution Network)  
**Team:** Team Seva Shakti (MERNOVA X 2026)  
**Document Type:** Baseline Feature Architecture & Capability Inventory  
**Status:** Living Documentation (Phase 0 Baseline)  

---

## 1. Executive Summary

Annadhara is a production-grade, multi-role food rescue and redistribution network connecting commercial food donors (restaurants, bakeries, caterers, hotels), verified recipient organizations (NGOs, food banks, shelters), community volunteers, and platform administrators. 

The ecosystem consists of:
1. **Shared REST API Backend**: Node.js, Express.js, MongoDB (Mongoose ODM), JWT Authentication, Helmet, Winston/Morgan logging.
2. **Web Application**: React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons, Chart.js, `qrcode.react`, native `BarcodeDetector` camera scanner.
3. **Mobile Application**: Flutter (Material 3), Dart, Provider state management, `http`, `qr_flutter`, `shared_preferences`.

---

## 2. User Roles & Access Control Hierarchy

Annadhara strictly enforces Role-Based Access Control (RBAC) across four authenticated user roles. Role tokens are normalized to uppercase (`'DONOR'`, `'RECIPIENT'`, `'VOLUNTEER'`, `'ADMIN'`):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ANNADHARA RBAC MATRIX                           │
├─────────────────────┬──────────────┬──────────────┬──────────────┬──────────┤
│ Capability / Scope  │    DONOR     │  RECIPIENT   │  VOLUNTEER   │  ADMIN   │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────┤
│ Register Account    │      ✓       │      ✓       │      ✓       │ Restricted
│ Submit Organization │      ✓       │      ✓ (Req) │      —       │    Full  │
│ Verify Organization │      —       │      —       │      —       │     ✓    │
│ Publish Donation    │      ✓       │      —       │      —       │     ✓    │
│ Edit/Cancel Donation│   Own Only   │      —       │      —       │    Full  │
│ Browse Donations    │      ✓       │      ✓       │      ✓       │     ✓    │
│ Reserve Food        │      —       │  Verified Org│      —       │     ✓    │
│ Approve Reservation │   Own Only   │      —       │      —       │    Full  │
│ Reject Reservation  │   Own Only   │      —       │      —       │    Full  │
│ Claim Pickup Task   │      —       │      —       │      ✓       │    Full  │
│ Update Pickup Trip  │      —       │      —       │   Assigned   │    Full  │
│ Confirm Pickup (FB) │   Own Donor  │      —       │   Assigned   │    Full  │
│ Verify Delivery(DL) │      —       │      —       │   Assigned   │    Full  │
│ View Audit Trail    │      —       │      —       │      —       │     ✓    │
│ Deactivate Users    │      —       │      —       │      —       │     ✓    │
└─────────────────────┴──────────────┴──────────────┴──────────────┴──────────┘
```

---

## 3. Detailed Feature Breakdown by Functional Domain

### 3.1 Authentication & Profile Management
- **Registration (`POST /api/auth/register`)**: Supports role registration with automated validation. Public registration as `ADMIN` is strictly blocked (`HTTP 403`).
- **Organization Onboarding**: Donors and Recipients submit legal organization details (Govt registration ID, address, contact person, NGO mission). Recipients start in `PENDING` verification status.
- **Login (`POST /api/auth/login`)**: Validates credentials via `bcryptjs` (salt factor 10), checks `accountStatus !== 'INACTIVE'`, issues JWT bearer token (7d expiry).
- **Session Revocation (`POST /api/auth/logout`)**: Tracks invalidated tokens in memory/cache to prevent token replay attacks.
- **Profile Updates (`PATCH /api/users/me`)**: Allows editing phone, name, and address while blocking role escalation.

### 3.2 Food Donation Management (Donor Domain)
- **Publication (`POST /api/donations`)**:
  - Item title, category (`cooked_meals`, `bakery_items`, `raw_groceries`, `packaged_food`, `fruits_vegetables`, `dairy_beverages`).
  - Total quantity and unit (`kg`, `servings`, `packets`, `boxes`, `liters`).
  - Storage handling instructions (`refrigerated`, `ambient`, `heated`, `deep_freeze`).
  - Dietary classification (`VEGETARIAN`, `NON_VEGETARIAN`, `VEGAN`, `JAIN`).
  - Pickup window (start datetime and pickup deadline).
  - Geolocation coordinates with Indian city presets and browser GPS auto-fill.
- **Dietary Mismatch Guard**: Prevents labeling food as vegetarian if ingredients or handling instructions conflict.
- **Lifecycle Management**: Statuses (`available`, `partially_reserved`, `fully_reserved`, `completed`, `cancelled`, `expired`).

### 3.3 Food Discovery & Reservation (Recipient Domain)
- **Real-Time Discovery (`GET /api/donations`)**:
  - Filters by category, status, and maximum distance using Haversine formula calculation.
  - Hides donor private street address until reservation is approved.
- **Atomic Reservation (`POST /api/reservations`)**:
  - Enforces `availableQuantity >= requestedQuantity` using atomic MongoDB conditions.
  - Automatically generates **Dual Verification Codes**:
    1. **Stage 1: Pickup Code (`FB-XXXX`)** — Presented at donor premises.
    2. **Stage 2: Recipient Delivery Code (`DL-XXXX`)** — Held by recipient until final doorstep delivery.
  - Employs compensation rollback: releases reserved quantity if reservation document persistence fails.
- **Approval Workflow (`PATCH /api/reservations/:id/status`)**:
  - Donor approves (`status: 'approved'`) -> automatically creates linked `PickupTask`.
  - Donor rejects (`status: 'rejected'`) -> atomically restores reserved food to available pool.
  - Recipient cancels (`status: 'cancelled'`) -> atomically releases reserved food.

### 3.4 Volunteer Transport & Logistics (Volunteer Domain)
- **Task Discovery (`GET /api/pickups?view=available`)**: Displays unassigned pickup tasks within the volunteer's service area.
- **Task Claiming (`POST /api/pickups/:id/claim`)**: Assigns volunteer to task, moves status to `'assigned'`, and notifies donor and recipient.
- **Transport Advancement (`PATCH /api/pickups/:id/status`)**:
  - `assigned` -> `in_progress` (Volunteer begins travel to donor).
  - `in_progress` -> `collected` (Food collected from donor premises).
- **Delivery Verification (`POST /api/pickups/:id/verify-delivery`)**:
  - Volunteer submits recipient's secret `DL-XXXX` delivery verification code.
  - Rejects invalid codes with `HTTP 400`.
  - Completes task, records delivery timestamp, and transitions linked reservation to `completed`.

### 3.5 QR Code & Verification Infrastructure
- **Vector QR Code Generation ([QrCodeModal.jsx](file:///c:/Users/lumin/.antigravity-ide/Annadhara/client/src/components/common/QrCodeModal.jsx))**:
  - Vector SVG QR codes generated client-side via `qrcode.react`.
  - Generates codes for both `FB-XXXX` (Pickup) and `DL-XXXX` (Delivery).
  - Includes one-click clipboard copy and contextual usage guide.
- **Live Camera QR Scanner ([QrScannerView.jsx](file:///c:/Users/lumin/.antigravity-ide/Annadhara/client/src/components/common/QrScannerView.jsx))**:
  - WebRTC live camera stream with targeting HUD.
  - Native browser `BarcodeDetector` decoding.
  - Includes instant simulator buttons for camera-less testing.
- **Donor Handover Modal ([HandoverModal.jsx](file:///c:/Users/lumin/.antigravity-ide/Annadhara/client/src/components/handover/HandoverModal.jsx))**:
  - Dual-mode tabs: Manual Code Entry + Scan Volunteer/Recipient QR code.

### 3.6 Automated Expiration Service ([expirationService.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/services/expirationService.js))
- Runs automated periodic checks on startup and every 5 minutes.
- Flags donations whose `pickupEndTime` has passed as `expired`.
- Cancels dangling unapproved reservations on expired listings.

### 3.7 In-App Notifications & Audit Logging
- **Notifications Collection (`Notification`)**: Real-time event notifications for reservations, approvals, volunteer claims, and deliveries.
- **Audit Logging (`AuditLog`)**: Records administrative and lifecycle events with actor ID, role, action, target entity, timestamp, and IP address.

### 3.8 Multi-Platform Synchronization
- Unified REST API consumed synchronously by both React Web (Vite) and Flutter Mobile (Provider).
- Consistent schemas across Dart models (`donation_model.dart`, `reservation_model.dart`, `pickup_model.dart`) and Mongoose models.
