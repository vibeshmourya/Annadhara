# Annadhara AI Chatbot Feature Extraction Package
> **Team:** Team Seva Shakti (MERNOVA X 2026)  
> **Feature:** Annadhara AI — Role-Aware, Multilingual Food Rescue Assistant with Regulatory Search & Guardrails

---

## 1. Overview & Architecture

The **Annadhara AI Chatbot** is a production-grade, role-isolated conversational assistant specifically engineered for the **Annadhara Surplus Food Rescue and Donation Network**. It supports both Web (React + Tailwind CSS) and Mobile (Flutter) frontends with a shared Node.js/Express REST API backend.

### Key Capabilities
1. **Role-Aware Context Isolation**: Dynamically tailors responses and strictly isolates data based on the authenticated user's role:
   - **DONOR**: Guidance on listing surplus meals, storage rules, pickup time windows, and 6-character code verification.
   - **RECIPIENT (NGOs)**: Food discovery tips, atomic reservation rules, organization verification requirements, and handover codes.
   - **VOLUNTEER**: Transport logistics, thermal handling precautions, and mission claim workflows.
   - **ADMIN**: Platform governance overview, verification queues, and zero-waste mathematical invariants (read-only).
2. **Real-Time Regulatory Research (Tavily AI)**: Searches official regulatory portals (FSSAI `fssai.gov.in`, Eat Right India, MoHFW, WHO, FAO) and renders clickable, verified citations. Gracefully falls back to curated regulatory guidelines if no API key is provided.
3. **Groq Cloud LLM Inference**: Fast OpenAI-compatible inference with token budgeting (capped to last 4–6 turns) and automatic fallback model switching.
4. **Multilingual Intelligence**: Supports Kannada (ಕನ್ನಡ), Hindi (हिन्दी), and English with automatic script detection and manual selection.
5. **Defense-in-Depth Guardrails**: In-memory sliding-window rate limiting (20 req/min for chat), input length sanitization, prompt injection heuristic screening, and outbound credential/token redaction.
6. **Multi-Turn Conversation Persistence**: Saves chat sessions, turns, and citations in MongoDB (`AIConversation` collection).

---

## 2. Directory Structure of `chatbot_extracted`

```
chatbot_extracted/
├── README.md                              <- Comprehensive integration guide & architecture documentation
├── config/
│   └── chatbot.env.example                <- Sample environment variables (no secrets)
├── frontend/
│   ├── api/
│   │   └── aiEndpoints.js                 <- Isolated API endpoint definitions for Axios client
│   ├── components/
│   │   ├── AnnadharaAIWidget.jsx          <- Floating AI launcher widget button
│   │   ├── ChatWindow.jsx                 <- Full interactive chat modal with history, language switcher, and suggestions
│   │   └── CitationList.jsx               <- Verified regulatory source citation renderer
│   └── pages/
│       └── AiChatTest.jsx                 <- Standalone AI testing studio (role switcher, test prompts, security checks)
├── backend/
│   ├── controllers/
│   │   └── aiController.js                <- AI orchestration controller (chat, conversations, status)
│   ├── middleware/
│   │   └── aiRateLimiter.js               <- Sliding-window user/IP rate limiter for quota preservation
│   ├── models/
│   │   └── AIConversation.js              <- Mongoose model for multi-turn history & citations
│   ├── routes/
│   │   └── aiRoutes.js                    <- Express router definition for `/api/ai/*`
│   ├── services/
│   │   ├── aiIntentService.js             <- Keyword/pattern intent classifier
│   │   ├── aiLanguageService.js           <- Language detection & Kannada/Hindi/English system prompt directives
│   │   ├── aiPlatformService.js           <- Read-only role-isolated platform data retriever
│   │   ├── aiPromptService.js             <- System prompt constructor
│   │   ├── aiSecurityService.js           <- Prompt injection defense & outbound secret redaction
│   │   ├── groqService.js                 <- Groq LLM client with timeout & candidate model fallback
│   │   └── tavilyService.js               <- Tavily web search service with caching & official domain scoring
│   └── tests/
│       └── ai.test.js                     <- Automated test suite for AI services and controller
└── mobile/ (Flutter Implementation)
    ├── models/
    │   └── ai_message_model.dart          <- Dart data models for messages and citations
    ├── providers/
    │   └── ai_provider.dart               <- ChangeNotifier provider managing chat state, history, and language
    └── screens/
        ├── annadhara_ai_screen.dart       <- Full Flutter chat screen with suggestions & history drawer
        └── widgets/
            └── citation_widget.dart       <- Clickable citation chips for mobile UI
```

---

## 3. How the Chatbot Works (End-to-End Flow)

```
[User Input in ChatWindow / Mobile Screen]
                   │
                   ▼
  [Input Sanitization & Character Cap]
                   │
                   ▼
  [Prompt Injection & Adversarial Check] ──(Detected)──> [Return 400 Decline]
                   │ (Safe)
                   ▼
  [Language Detection / Normalization (en/kn/hi)]
                   │
                   ▼
  [Intent Classification (aiIntentService)]
   ├── GENERAL_CHAT
   ├── WEB_SEARCH / COMBINED_QUERY ──> [Tavily Search + Official Domain Ranking]
   ├── PLATFORM_DATA / COMBINED ──> [aiPlatformService (Sanitized DB Stats)]
   └── SUPPORT_HELP
                   │
                   ▼
  [Formulate Role-Aware System Prompt (aiPromptService)]
                   │
                   ▼
  [Execute Chat Completion via Groq (groqService)]
                   │
                   ▼
  [Outbound Secret Redaction (aiSecurityService)]
                   │
                   ▼
  [Persist Turn in MongoDB (AIConversation)]
                   │
                   ▼
[Return Response + Model + Intent + Citations to Client]
```

---

## 4. Dependencies Required

### Backend Dependencies
The backend chatbot implementation is deliberately designed with **zero extra external npm packages** beyond Annadhara's existing stack:
- **Node.js**: Version **18+** recommended (native global `fetch` and `AbortController` are used by `groqService.js` and `tavilyService.js`).
- **Existing packages used**:
  - `express` (already in Annadhara `package.json`)
  - `mongoose` (already in Annadhara `package.json`)
  - `jsonwebtoken` (already in Annadhara `package.json`)
  - `dotenv` (already in Annadhara `package.json`)

Optional script to add in `server/package.json`:
```json
"scripts": {
  "test:ai": "node tests/ai.test.js"
}
```

### Frontend (Web) Dependencies
No additional npm packages required! It uses:
- `react` (`^18.0.0`)
- `react-router-dom` (`^6.0.0`)
- `lucide-react` (`^0.460.0`)
- `axios` (`^1.7.0`)
- `tailwindcss` (`^3.4.0`)
All of these are already part of Annadhara's web client.

### Mobile (Flutter) Dependencies
All packages are already standard in the mobile app:
- `flutter` SDK
- `provider` (`^6.1.2`)
- `http` (`^1.2.2`)

---

## 5. Environment Variables Required

Add these keys to your backend `.env` file (e.g. `server/.env`):

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `GROQ_API_KEY` | **Yes** (for live LLM) | `""` | Free API key from console.groq.com. If omitted, returns a friendly configuration notice. |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | LLM model ID on Groq (or `llama-3.1-8b-instant`, `qwen/qwen3.8-27b`). |
| `GROQ_TIMEOUT` | No | `15000` | Groq request timeout in milliseconds. |
| `AI_MAX_TOKENS` | No | `1024` | Maximum completion tokens. |
| `AI_RATE_LIMIT` | No | `30` | In-memory rate limit cap per user per minute. |
| `TAVILY_API_KEY` | No | `""` | Free search key from tavily.com. If omitted, uses curated offline FSSAI safety rules. |
| `TAVILY_MAX_RESULTS` | No | `5` | Maximum search citations returned. |
| `TAVILY_SEARCH_DEPTH` | No | `basic` | Search depth (`basic` or `advanced`). |
| `TAVILY_TIMEOUT` | No | `8000` | Tavily request timeout in milliseconds. |

> **Note:** Never commit actual API keys to GitHub or production repositories.

---

## 6. Shared Files Outside the Chatbot Feature (Dependencies)

The chatbot integrates with the following existing Annadhara platform components:
1. **Backend Auth Middleware** (`server/src/middleware/auth.js`):
   - Used in `aiRoutes.js` to protect endpoints via the `protect` middleware.
2. **Existing Mongoose Models** (`server/src/models/`):
   - `User.js`, `Organization.js`, `Donation.js`, `Reservation.js`, `PickupTask.js`, `HandoverRecord.js`, `AuditLog.js`.
   - Read-only data queries in `aiPlatformService.js` reference these models to furnish role-specific account stats.
3. **Frontend Axios Client** (`client/src/api/axios.js`):
   - Used by `aiEndpoints.js` (or `endpoints.js`) for base URL, headers, and JWT bearer token injection.
4. **Frontend Auth Context** (`client/src/context/AuthContext.jsx`):
   - Used by `ChatWindow.jsx` to access `user` and `role`.
5. **Mobile API Service** (`mobile/lib/core/network/api_service.dart`):
   - Used by `AiProvider` to send HTTP requests with stored JWT auth tokens.

---

## 7. Step-by-Step Integration Guide for the Original Annadhara Project

To cleanly integrate this extracted chatbot feature into the original Annadhara repository without breaking existing functionality, perform the following steps:

### Step 1: Copy Backend Files
1. Copy `backend/controllers/aiController.js` to `server/src/controllers/aiController.js`.
2. Copy `backend/middleware/aiRateLimiter.js` to `server/src/middleware/aiRateLimiter.js`.
3. Copy `backend/models/AIConversation.js` to `server/src/models/AIConversation.js`.
4. Copy `backend/routes/aiRoutes.js` to `server/src/routes/aiRoutes.js`.
5. Copy all 7 files from `backend/services/` to `server/src/services/`.
6. Copy `backend/tests/ai.test.js` to `server/tests/ai.test.js`.

### Step 2: Modify `server/src/app.js`
In `server/src/app.js`:
1. Import `aiRoutes`:
   ```javascript
   const aiRoutes = require('./routes/aiRoutes');
   ```
2. Mount the routes before the 404 handler:
   ```javascript
   app.use(['/api/ai', '/ai'], aiRoutes);
   ```
3. (Optional) Add `ai: '/api/ai'` to the root welcome endpoint JSON catalog.

### Step 3: Copy Frontend Files
1. Copy `frontend/components/AnnadharaAIWidget.jsx`, `ChatWindow.jsx`, and `CitationList.jsx` into `client/src/components/ai/` (or `src/components/ai/`).
2. Copy `frontend/pages/AiChatTest.jsx` into `client/src/pages/AiChatTest.jsx` (or `src/pages/AiChatTest.jsx`).

### Step 4: Modify Frontend API Endpoints (`api/endpoints.js`)
Append the `aiApi` object from `frontend/api/aiEndpoints.js` into your existing `src/api/endpoints.js` (or `client/src/api/endpoints.js`):
```javascript
// Annadhara AI Assistant
export const aiApi = {
  chat: (data, role) =>
    api.post('/ai/chat', data, {
      headers: role ? { 'x-test-role': role } : {},
    }),
  getStatus: () => api.get('/ai/status'),
  getConversations: (role) =>
    api.get('/ai/conversations', {
      headers: role ? { 'x-test-role': role } : {},
    }),
  getConversationById: (id, role) =>
    api.get(`/ai/conversations/${id}`, {
      headers: role ? { 'x-test-role': role } : {},
    }),
  deleteConversation: (id, role) =>
    api.delete(`/ai/conversations/${id}`, {
      headers: role ? { 'x-test-role': role } : {},
    }),
};
```

### Step 5: Mount Chatbot Widget in `AuthenticatedLayout.jsx`
In `src/components/layout/AuthenticatedLayout.jsx` (or `client/src/...`):
1. Import the widget:
   ```javascript
   import { AnnadharaAIWidget } from '../ai/AnnadharaAIWidget';
   ```
2. Render `<AnnadharaAIWidget />` right inside the main container before closing the layout root:
   ```jsx
   {/* Annadhara AI Assistant Floating Widget */}
   <AnnadharaAIWidget />
   ```

### Step 6: Add Routes to `App.jsx`
In `src/App.jsx` (or `client/src/App.jsx`):
1. Import `AiChatTest`:
   ```javascript
   import { AiChatTest } from './pages/AiChatTest';
   ```
2. Add public test routes inside `<Routes>`:
   ```jsx
   <Route path="/ai" element={<AiChatTest />} />
   <Route path="/test-ai" element={<AiChatTest />} />
   ```

### Step 7: (Optional) Add Navigation Link in `Navbar.jsx`
In `src/components/layout/Navbar.jsx` (or `client/src/...`), add an "Annadhara AI" button or link pointing to `/ai`.

### Step 8: (Optional Mobile Integration)
If integrating into Flutter:
1. Copy `mobile/models/ai_message_model.dart` to `mobile/lib/models/`.
2. Copy `mobile/providers/ai_provider.dart` to `mobile/lib/providers/`.
3. Copy `mobile/screens/annadhara_ai_screen.dart` and `citation_widget.dart` to `mobile/lib/screens/ai/`.
4. In `mobile/lib/core/constants/api_constants.dart`, add:
   ```dart
   static const String aiChat = '/ai/chat';
   static const String aiStatus = '/ai/status';
   static const String aiConversations = '/ai/conversations';
   ```
5. In `mobile/lib/main.dart`, register `ChangeNotifierProvider(create: (_) => AiProvider())`.
6. In `mobile/lib/screens/main_navigation_shell.dart`, add the floating action button to open `AnnadharaAiScreen`.
