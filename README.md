# TaskMan — Cost-Efficient Multi-Board AI Task & Productivity Engine

TaskMan is a high-performance, cost-optimized multi-workspace task management web application powered by **Google Gemini AI**, **Firebase Authentication**, and **Cloud Firestore**.

---

## 💰 Cost-Efficient Architecture & Economics

TaskMan is engineered specifically to operate **at or near $0.00/month (100% within Google Cloud Free Tier)** under standard multi-user workloads:

| Cloud Component | Free Tier Allowance | TaskMan Optimization Strategy | Estimated Cost |
| :--- | :--- | :--- | :--- |
| **Google Cloud Run** | 2,000,000 requests/mo<br>360,000 vCPU-sec/mo<br>180,000 GiB-sec/mo | **Scale-to-Zero (`--min-instances=0`)** + **`--cpu-throttling`** (CPU only metered during active requests) + **`--concurrency=80`** (80 users/instance) + **`--memory=512Mi`** | **$0.00 / month** |
| **Google Gemini AI** | Free rate tiers & micro-pricing | **Primary `gemini-3.1-flash-lite`** ($0.075/1M tokens) + **In-Memory TTL Caching** (eliminates duplicate token costs) + **Strict `maxOutputTokens` capping** | **<$0.05 / month** |
| **Cloud Firestore** | 50,000 reads/day<br>20,000 writes/day<br>1 GiB storage | **Client-side optimistic persistence** + selective granular updates to avoid redundant document collection queries | **$0.00 / month** |
| **Network Egress** | 1 GiB / month egress free | **Gzip / Brotli compression (`compression`)** + **Immutable static asset cache headers (`max-age=31536000`)** | **$0.00 / month** |
| **Secret Manager** | 6 active secret versions | Single `GEMINI_API_KEY` version mapped via environment binding | **$0.00 / month** |

---

## 🌟 Core Architecture & Features

1. **Multi-Board Workspaces**: Create, customize, switch between, and manage multiple task boards (e.g. *Personal*, *Work Projects*, *Side Hustle*).
2. **Drag & Drop Kanban**: Interactive column management with real-time state synchronization and energy level indicators.
3. **Magic AI Task Breakdown**: Decomposes complex objectives into 3-5 actionable subtasks with individual time estimates using Gemini Flash-Lite.
4. **Smart Auto-Prioritization (Eisenhower Matrix)**: AI decision matrix categorizing tasks into *Do First*, *Schedule*, *Delegate*, and *Minimize* with urgency and importance scoring.
5. **Natural Language & Voice Quick-Add**: Hands-free voice dictation (Web Speech API) and conversational task parsing.
6. **AI Daily Briefing**: Synthesizes top focus priorities, quick wins, and tailored productivity insights.
7. **Integrated Pomodoro Focus Timer**: 25/5/15 minute cycles with native audio chime, linked task status tracking, and streak tracking.
8. **End-to-End Security Hardening**: Strict owner-bound data isolation `/users/{userId}/boards/{boardId}/tasks/{taskId}`.

---

## 🛡️ Agentic Threat Summary (OWASP & 5 Threat Zones)

| Threat Zone | OWASP Ref | Identified Risk Scenario | Engineering Countermeasure | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Input Surfaces** | OWASP LLM02 / A03 | Malicious prompt injections, excessive text payloads | Strict `@google/genai` schema constraints; input truncation (300-500 chars); defensive null-safe destructuring | **Secured** |
| **2. Planning & Reasoning** | OWASP LLM01 | System instruction override, matrix manipulation | Context-separated system instructions; structured JSON schema enforcement; deterministic fallback heuristics | **Secured** |
| **3. Tool Execution** | OWASP LLM07 / A01 | Unauthenticated execution, SSRF | Server-side `/api/ai/*` proxying; zero browser-side Gemini key exposure; bounded JSON parser | **Secured** |
| **4. Memory & State** | OWASP A01 / A04 | Cross-tenant document tampering, insecure defaults | Strict owner-bound paths `/users/{userId}/boards/{boardId}/tasks/{taskId}`; owner validation in `firestore.rules` | **Secured** |
| **5. Inter-System Comm.** | OWASP A02 / LLM06 | Secret/Token leakage, unencrypted transport | Dynamic Secret Manager retrieval; zero hardcoded credentials; HTTPS-only communication | **Secured** |

---

## 🔒 Cloud Firestore Security Rules

Deploy the following security rules to enforce owner-bound data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /boards/{boardId} {
        allow read, write: if isOwner(userId);

        match /tasks/{taskId} {
          allow read, write: if isOwner(userId);
        }
      }

      match /interactions/{interactionId} {
        allow read, write: if isOwner(userId);
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🚀 Cost-Efficient Cloud Run & Secret Manager Deployment Guide

### 1. Prerequisites & API Activation
Ensure you have the Google Cloud SDK (`gcloud`) installed and configured:

```bash
# Set default project
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Secret Manager Configuration (Zero Hardcoding)
Store your `GEMINI_API_KEY` securely in Secret Manager:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Obtain your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Grant the Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy to Google Cloud Run (Cost-Optimized Profile)
Deploy the container with scale-to-zero, tight memory bounds, and high concurrency:

```bash
# Build & deploy container with maximum cost efficiency
gcloud run deploy taskman \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --concurrency 80 \
  --cpu 1 \
  --memory 512Mi \
  --cpu-throttling \
  --execution-environment gen2 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production

# Apply mandatory campaign verification label
gcloud run services update taskman \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Comprehensive Walkthrough & Verification Test Cases

| Test Case | User Interaction / Trigger | Expected Verification Result |
| :--- | :--- | :--- |
| **TC-01: Multi-Board Navigation** | Click Board Switcher dropdown in header, select "Work Projects" or "Create New Board" | Active workspace switches instantly; tasks filter to selected board; new board modal creates custom columns with chosen accent colors. |
| **TC-02: Natural Language Quick-Add** | Type: *"Launch marketing campaign by Friday at 2pm high priority with deep energy"* in Quick Add bar and press Enter | AI decomposes text into Title, Priority (`high`), Energy (`high`), Due Date, and estimated minutes; preview chip allows 1-click addition to board. |
| **TC-03: Voice Input Dictation** | Click the Microphone button on the Quick Add bar and speak a task description | SpeechRecognition activates; transcript streams into input; triggers auto-parsing upon completion. |
| **TC-04: Kanban Drag & Drop** | Drag a Task Card from "To Do" to "In Progress" or "Done" | Card drops smoothly; task status and column update immediately and persist to Firestore/local storage. |
| **TC-05: Magic AI Breakdown** | Click "Magic Breakdown" button on any task card | Calls `/api/ai/breakdown`; returns Flash-Lite decomposed subtasks in <1s; subsequent calls hit in-memory cache instantly with 0 tokens billed. |
| **TC-06: Auto-Prioritize (Eisenhower)** | Click "Auto-Prioritize" in navbar | Evaluates all active tasks; displays 4-quadrant Eisenhower preview; clicking "Apply" updates task priorities across board. |
| **TC-07: AI Daily Briefing** | Click "Daily Briefing" in navbar | Generates greeting, board status, Top 3 Focus Targets, and Quick Win task; clicking "Focus 25m" launches Pomodoro on that task. |
| **TC-08: Pomodoro Timer Execution** | Click "Focus" on any task or the Pomodoro pill in navbar | Timer opens with linked task; Start/Pause counts down; plays synthesized chime upon session completion and increments streak counter. |
| **TC-09: Energy Level Filtering** | Click "🟢 Low", "🟡 Med", or "🔴 High" energy filter chips | Kanban board instantly filters cards matching the required cognitive energy level. |
| **TC-10: Health Check & Cache Status** | Access `/api/health` | Returns `status: "ok"`, active cache entries, and confirmation of cost optimization mode. |

