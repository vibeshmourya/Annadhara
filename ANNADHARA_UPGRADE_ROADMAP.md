# Annadhara — Master Architectural Upgrade Roadmap (Phases 0–12)
**Project:** Annadhara (Intelligent Food Rescue, Safety, Allocation and Verified Distribution Network)  
**Document Type:** Phased Architectural Upgrade Blueprint  
**Status:** Baseline Audit Completed — Awaiting Phase 1 Approval  
**Environment:** Local Development Only (No Remote Git Mutations)  
**Author:** Senior Full-Stack Software Architect & Systems Engineer  

---

## 1. Roadmap Architecture & Phased Dependency Pipeline

To ensure zero regressions, continuous testability, and strict adherence to architectural standards, the Annadhara upgrade follows a strict 13-phase dependency sequence:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE DEPENDENCY PIPELINE                            │
│                                                                             │
│  [Phase 0] Baseline Repository Audit & Gap Analysis                         │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 1] Reliability & Data Integrity (Inventory Invariants & FSM)        │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 2] Food Safety Passport & Traceability (Batch Identity & QR)        │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 3] SmartMatch & Rescue Feasibility Engine                           │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 4] Smart Logistics & Last-Mile Delivery (OSRM Ground Routing)       │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 5] Offline-First Flutter Mobile Application                         │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 6] Verified Contributions & Donor Trust (Source-of-Truth Recognition)│
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 7] Security, CORS & Privacy Hardening                               │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 8] Impact Intelligence & Real-World Outcome Analytics               │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 9] Donor Verification & Platform Trust Hierarchy                    │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 10] Professional Web & Mobile User Experience                        │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 11] Comprehensive Concurrency & Full E2E Verification Testing       │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 12] Real-World Controlled Pilot Readiness                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Phase Specifications

---

### Phase 0: Baseline Repository Audit & Architectural Gap Analysis
- **Status:** **COMPLETE**
- **Objectives:**
  - Complete repository inspection across React web, Node.js backend, MongoDB schemas, and Flutter mobile app.
  - Review critical core files: `handoverController.js`, `expirationService.js`, `pickupController.js`, `donationService.js`, `db.js`, `app.js`.
  - Compile baseline documentation:
    - [ANNADHARA_EXISTING_FEATURES.md](file:///c:/Users/lumin/.antigravity-ide/Annadhara/ANNADHARA_EXISTING_FEATURES.md)
    - [ANNADHARA_TECHNICAL_AUDIT.md](file:///c:/Users/lumin/.antigravity-ide/Annadhara/ANNADHARA_TECHNICAL_AUDIT.md)
    - [ANNADHARA_LIMITATIONS.md](file:///c:/Users/lumin/.antigravity-ide/Annadhara/ANNADHARA_LIMITATIONS.md)
    - [ANNADHARA_UPGRADE_ROADMAP.md](file:///c:/Users/lumin/.antigravity-ide/Annadhara/ANNADHARA_UPGRADE_ROADMAP.md)
    - [ANNADHARA_TESTING_TRACKER.md](file:///c:/Users/lumin/.antigravity-ide/Annadhara/ANNADHARA_TESTING_TRACKER.md)
  - Zero code modifications or destructive commands executed during audit.

---

### Phase 1: Reliability & Data Integrity (Highest Priority)
- **Status:** **IMPLEMENTED & VERIFIED LOCALLY** (Awaiting formal user sign-off)
- **Objectives:**
  - **1.1 Strict Inventory Invariant Enforcement**:
    - Pre-validate hook in [Donation.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/models/Donation.js): `totalQuantity = availableQuantity + reservedQuantity + collectedQuantity`.
    - Enforce `collectedQuantity <= totalQuantity` and non-negative stock levels.
    - MongoDB aggregation pipeline updates in [donationService.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/services/donationService.js) (`reserveDonationQuantity`, `releaseReservedQuantity`, `completeHandoverQuantity`) for atomic status and quantity mutations.
  - **1.2 Reservation Finite State Machine**:
    - Permitted transitions: `pending -> approved/rejected/cancelled`, `approved -> completed/cancelled`.
    - Terminal states: `completed`, `rejected`, `cancelled`.
    - Block approval of expired listings (`HTTP 400 Bad Request`).
  - **1.3 Comprehensive Expiration Processing**:
    - Automated background cycle in [expirationService.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/services/expirationService.js) checking `available`, `partially_reserved`, and `fully_reserved` donations past `pickupEndTime`.
    - Cancel dangling pending reservations with audit justification; restore reserved quantities to maintain mathematical invariants.
  - **1.4 Handover Transaction Integrity**:
    - Transactional session execution with compensation rollbacks in [handoverController.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/controllers/handoverController.js).
    - Idempotency and replay protection against duplicate handover verification.
  - **1.5 Race-Safe Volunteer Task Claiming**:
    - Atomic `findOneAndUpdate({ _id, volunteer: null, status: 'pending' })` in [pickupController.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/controllers/pickupController.js).
    - Returns `HTTP 409 Conflict` to losing concurrent requests.
  - **1.6 Database Connection Safety**:
    - Strict environment check in [db.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/config/db.js): fail fast in production; block silent in-memory fallback.
  - **Automated Verification**:
    - [concurrency_inventory.test.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/tests/concurrency_inventory.test.js) (6 scenarios, 100% PASS, exit code 0).

---

### Phase 2: Food Safety Passport & Traceability
- **Status:** **READY FOR EXECUTION**
- **Objectives:**
  - **2.1 FoodBatch Model**:
    - Unique batch ID (`BATCH-YYYYMMDD-XXXX`), preparation timestamp, packaging timestamp, recommended consumption deadline, storage requirements, allergen tags, vegetarian flag.
  - **2.2 Safety Review Workflow**:
    - Review statuses: `NOT_REVIEWED`, `PENDING_REVIEW`, `REVIEWED`, `FLAGGED`, `QUARANTINED`, `REJECTED`.
    - FSSAI/FDA category temperature thresholds: Hot-held (>= 63°C), Chilled (<= 5°C), Frozen (<= -18°C), Ambient (15°C – 25°C).
    - Automatic `FLAGGED` status for high-risk thermal boundary breaches.
  - **2.3 QR-Based Food Safety Passport**:
    - Secure verification endpoint: `GET /api/batches/:batchId/passport`.
    - Public UI displaying food identity, preparation time, temperature logs, allergen warnings, and review status **without exposing donor phone or street address**.
  - **2.4 Append-Only FoodSafetyLog**:
    - Immutable event logging: timestamp, inspector ID/device, temperature reading, observation notes, photo evidence reference.
  - **2.5 Hardware Readiness**:
    - Extensible API adapter for optional ESP32 / Bluetooth temperature loggers; manual observation support with transparent source labeling.

---

### Phase 3: Annadhara SmartMatch & Rescue Feasibility Engine
- **Status:** **PLANNED**
- **Objectives:**
  - **3.1 Recipient Demand Profiles**:
    - Organization schema extension: daily meal demand, accepted categories, refrigeration storage capacity, dietary constraints (Veg, Non-Veg, Vegan, Jain), operating hours.
  - **3.2 Multi-Factor Scoring Engine**:
    - Factors: Category compatibility (25%), demand volume match (20%), consumption deadline urgency (20%), travel time (15%), fairness/equitable distribution (10%), organization storage capacity (10%).
    - Hard dietary constraint: Disqualify organizations with conflicting dietary or allergen profiles.
  - **3.3 Rescue Feasibility Time Guard**:
    - `Remaining Safe Window = Consumption Deadline - Current Time`.
    - `Required Distribution Time = Pickup + Travel ETA + Safety Buffer`.
    - Hard rule: Disqualify match if `Remaining Safe Window <= Required Distribution Time`.
  - **3.4 Demand-Aware Quantity Allocation**:
    - Multi-recipient split allocation recommendation when batch quantity exceeds single shelter capacity.
  - **3.5 Explainable Recommendations**:
    - Human-readable match rationales displayed in UI.
  - **3.6 Algorithmic Evaluation**:
    - Benchmark comparison: nearest-first vs SmartMatch demand fulfillment.

---

### Phase 4: Smart Logistics & Last-Mile Delivery
- **Status:** **PLANNED**
- **Objectives:**
  - **4.1 Volunteer Capability Profiles**:
    - Service radius, vehicle modality (bicycle, two-wheeler, four-wheeler), carrying capacity, active task counter, insulated bag availability.
  - **4.2 Ground Route Planning via OSRM**:
    - Integration with OpenStreetMap / OSRM routing engine for realistic road journey times and distance.
    - Graceful fallback with clear UI indication when external routing is unavailable.
  - **4.3 Delivery Milestone Timeline**:
    - Tamper-proof milestone tracking: `TASK_ASSIGNED -> ACCEPTED -> EN_ROUTE_PICKUP -> ARRIVED_DONOR -> COLLECTED -> EN_ROUTE_DELIVERY -> ARRIVED_RECIPIENT -> DELIVERED`.
    - Late-delivery alert triggers if ETA exceeds consumption safe window.

---

### Phase 5: Offline-First Flutter Mobile Client
- **Status:** **PLANNED**
- **Objectives:**
  - **5.1 Secure Credential Storage**:
    - Replace plaintext `SharedPreferences` token storage with `flutter_secure_storage`.
  - **5.2 Offline Task Access**:
    - Local SQLite/Hive task cache: assigned pickups, donor address, recipient contact, instructions, offline QR validation data.
  - **5.3 Persistent Offline Event Queue**:
    - Queue volunteer field actions (`ARRIVED`, `COLLECTED`, `TEMPERATURE_LOGGED`) with UUIDs and client timestamps.
  - **5.4 Resilient Background Synchronization**:
    - Connectivity listener (`connectivity_plus`) with automatic exponential backoff retry.
    - Server-side idempotency ensuring zero duplicate events or double inventory shifts.

---

### Phase 6: Verified Contributions & Donor Trust
- **Status:** **IMPLEMENTED & VERIFIED LOCALLY**
- **Objectives:**
  - Absolute replacement of certificates with continuous, verifiable contribution tracking.
  - Source-of-truth constraint: only completed, verified handovers count.
  - Model: [VerifiedContribution.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/models/VerifiedContribution.js) with unique `{ handoverRecord: 1 }` index.
  - 5 Recognition Tiers: *Kindness Starter* (1), *Food Friend* (5), *Community Supporter* (10), *Annadhara Champion* (25), *Food Rescue Ambassador* (50).
  - Recipient received view and discrepancy reporting.
  - Admin reversal with mandatory justification and audit trail.
  - Automated verification: [verified_contributions.test.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/tests/verified_contributions.test.js) (20 scenarios, 100% PASS).

---

### Phase 7: Security, Privacy & CORS Hardening
- **Status:** **PLANNED**
- **Objectives:**
  - **7.1 CORS Hardening**:
    - Reject non-whitelisted origins in production mode in `server/src/app.js`.
  - **7.2 API Rate Limiting**:
    - Tiered `express-rate-limit` on `/api/auth/*` (10/15m), `/api/handover/*` (5/5m), and `/api/upload` (20/hr).
  - **7.3 Upload Inspection**:
    - Binary magic number validation preventing disguised executables.
  - **7.4 Data Privacy & PII Sanitation**:
    - Response DTO filtering: hide donor private phone/address from public discovery and volunteer lists prior to approved assignment.

---

### Phase 8: Impact Intelligence & Real-World Outcome Analytics
- **Status:** **PLANNED**
- **Objectives:**
  - Separate raw platform volume from physical verified outcomes: Posted vs Reserved vs Collected vs Handed Over.
  - Real-world metrics: Food waste prevention percentage, on-time delivery rate, safety inspection pass rate.
  - Documented carbon/water savings calculator with transparent citations and disclaimers.

---

### Phase 9: Donor Verification & Platform Trust Hierarchy
- **Status:** **PLANNED**
- **Objectives:**
  - Distinct verification states: `UNVERIFIED`, `PENDING_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`.
  - Clear separation between User Account Verification, Organization Verification, Food Batch Review, and Handover Verification.
  - Admin audit dashboard for verification approval.

---

### Phase 10: Professional Web & Mobile User Experience
- **Status:** **PLANNED**
- **Objectives:**
  - Maintain Annadhara Nature Design System (`#2E7D5B` Forest Green, `#205B43` Dark Green, `#EAF4EE` Mint Light, `#F8FAF8` Off-White).
  - Responsive web polishing (tables, modals, empty states, error boundaries).
  - Streamlined mobile flows (large tap targets, QR scanning HUD, offline sync indicators).

---

### Phase 11: Comprehensive Concurrency & E2E Master Verification
- **Status:** **PLANNED**
- **Objectives:**
  - Full 21-step end-to-end master workflow automation (from donor onboarding to verified contribution and admin BI).
  - 20-client concurrent reservation race stress test.
  - 5-volunteer simultaneous claim collision test.
  - High-volume replay and network disconnection simulation.

---

### Phase 12: Real-World Controlled Pilot Readiness
- **Status:** **PLANNED**
- **Objectives:**
  - Comprehensive operational guides: Donor Guide, Recipient Guide, Volunteer Guide, Administrator Guide.
  - Deployment and backup/recovery runbooks.
  - Controlled 2-week pilot strategy (3 donors, 2 recipient organizations, 3–5 volunteers, 15–20 batches).

---

## 3. Progress Tracking & Next Actions

| Phase | Description | Architecture | Automated Tests | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | Baseline Audit & Roadmap | Complete | Complete | **APPROVED BASELINE** |
| **Phase 1** | Reliability & Invariant Integrity | Complete | 6 Suites (PASS) | **AWAITING USER SIGN-OFF** |
| **Phase 2** | Food Safety Passport | Designed | Pending | **NEXT TARGET** |
| **Phase 3** | SmartMatch & Feasibility Engine | Designed | Pending | Pending Phase 2 |
| **Phase 4** | Smart Logistics (OSRM) | Designed | Pending | Pending Phase 3 |
| **Phase 5** | Offline-First Mobile (Flutter) | Designed | Pending | Pending Phase 4 |
| **Phase 6** | Verified Contributions | Complete | 20 Tests (PASS) | **COMPLETED & TESTED** |
| **Phase 7** | Security & CORS Hardening | Designed | Pending | Pending Phase 6 |
| **Phase 8** | Impact Intelligence | Designed | Pending | Pending Phase 7 |
| **Phase 9** | Donor Trust Hierarchy | Designed | Pending | Pending Phase 8 |
| **Phase 10**| Web & Mobile UX Polishing | Designed | Pending | Pending Phase 9 |
| **Phase 11**| Master E2E & Concurrency | Designed | Pending | Pending Phase 10 |
| **Phase 12**| Pilot Runbooks & Readiness | Designed | Pending | Pending Phase 11 |
