# Annadhara — Master Implementation Roadmap (Phases 1–11)
**Project:** Annadhara (Surplus Food Rescue & Intelligent Distribution Network)  
**Document Type:** Phased Architectural Implementation Blueprint  
**Status:** Approved for Execution  
**Target Completion:** Production-Ready Multi-Platform Release  

---

## 1. Roadmap Architecture & Execution Strategy

To ensure zero regressions, continuous testability, and strict adherence to architectural standards, implementation follows a strict 11-phase dependency sequence:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE DEPENDENCY PIPELINE                            │
│                                                                             │
│  [Phase 1] Backend Reliability & Invariant Integrity                        │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 2] Food Safety Passport & Batch Traceability                        │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 3] SmartMatch: Intelligent Food Matching Engine                    │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 4] Volunteer Logistics & OSRM Delivery Intelligence                 │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 5] Offline-First Mobile Client (Flutter)                            │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 6] Donor Gratitude & Verified Recognition System                    │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 7] Security, Privacy & CORS Hardening                               │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 8] Evidence-Based Impact Analytics & Admin BI                       │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 9] Design System & Human-Centered UX Polishing                      │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 10] Concurrency & Full E2E Verification Testing                     │
│      │                                                                      │
│      ▼                                                                      │
│  [Phase 11] Production Deployment & Controlled Pilot Readiness              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Phase Specifications

### Phase 1: Backend Reliability & Data Integrity (Highest Priority)
- **1.1 Strict Inventory Invariant Enforcement**:
  - Invariant: `totalQuantity = availableQuantity + reservedQuantity + collectedQuantity`.
  - Atomic validation in MongoDB: prevent negative quantities, ensure `collectedQuantity <= totalQuantity`.
- **1.2 Reservation State Machine**:
  - Valid transitions: `pending -> approved/rejected/cancelled`, `approved -> in_progress/completed/cancelled`, terminal states: `completed`, `cancelled`, `expired`.
  - Prevent completing a pending reservation, approving an expired donation, or double-completing.
- **1.3 Comprehensive Expiration Processing**:
  - Inspect and upgrade [expirationService.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/services/expirationService.js).
  - Handle `available`, `partially_reserved`, and `fully_reserved` expired donations.
  - Automatically release reserved quantities for cancelled dangling reservations.
  - Update linked pickup tasks and prevent completed handovers from reversal.
- **1.4 Handover Transaction Integrity**:
  - Wrap [handoverController.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/controllers/handoverController.js) writes inside MongoDB transactional sessions with compensation rollbacks.
  - Ensure single execution: idempotency key support on `POST /api/handover/confirm`.
- **1.5 Race-Safe Volunteer Task Claiming**:
  - Upgrade [pickupController.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/controllers/pickupController.js) with atomic `findOneAndUpdate({ _id, volunteer: null, status: 'pending' })`.
  - Return `HTTP 409 Conflict` on concurrent collisions.
- **1.6 Database Connection Safety**:
  - Refactor [db.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/config/db.js). Block silent memory fallback when `NODE_ENV === 'production'`. Fail safely with clear diagnostic logs.

---

### Phase 2: Food Safety Passport & Traceability
- **2.1 FoodBatch Model**:
  - Unique batch ID (`BATCH-YYYYMMDD-XXXX`), preparation time, packaging time, recommended consumption deadline, storage requirements, allergen tags, vegetarian flag.
- **2.2 Safety Review Workflow**:
  - Statuses: `NOT_REVIEWED`, `PENDING_REVIEW`, `REVIEWED`, `FLAGGED`, `QUARANTINED`, `REJECTED`.
  - Distinguish donor input vs volunteer observation vs admin review.
  - Dynamic temperature threshold validation based on FSSAI/FDA food safety guidelines.
- **2.3 QR-Based Food Safety Passport**:
  - Public verification route: `GET /api/batches/:batchId/passport`.
  - Exposes safety audit history, handling instructions, and status without leaking private donor contact data.
- **2.4 FoodSafetyLog Model**:
  - Append-only event history: event type, timestamp, temperature reading, observation notes, photo evidence reference, inspector ID.

---

### Phase 3: Annadhara SmartMatch Engine
- **3.1 Organization Demand Profiles**:
  - Daily meal requirements, dietary constraints (Jain, Halal, Veg), storage capacities, operating hours, delivery capabilities.
- **3.2 Multi-Factor Scoring Algorithm**:
  - Factors: Category compatibility (25%), demand volume match (20%), consumption deadline urgency (20%), travel time (15%), fairness/equitable distribution (10%), organization storage capacity (10%).
  - Hard constraint: Disqualify organizations with dietary or allergen incompatibilities.
- **3.3 Distribution Time Feasibility Guard**:
  - `Remaining Safe Window = Consumption Deadline - Current Time`.
  - `Distribution Duration = Travel ETA + 20min Pickup Buffer + 20min Handover Buffer`.
  - Match is marked feasible ONLY if `Remaining Safe Window > Distribution Duration`.
- **3.4 Explainable Recommendations**:
  - Natural language explanation of match score and potential constraints.
  - Side-by-side comparison dashboard: Naive Nearest vs SmartMatch.

---

### Phase 4: Volunteer Logistics & Route Intelligence
- **4.1 Volunteer Capability Profiles**:
  - Vehicle type (Bike, Car, Van, On Foot), carrying capacity (kg/servings), service radius, active task limits.
- **4.2 Real Route Travel Duration**:
  - Integration with OSRM (Open Source Routing Machine) or Google Maps API for realistic driving/transit ETAs instead of straight-line Haversine math.
- **4.3 Lifecycle Timeline & Milestone Tracking**:
  - Granular milestones: `created -> assigned -> accepted -> travel_to_donor -> collected -> travel_to_recipient -> delivered -> recipient_verified`.

---

### Phase 5: Offline-First Mobile Experience (Flutter)
- **5.1 Encrypted Credential Storage**:
  - Replace `SharedPreferences` with `flutter_secure_storage` for JWT tokens.
- **5.2 Local Task Caching & Storage**:
  - Cache assigned pickup tasks, route coordinates, and offline verification payloads.
- **5.3 Persistent Offline Mutation Queue**:
  - Queue actions taken while offline (e.g. status advancement, temperature log, QR scan).
  - Background synchronization on connectivity restoration with conflict resolution.

---

### Phase 6: Annadhara Verified Contributions & Recognition System
- **6.1 Verified Contribution Architecture**:
  - Replaced certificate PDF generation and certificate QR codes with a continuous, traceable Verified Contributions ledger.
  - Calculated strictly from physical, verified `HandoverRecord` entries. Zero points for unverified, cancelled, or expired donations.
  - Model: `VerifiedContribution` with unique constraint on `handoverRecord: 1` preventing double-counting.
- **6.2 Tiered Recognition System**:
  - Tiers: *Kindness Starter* (1 verified handover), *Food Friend* (5 handovers), *Community Supporter* (10 handovers), *Annadhara Champion* (25 handovers), *Food Rescue Ambassador* (50+ handovers).
  - Automated progress tracking towards next milestone without gamified or excessive competition.
- **6.3 Donor Verified Contribution Profile & Timeline**:
  - Dedicated dashboard section with verified handovers count, rescued food quantities, recipient shelters supported, and food categories.
  - Chronological verified contribution timeline and paginated history with filtering.
- **6.4 Recipient Transparency & Discrepancy Reporting**:
  - Recipients can view received contribution history and report discrepancies directly into administrator review queues.
- **6.5 Administrative Auditing & Mandatory Reason Reversal**:
  - Administrators can place contributions under review or reverse invalid contributions with a mandatory reason, automatically updating donor totals and recognition tiers.

---

### Phase 7: Security & Privacy Hardening
- **7.1 Secret Enforcement**: Fatal startup check if `JWT_SECRET` is unset or default.
- **7.2 Production CORS**: Whitelist production domains, reject wildcard origins in production mode.
- **7.3 Rate Limiting**: Distributed rate-limiting on auth, upload, and verification routes.
- **7.4 Upload Magic-Number Validation**: Binary signature verification on all uploaded images.
- **7.5 Data Privacy DTOs**: Strip private residential addresses and contact details from unapproved discovery queries.
- **7.6 Tamper-Evident Audit Logging**: Hash-linked audit log entries for administrative accountability.

---

### Phase 8: Impact Intelligence & Administrative Analytics
- **8.1 Defensible Social & Environmental Formulas**:
  - 1 kg food rescue = 2.5 kg CO2 equivalent emissions avoided (FAO/WRAP benchmark).
  - 1 meal portion = 0.4 kg average portion baseline.
  - Transparent labeling of all figures as estimates with cited methodologies.
- **8.2 Role-Specific BI Dashboards**:
  - Donor, Recipient, Volunteer, and Administrator intelligence metrics computed purely from database state.

---

### Phase 9: Design System & User Experience Polishing
- Polished, responsive role-based navigation and consistent Nature color palette.
- Accessible forms, loading indicators, confirmation modals for irreversible operations, and clear, humanized error messages.

---

### Phase 10: Concurrency, QA & Full-Stack Testing
- Automated concurrency suite: 20 simultaneous reservation requests on limited inventory.
- Concurrent volunteer task claim tests.
- Full 21-step end-to-end integration scenario test.

---

### Phase 11: Production Deployment & Pilot Readiness
- Comprehensive environment guides, Docker configurations, database backup/restore procedures, and stakeholder operating guidelines.
