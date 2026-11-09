# FoodBridge — Surplus Food Rescue and Donation Network

> **Tagline:** *Surplus Food. Shared Hope. Zero Waste.*

FoodBridge connects businesses that have surplus edible food (restaurants, bakeries, canteens, hotels, caterers) with recipient charities, NGOs, and community kitchens that urgently need it. The platform coordinates the entire lifecycle from surplus food publication, real-time discovery, and atomic reservation to volunteer transport logistics and verifiable 6-character code / QR-based handover confirmation.

FoodBridge provides seamless cross-platform synchronization between a **React.js Web Application** and a **Flutter Mobile Application**, both communicating with a single shared **Node.js + Express.js REST API** and **MongoDB** database.

---

## 1. Problem Statement & Mission

Millions of tons of edible food are wasted daily by commercial establishments, while local shelters and charitable organizations face chronic food shortages. Traditional food donation relies on ad-hoc phone calls and fragmented logistics. 

FoodBridge eliminates these inefficiencies through:
- **Zero-Waste Inventory Integrity**: Atomic database reservation prevents oversubscription and food waste.
- **Explainable Geospatial & Urgency Matching**: Prioritizes donations closest to expiration and nearest to verified shelters.
- **Closed-Loop Verification**: 6-character verification codes and dynamic QR codes ensure transparent, accountable handovers.
- **Cross-Platform Accessibility**: Responsive web for desktop back-office management and Flutter mobile for on-the-go pickup logistics.

---

## 2. Platforms & Technology Stack

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

- **Web Frontend:** React.js, Tailwind CSS, Vite, React Router, Axios, Lucide React icons, Chart.js.
- **Mobile Frontend:** Flutter (stable), Dart, Material 3, Provider state management, HTTP API client, `qr_flutter`.
- **Backend Server:** Node.js, Express.js, JWT Authentication, bcryptjs password hashing, Mongoose ODM, express-validator, Helmet security headers, in-memory IP rate limiter.
- **Database:** MongoDB (with automated `mongodb-memory-server` in-memory fallback for local zero-dependency testing and evaluation).

---

## 3. Nature-Inspired Visual Design System

Both the React and Flutter applications adhere to a consistent, high-contrast, welcoming Nature palette:

| Design Token | Hex Code | Purpose in User Interface |
| :--- | :--- | :--- |
| **Primary Green** | `#2E7D5B` | Primary call-to-action buttons, active navigation, key metrics |
| **Dark Green** | `#205B43` | Headings, button hover states, brand accents |
| **Light Green** | `#EAF4EE` | Card backgrounds, active state fills, soft badges |
| **Background** | `#F8FAF8` | Neutral, high-contrast page body canvas |
| **White** | `#FFFFFF` | Card surfaces, modal sheets, input backgrounds |
| **Primary Text** | `#26332D` | High-legibility dark forest text |
| **Secondary Text**| `#718078` | Subtext, timestamps, field descriptions |
| **Border** | `#E3EAE5` | Dividers, card borders, form input outlines |
| **Warning** | `#E9A23B` | Expiry urgency alerts, pending reservation badges |
| **Error** | `#D9534F` | Validation errors, cancellation indicators |

---

## 4. User Roles & Core Workflows

### 🍽️ 1. Food Donors (Restaurants, Hotels, Canteens, Caterers)
- Publish surplus food listings with quantity, unit, preparation timestamp, pickup deadline, storage conditions, and allergen tags.
- Review incoming reservation requests with one-tap **Approve** or **Decline** (with custom notes).
- Perform inventory tracking with dynamic progress bars.
- Confirm food handovers using the recipient's 6-character Handover Code.

### 🤝 2. Recipient Organizations (NGOs, Food Banks, Shelters)
- Submit organization profile for administrative review and verification.
- Discover available surplus food with real-time category filters and search.
- Request food reservations with atomic database stock protection against oversubscription.
- Receive unique 6-character **Handover Codes** (e.g. `FB-8942`) and interactive QR codes.
- Track volunteer pickup and delivery progress.

### 🚚 3. Volunteers (Transport Helpers)
- Discover available unclaimed pickup missions with route addresses and food handling specifications.
- Claim pickup tasks with one tap.
- Progress mission milestones: `assigned` $\to$ `in_progress` $\to$ `collected` $\to$ `completed`.
- Access completed delivery history and rescue statistics.

### 🛡️ 4. Platform Administrators
- Monitor network metrics directly from live database records.
- Inspect and verify pending NGO organization registrations with reviewer notes.
- Manage user accounts (toggle `ACTIVE` / `INACTIVE` account status).
- Moderate reported listings for food safety compliance.
- Inspect immutable system audit logs.

---

## 5. Mathematical Quantity Invariants

FoodBridge enforces mathematical inventory accounting at the database level:

$$\text{totalQuantity} = \text{availableQuantity} + \text{reservedQuantity} + \text{collectedQuantity}$$
$$\text{availableQuantity} \ge 0, \quad \text{reservedQuantity} \ge 0, \quad \text{collectedQuantity} \ge 0$$

- **`availableQuantity`**: Surplus available for reservation requests.
- **`reservedQuantity`**: Committed to approved/pending reservations awaiting pickup.
- **`collectedQuantity`**: Successfully handed over and rescued.

When a reservation is created, an atomic MongoDB query conditionally decrements `availableQuantity` and increments `reservedQuantity`. If cancelled or rejected, quantities are restored. When verified by code or QR, `reservedQuantity` transitions to `collectedQuantity`.

---

## 6. Repository Structure

```
foodbridge/
├── client/                     # React.js Web Application (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/                # Axios instance & typed API services
│   │   ├── components/         # Layouts, Navbar, Modal, Button, Badge
│   │   ├── context/            # AuthContext (JWT management & session)
│   │   └── pages/              # Dashboard, FindFood, MyDonations, AdminPanel, Profile
│   ├── index.html
│   ├── tailwind.config.js      # Nature palette configuration
│   └── vite.config.js          # Development proxy configuration
├── mobile/                     # Flutter Mobile Application (Dart + Material 3)
│   ├── lib/
│   │   ├── core/               # Palette tokens, API client, theme, local storage
│   │   ├── models/             # UserModel, DonationModel, ReservationModel, PickupModel
│   │   ├── providers/          # AuthProvider, DonationProvider, ActivityProvider, AdminProvider
│   │   ├── screens/            # Role-aware screens (Donor, Recipient, Volunteer, Admin)
│   │   └── main.dart           # App root & AuthGate
│   ├── test/                   # Automated unit & widget tests
│   └── pubspec.yaml            # Flutter dependencies (http, provider, qr_flutter)
├── server/                     # Node.js + Express.js REST API Backend
│   ├── src/
│   │   ├── config/             # Mongoose connection with in-memory fallback
│   │   ├── controllers/        # Business logic for all modules
│   │   ├── middleware/         # Auth, RBAC, RateLimiter, ErrorHandler
│   │   ├── models/             # 8 Mongoose models
│   │   ├── routes/             # Express API route declarations
│   │   ├── services/           # Atomic inventory math, notifications, audit logging
│   │   └── utils/              # Database seeder & handover code generator
│   ├── tests/                  # Automated integration & concurrency tests
│   ├── package.json
│   └── server.js               # Server entry point
├── docs/                       # Architectural & Technical Documentation
│   ├── architecture.md         # Invariant proofs & system architecture
│   ├── api-documentation.md    # REST API endpoint reference
│   ├── testing-report.md       # Complete QA & integration test report
│   └── deployment-guide.md     # Production deployment instructions
├── .env.example                # Root environment template
└── README.md
```

---

## 7. Installation & Quick Start

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Flutter SDK:** v3.24.0 or higher (for mobile app)
- *Optional:* Local MongoDB instance (If MongoDB is not running locally, the server automatically starts an in-memory database instance!).

---

### Step 1: Start the Backend Server (`server/`)

```powershell
cd server
npm install
npm run dev
```

The server boots at `http://localhost:5000`. On first run with an empty database, it automatically seeds demonstration accounts and listings!

---

### Step 2: Start the React Web Application (`client/`)

```powershell
cd client
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

---

### Step 3: Run the Flutter Mobile Application (`mobile/`)

```powershell
cd mobile
flutter pub get

# Run on connected device, emulator, or Chrome web
flutter run
```

---

## 8. Quick Demo Accounts

You can test all 4 user roles instantly using the 1-click quick-login buttons on the login screen of both web and mobile applications:

| Persona | Role | Email | Password | Organization / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `ADMIN` | `admin@foodbridge.org` | `Admin@123` | Platform Governance |
| **Donor Bistro** | `DONOR` | `donor@greengarden.com` | `Donor@123` | Green Garden Bistro (Restaurant) |
| **Donor Bakery** | `DONOR` | `sunrise@bakery.com` | `Donor@123` | Sunrise Artisanal Bakery |
| **Recipient NGO**| `RECIPIENT` | `ngo@hopeharvest.org` | `Recipient@123` | Hope Harvest (Verified NGO) |
| **Recipient Care**| `RECIPIENT` | `care@communityfood.org` | `Recipient@123` | Community Care (Pending Review) |
| **Volunteer** | `VOLUNTEER` | `alex@volunteer.org` | `Volunteer@123` | Alex Rivera (Pickup Runner) |

---

## 9. Automated Testing

All test suites have been executed and validated:

```powershell
# 1. Run Core Backend Unit Tests (15 tests)
npm --prefix server test

# 2. Run Extended Backend Integration Tests (12 tests)
npm --prefix server run test:integration

# 3. Run Phase 4 Cross-Platform & Concurrency Tests (26 tests)
npm --prefix server run test:phase4

# 4. Run Flutter Static Analysis (0 errors, 0 warnings, 0 lints)
cd mobile && flutter analyze

# 5. Run Flutter Unit & Widget Tests (6 tests)
cd mobile && flutter test

# 6. Verify Production React Build (Vite 0 errors)
npm --prefix client run build
```

---

## 10. Live Project Demonstration Guide (5–7 Minutes)

1. **Introduction (1 min):** Highlight the food waste problem and present the FoodBridge mission: *Surplus Food. Shared Hope. Zero Waste.*
2. **Donor Publication (1 min):** Log in as **Donor Bistro** on the React website. Publish 30 portions of Fresh Pasta with hot-held storage and allergen tags.
3. **Cross-Platform Synchronization (1 min):** Open the Flutter mobile app. Navigate to **Explore / Find Food**. The newly published pasta listing appears immediately.
4. **Recipient Reservation & Oversubscription Defense (1.5 min):** Log in as **Recipient NGO** on mobile. Reserve 15 portions. Show the available quantity instantly reduce from 30 to 15. Demonstrate that requesting more than 15 is rejected.
5. **Handover Verification (1.5 min):** 
   - Recipient displays their 6-character Handover Code (`FB-XXXX`) and QR code.
   - Donor inputs the code into the verification modal.
   - Status updates to `completed`, and 15 portions move into `collectedQuantity`.
6. **Admin & Analytics (1 min):** Log in as **Admin**. Show real-time dashboard counters, the organization review queue, and system audit logs.

---

## 11. Team Contributions & License

- **Architecture & Full-Stack Development:** MERN Stack & Flutter Integration.
- **UI/UX Design:** Material 3 & Tailwind Nature-Inspired Design System.
- **QA & Security Engineering:** Concurrency, RBAC, and automated test suites.

**License:** ISC License — Developed for the FoodBridge Surplus Food Rescue and Donation Network.
