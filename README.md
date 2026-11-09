# FoodBridge - Surplus Food Rescue & Donation Network

> **Tagline:** *Surplus Food. Shared Hope. Zero Waste.*

FoodBridge connects people and organizations that have surplus food with non-profit organizations, charities, and community kitchens that urgently need it.

The platform coordinates the entire lifecycle from surplus food listing, discovery, atomic reservation, and volunteer transport logistics to verifiable 6-character code / QR-based handover confirmation.

---

## 📱 Platforms & Shared Technology Stack

FoodBridge provides seamless real-time data synchronization between web and mobile through a single shared REST backend and database:

1. **Responsive Web Application:** React.js, Tailwind CSS, React Router, Axios, Chart.js, Lucide Icons.
2. **Mobile Application:** Flutter & Dart, Provider state management, HTTP API client, QR Code rendering.
3. **Shared Backend:** Node.js, Express.js, JWT Authentication, bcryptjs, Mongoose ODM, express-validator.
4. **Database:** MongoDB (with built-in development in-memory auto-fallback for immediate evaluation).

---

## 🎨 Nature-Inspired Color System

The user interface follows a modern, clean, welcoming, and trustworthy nature-inspired design:

| Element | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Primary Green** | `#2E7D5B` | Primary actions, branding, success indicators |
| **Dark Green** | `#205B43` | Button hover states, headings, high-contrast badges |
| **Light Green** | `#EAF4EE` | Card backgrounds, active state fills, soft badges |
| **Background** | `#F8FAF8` | Clean, readable application body canvas |
| **White** | `#FFFFFF` | Cards, panels, input fields, navigation bar |
| **Primary Text** | `#26332D` | High-legibility dark forest text |
| **Secondary Text** | `#718078` | Subtext, timestamps, field descriptions |
| **Warning** | `#E9A23B` | Expiry urgency, pending status indicators |
| **Error / Alert** | `#D9534F` | Critical alerts, validation errors, cancellations |

---

## 👥 User Roles & Capabilities

### 1. 🍽️ Donor (Restaurants, Bakeries, Canteens, Event Organizers)
- Register business profile with address and contact info.
- Publish surplus food listings with quantity, unit, preparation time, expiry deadline, storage temperature requirements, and allergen declarations.
- Review incoming recipient reservation requests with 1-click **Approve** or **Decline**.
- Verify and complete food handovers using the recipient's 6-character verification code.
- View real-time database analytics: total meals rescued, active listings, and category distributions.

### 2. 🤝 Recipient Organization (NGOs, Food Banks, Homeless Shelters)
- Register charity profile and submit details for administrator verification.
- Discover available community food with real-time filters (Cooked meals, Bakery, Produce, Dairy) and proximity sorting.
- Reserve exact quantities with atomic database inventory protection against oversubscription.
- Receive unique 6-character **Handover Verification Codes** (e.g., `FB-7294`) and QR codes.
- Track upcoming volunteer pickups and delivery progress.

### 3. 🚚 Volunteer (Community Transport Helpers)
- Register as an independent food rescue runner.
- Browse unclaimed pickup missions with route addresses and food handling instructions.
- Claim pickup tasks and update milestone statuses: `assigned` → `in_progress` → `collected` → `completed`.
- Facilitate delivery to recipient shelters with thermal hygiene preservation.

### 4. 🛡️ Platform Administrator
- Supervise platform health and real-time database-driven metrics.
- Review and verify pending NGO organization credentials.
- Inspect and resolve community-reported listings for food safety compliance.
- Manage user accounts (activate or deactivate users).
- Audit trail inspection for all system events.

---

## 📂 Repository Structure

```
foodbridge/
├── client/                 # React.js web application (Vite, Tailwind, Chart.js)
│   ├── src/
│   │   ├── api/            # Axios API client & endpoints
│   │   ├── components/     # Reusable UI cards, badges, modals, layout
│   │   ├── context/        # AuthContext, NotificationContext
│   │   ├── pages/          # Dashboard, FindFood, MyDonations, Reservations, Pickups, Admin
│   │   └── index.css       # Tailwind CSS & Nature design tokens
├── mobile/                 # Flutter mobile application (Dart)
│   ├── lib/
│   │   ├── core/           # Palette constants, HTTP client, storage, theme
│   │   ├── models/         # User, Donation, Reservation, Pickup, Notification
│   │   ├── providers/      # MultiProvider state controllers
│   │   └── screens/        # Dashboard, Explore, Activity, Notifications, Profile
├── server/                 # Node.js + Express REST API backend
│   ├── src/
│   │   ├── config/         # MongoDB connection with dev in-memory fallback
│   │   ├── controllers/    # Business logic for all modules
│   │   ├── models/         # Mongoose schemas (8 models)
│   │   ├── middleware/     # JWT Auth, RBAC, centralized error handling
│   │   ├── services/       # Atomic inventory math, notifications, audit logging
│   │   └── utils/          # Seed data script, verification code generator
│   └── tests/              # Automated end-to-end integration test suite
├── docs/                   # Full documentation
│   ├── API_DOCUMENTATION.md# Complete REST API specification
│   └── ARCHITECTURE.md     # Invariant proofs, RBAC matrix, and system diagram
├── .env.example            # Environment template
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Flutter SDK:** v3.19.0 or higher (for mobile app)
- *Optional:* Local MongoDB instance (The backend includes automatic in-memory fallback if local MongoDB is not running!).

---

### 2. Backend Setup (`server/`)

```bash
# Navigate to server
cd server

# Install dependencies
npm install

# Start development server
npm start
```
The server will boot at `http://localhost:5000`. If MongoDB is empty, it will automatically seed sample accounts and food listings!

To run the automated backend test suite verifying all 12 modules:
```bash
npm test
```

---

### 3. Web Client Setup (`client/`)

```bash
# Navigate to client
cd client

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

### 4. Flutter Mobile App Setup (`mobile/`)

```bash
# Navigate to mobile
cd mobile

# Fetch packages
flutter pub get

# Run on connected device, emulator, or Chrome/Windows desktop
flutter run
```

---

## 🔑 Demo Accounts for Quick Evaluation

You can test all 4 roles instantly using the 1-click quick-login buttons on the login screen, or with these credentials:

| Role | Account Email | Password | Persona / Organization |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@foodbridge.org` | `Admin@123` | Platform Admin |
| **Donor** | `donor@greengarden.com` | `Donor@123` | Green Garden Bistro (Restaurant) |
| **Donor 2** | `sunrise@bakery.com` | `Donor@123` | Sunrise Artisanal Bakery |
| **Recipient NGO** | `ngo@hopeharvest.org` | `Recipient@123` | Hope Harvest Food Rescue (Verified) |
| **Recipient (Pending)** | `care@communityfood.org` | `Recipient@123` | Community Care Shelter (Pending Admin Review) |
| **Volunteer** | `alex@volunteer.org` | `Volunteer@123` | Alex Rivera (Pickup Runner) |

---

## 🔒 Concurrency Guarantee: Zero-Waste Inventory Invariant

To ensure that excess portions cannot be reserved even under concurrent requests, FoodBridge uses atomic conditional database operations:

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

When reservations are cancelled or rejected, quantities are returned to the available surplus pool atomically. When confirmed via verification code, the quantity transitions from `reservedQuantity` to `collectedQuantity`, guaranteeing mathematical consistency:

$$\text{quantityCollected} \le \text{quantityReserved} \le \text{quantityAvailable}$$

---

## 📜 License
ISC License — Created for the FoodBridge Surplus Food Rescue and Donation Network.

