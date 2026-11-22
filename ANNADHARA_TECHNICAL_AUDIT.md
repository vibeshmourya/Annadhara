# Annadhara — Comprehensive Technical Audit & Gap Analysis
**Project:** Annadhara (Surplus Food Rescue & Intelligent Distribution Network)  
**Document Type:** Architecture & Codebase Technical Audit  
**Version:** 1.0.0 (Phase 0 Baseline)  
**Author:** Lead Architect & Security Specialist  

---

## 1. Executive Audit Overview

This document presents a rigorous architectural, algorithmic, and security audit of the Annadhara codebase across the Node.js/Express backend, MongoDB schema layer, React frontend, and Flutter mobile client.

While the existing codebase implements foundational CRUD operations and dual-code verification, several critical architectural gaps, race conditions, security vulnerabilities, and data integrity risks were uncovered that must be resolved to achieve production reliability.

---

## 2. Deep Component Audit & Vulnerability Findings

### 2.1 Backend & Database Layer

#### 🔴 CRITICAL-01: Silent In-Memory Database Fallback in Production
- **File:** [server/src/config/db.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/config/db.js#L27-L48)
- **Problem:** When connection to the external MongoDB instance times out (2000ms), `connectDB()` automatically starts `mongodb-memory-server` and connects to it without throwing a fatal startup error.
- **Risk:** In production or staging, if the network drops or MongoDB restarts, the server silently creates an ephemeral in-memory database. All subsequent writes (donations, users, reservations) are written to RAM and wiped on next reboot, leading to silent catastrophic data loss.
- **Required Fix:** Strict environment enforcement. In `NODE_ENV === 'production'`, database connection failure must immediately log an alert and terminate the process (`process.exit(1)`). Memory database must only be allowed when explicitly enabled via `ENABLE_MEMORY_DB=true` during unit tests.

#### 🔴 CRITICAL-02: Non-Transactional Multi-Document Handover Writes
- **File:** [server/src/controllers/handoverController.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/controllers/handoverController.js#L96-L130)
- **Problem:** During food handover confirmation, the controller executes four sequential, independent database mutations:
  1. `await handoverRecord.save();`
  2. `await reservation.save();`
  3. `await completeHandoverQuantity(...);` (updates `Donation`)
  4. `await pickupTask.save();`
- **Risk:** If the server crashes or database connection flickers between steps 1 and 3, a `HandoverRecord` exists, but the `Donation`'s inventory (`reservedQuantity` and `collectedQuantity`) remains unaltered. Re-attempting the handover fails because `HandoverRecord` already exists. The inventory is permanently corrupted.
- **Required Fix:** Wrap handover operations in a transactional session (`await mongoose.startSession(); session.withTransaction(...)`) with replica set detection and a single atomic batch commit.

#### 🔴 CRITICAL-03: Volunteer Task Claim Race Condition (Read-Then-Write)
- **File:** [server/src/controllers/pickupController.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/controllers/pickupController.js#L94-L122)
- **Problem:** Claiming a pickup task uses an in-memory check:
  ```javascript
  const task = await PickupTask.findById(req.params.id);
  if (task.volunteer) return res.status(400).json(...);
  task.volunteer = req.user._id;
  task.status = 'assigned';
  await task.save();
  ```
- **Risk:** When two volunteers click "Accept Task" simultaneously, both read `task.volunteer === null` before either saves. Both requests return `HTTP 200 Success`, but the second write silently overwrites the first volunteer without conflict notification.
- **Required Fix:** Replace with an atomic update:
  ```javascript
  const updatedTask = await PickupTask.findOneAndUpdate(
    { _id: req.params.id, volunteer: null, status: 'pending' },
    { $set: { volunteer: req.user._id, status: 'assigned', assignedAt: new Date() } },
    { new: true }
  );
  if (!updatedTask) return res.status(409).json({ success: false, message: 'Task has already been claimed by another volunteer.' });
  ```

#### 🔴 CRITICAL-04: Expiration Service Inventory Inconsistency
- **File:** [server/src/services/expirationService.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/services/expirationService.js#L16-L37)
- **Problem:** When an unapproved reservation on an expired donation is cancelled:
  ```javascript
  resv.status = 'cancelled';
  resv.cancellationReason = 'Donation pickup window expired...';
  await resv.save();
  ```
  The service cancels the reservation document, but **fails to decrement `donation.reservedQuantity`** or update the donation's total math. Furthermore, `fully_reserved` donations whose pickup window expired without approval are completely omitted from the query filter (`status: { $in: ['available', 'partially_reserved'] }`).
- **Required Fix:** Automatically process expired donations across all states (`available`, `partially_reserved`, `fully_reserved`), cancel linked pending reservations, and release reserved quantities back to zero so the invariant `total = available + reserved + collected` is maintained.

---

### 2.2 Security & Privacy Hardening

#### 🟡 WARNING-01: Hardcoded Fallback JWT Secrets
- **File:** [server/src/middleware/auth.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/middleware/auth.js#L34), [server/src/controllers/authController.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/controllers/authController.js)
- **Problem:** Falls back to hardcoded string `'foodbridge_super_secret_jwt_key_2026_shared_hope_zero_waste'` when `process.env.JWT_SECRET` is undefined.
- **Risk:** Anyone reading the open source repository can forge valid administrative JWT tokens if an environment variable is omitted in deployment.
- **Required Fix:** Throw a fatal error on server initialization if `JWT_SECRET` is missing or shorter than 32 characters.

#### 🟡 WARNING-02: Permissive CORS Configuration
- **File:** [server/src/app.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/app.js#L36-L44)
- **Problem:** In line 41, the CORS callback allows any origin (`callback(null, true) // Permissive in development`).
- **Risk:** Cross-Origin Request Forgery and malicious script data exfiltration from unauthorized domains in production.
- **Required Fix:** Enforce a strict whitelist from `process.env.ALLOWED_ORIGINS` when `NODE_ENV === 'production'`.

#### 🟡 WARNING-03: In-Memory Only Rate Limiter
- **File:** [server/src/middleware/rateLimiter.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/middleware/rateLimiter.js)
- **Problem:** Rate limiting is managed using an in-process JavaScript `Map()`.
- **Risk:** In multi-core PM2 cluster mode or containerized deployments, IP counts are not shared across processes. Malicious attackers can rotate connections across instances.
- **Required Fix:** Support Redis-backed rate limiting or robust sliding window IP throttling across auth, upload, and verification routes.

#### 🟡 WARNING-04: File Upload Security
- **File:** [server/src/routes/uploadRoutes.js](file:///c:/Users/lumin/.antigravity-ide/Annadhara/server/src/routes/uploadRoutes.js)
- **Problem:** Validates file extension via regex, but does not inspect actual binary magic numbers (file signature).
- **Risk:** Attacker could upload an executable or script disguised as an image.
- **Required Fix:** Validate MIME type, size (<5MB), file signature check, and sanitize file names on disk.

---

### 2.3 Mobile Application (Flutter) Audit

#### 🟡 WARNING-05: Plaintext Token Storage in SharedPreferences
- **File:** [mobile/lib/core/storage/storage_service.dart](file:///c:/Users/lumin/.antigravity-ide/Annadhara/mobile/lib/core/storage/storage_service.dart#L1-L33)
- **Problem:** Uses standard `SharedPreferences` to store JWT authentication tokens. On Android and iOS, `SharedPreferences` writes to unencrypted XML files accessible on rooted/jailbroken devices.
- **Required Fix:** Migrate to `flutter_secure_storage` (using Android KeyStore and iOS Keychain).

#### 🟡 WARNING-06: Complete Absence of Offline Mutation Queue
- **File:** [mobile/lib/providers/activity_provider.dart](file:///c:/Users/lumin/.antigravity-ide/Annadhara/mobile/lib/providers/activity_provider.dart)
- **Problem:** When a volunteer is in the field with poor cellular reception (basement kitchens, rural food banks), any API call (accept task, start trip, record observation) throws an uncaught network exception.
- **Required Fix:** Implement a local event queue using SQLite / Hive / persistent local storage with idempotency keys and background synchronization upon reconnect.

---

### 2.4 Missing Domain Intelligence & Real-World Features

1. **Food Safety Passport Missing**: Donations currently have basic storage instructions, but no unique batch identifiers, time-temperature logs, allergen cross-contamination warnings, or food safety logs.
2. **Naive Sorting vs. SmartMatch**: Find Food currently sorts purely by nearest distance or latest date. It does not consider recipient demand capacity, dietary compatibility, time-to-spoil vs. travel ETA, or equitable distribution across community shelters.
3. **No Donor Recognition / Certification**: Donors receive no formal verification of verified rescued food, no tamper-evident certificates, and no tiered recognition for genuine social impact.
4. **Impact Numbers Unsubstantiated**: Dashboard statistics lack verifiable CO2 emission reduction formulas and meal conversion baselines.

---

## 3. Summary of Audit Findings Matrix

| Ref ID | Severity | Area | Description | Impact |
| :--- | :--- | :--- | :--- | :--- |
| `AUD-01` | **CRITICAL** | Database | Silent fallback to in-memory database | Silent data loss upon restart |
| `AUD-02` | **CRITICAL** | Backend | Non-transactional 4-step handover | Broken inventory invariant on network blip |
| `AUD-03` | **CRITICAL** | Backend | Read-then-write volunteer task claim | Dual assignment race condition |
| `AUD-04` | **CRITICAL** | Backend | Expiry job fails to release reserved quantity | Deadlock of reserved surplus food |
| `AUD-05` | **HIGH** | Security | Fallback hardcoded JWT secret | Unauthorized token forgery |
| `AUD-06` | **HIGH** | Security | Permissive CORS in app.js | Cross-site data exposure |
| `AUD-07` | **HIGH** | Mobile | Plaintext token in SharedPreferences | Credential theft on rooted devices |
| `AUD-08` | **HIGH** | Mobile | No offline task cache or queue | Field failure in low-connectivity areas |
| `AUD-09` | **MEDIUM** | Domain | No Food Safety Passport / Batch tracking | Inability to audit perishable safety |
| `AUD-10` | **MEDIUM** | Domain | Naive distance sorting vs SmartMatch | Mismatched allocations, food spoiled in transit |
| `AUD-11` | **MEDIUM** | Domain | No verified donor recognition / PDF certs | Lack of donor retention and motivation |
