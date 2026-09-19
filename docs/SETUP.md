# Setup - MedPlatform

## Prerequisites

- Node.js 20 or later
- npm 8 or later
- Firebase project with Authentication, Firestore, and Storage enabled
- Groq API key for DocBuddy
- xAI key if the authenticated xAI routes are used
- Git

## Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```bash
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

FIREBASE_STORAGE_BUCKET=
FIREBASE_DATABASE_URL=
FIREBASE_SERVICE_ACCOUNT=
FIREBASE_SERVICE_ACCOUNT_BASE64=

GROQ_API_KEY=
GROQ_CHAT_MODEL=openai/gpt-oss-20b
XAI_API_KEY=
XAI_API_KEY_2=
```

Use either `FIREBASE_SERVICE_ACCOUNT` with the full JSON value or `FIREBASE_SERVICE_ACCOUNT_BASE64` with the base64-encoded JSON. Keep provider keys server-side only; never add Groq, xAI, OpenAI, Firebase private keys, or service-account JSON to `frontend/.env`.

Run:

```bash
npm run dev
```

## Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```bash
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
REACT_APP_BACKEND_URL=http://localhost:5000
```

Run:

```bash
npm start
```

The frontend runs at `http://localhost:3000` and calls the backend at `http://localhost:5000/api`.

## Production Notes

- Deploy the app as one Railway service from the repository root.
- Railway should use the root `Dockerfile`.
- Do not set `REACT_APP_BACKEND_URL` in Railway for the one-service deployment; the production frontend uses same-origin `/api`.
- Add the generated Railway domain to Firebase Authentication authorized domains.
- See `docs/DEPLOYMENT.md` for the full production checklist.

## Firebase

1. Create a Firebase project.
2. Enable Authentication with Email/Password.
3. Enable Firestore and Storage.
4. Apply production-ready Firestore and Storage rules before public launch.
5. Create a Firebase service account for the backend and rotate it if an older key was ever committed.

## Verification

```bash
node --check backend/server.js
npm --prefix frontend run build
```

Then test login, dashboard loading, Firebase reads/writes, protected pages, and DocBuddy chat.
