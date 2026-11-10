# Annadhara Production Deployment Guide

**Project Title:** Annadhara | **Team:** Team Seva Shakti (MERNOVA X 2026)  
This guide covers deployment procedures for all components of the Annadhara Surplus Food Rescue and Donation Network.

---

## 1. MongoDB Database Setup (MongoDB Atlas)

1. **Create an Atlas Cluster:**
   - Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Create a free tier (M0) or dedicated production cluster in your preferred region.
2. **Configure Database User:**
   - Under **Database Access**, create a user (e.g. `annadhara_app`).
   - Use a cryptographically secure password.
   - Assign the `readWriteAnyDatabase` or scoped database role.
3. **Configure Network Access:**
   - Under **Network Access**, whitelist your production backend IP addresses.
   - For serverless hosts (e.g. Render/Railway), allow access from anywhere (`0.0.0.0/0`) with strict database authentication credentials.
4. **Obtain Connection String** (note: database name `foodbridge` is retained for existing MongoDB compatibility unless provisioning a brand-new cluster):
   ```
   mongodb+srv://<username>:<password>@cluster0.annadhara.mongodb.net/foodbridge?retryWrites=true&w=majority
   ```

---

## 2. Node.js + Express Backend Deployment

### Recommended Platforms: Render, Railway, AWS ECS, or DigitalOcean VPS

1. **Environment Variables Configuration:**
   Create the production environment variables in your hosting dashboard:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.annadhara.mongodb.net/foodbridge?retryWrites=true&w=majority
   JWT_SECRET=<your_64_char_random_production_secret>
   JWT_EXPIRES_IN=7d
   CLIENT_URL=https://app.annadhara.org
   ```

2. **Start Script:**
   The backend starts using:
   ```powershell
   node server.js
   ```
   For VPS deployments, use PM2 for process monitoring:
   ```powershell
   pm2 start server.js --name "annadhara-api"
   pm2 startup
   pm2 save
   ```

3. **Verify Deployment:**
   Test the public health check endpoint:
   ```bash
   curl -i https://api.annadhara.org/api/health
   ```
   Verify that `status` is `"online"` and database is `"connected"`.

---

## 3. React Web Application Deployment

### Recommended Platforms: Vercel, Netlify, or Cloudflare Pages

1. **Environment Configuration:**
   Set the production API base URL:
   ```env
   VITE_API_BASE_URL=https://api.annadhara.org/api
   ```

2. **Build Settings:**
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **SPA Client Routing Configuration:**
   To ensure React Router handles deep link refreshes (e.g. `/donations/:id`, `/dashboard`):
   - **For Netlify:** Create `client/public/_redirects`:
     ```
     /*    /index.html   200
     ```
   - **For Vercel:** Create `client/vercel.json`:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/" }]
     }
     ```

---

## 4. Flutter Mobile Application Deployment (Android)

1. **Configure Production API Address:**
   Update `mobile/lib/core/constants/api_constants.dart`:
   ```dart
   static String get baseUrl {
     return 'https://api.annadhara.org/api';
   }
   ```

2. **Build Release APK:**
   Run from the `mobile/` directory:
   ```powershell
   cd mobile
   flutter clean
   flutter pub get
   flutter build apk --release
   ```
   The production APK will be generated at:
   ```
   mobile/build/app/outputs/flutter-apk/app-release.apk
   ```

3. **Build Google Play App Bundle (Optional):**
   ```powershell
   flutter build appbundle --release
   ```
   Output: `mobile/build/app/outputs/bundle/release/app-release.aab`.

4. **Testing Installation on Android Device:**
   Connect a device via USB (or use ADB over Wi-Fi):
   ```powershell
   adb install mobile/build/app/outputs/flutter-apk/app-release.apk
   ```

---

## 5. Security & Pre-Launch Checklist

- [x] Database credentials are kept strictly in backend `.env` variables.
- [x] JWT secrets are 64+ characters, randomly generated, and not committed to git.
- [x] Public registration as `ADMIN` is strictly rejected by the backend.
- [x] Unverified recipient organizations cannot reserve food.
- [x] Rate limiting is active on auth endpoints to prevent brute-force attacks.
- [x] CORS is restricted to production domains.
- [x] HTTPS is enforced across all API and Web traffic.

