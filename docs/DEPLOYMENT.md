# Deployment - MedPlatform

This project deploys as one Railway service:

- `backend/server.js` serves the API under `/api`.
- The Docker build compiles the React app into `frontend/build`.
- The backend serves the compiled React app from the same public Railway URL.

## 1. Security Before Push

Keep these files out of Git and Docker images:

- `.env`, `.env.*`
- `backend/.env`, `frontend/.env`, `chatbot-server/.env`
- `*.bak`, `*.bak*`
- `serviceAccountKey.json`
- `frontend/build`, `backend/build`, `dist`
- `repo_tree.txt`, `Docs de tests/`

Important: older Git history contained Firebase and env backup files. Treat every key that was ever committed as exposed. Rotate the Firebase service account key, Groq key, xAI/OpenAI keys, and any other provider token before production use.

## 2. Verify Locally

Run:

```bash
node --check backend/server.js
npm --prefix frontend run build
git status --ignored --short
```

Confirm real environment files show as ignored and are not staged.

## 3. Push To GitHub

The repository should remain private.

```bash
git add Dockerfile .dockerignore .gitignore docs/DEPLOYMENT.md docs/SETUP.md backend frontend
git status --short
git diff --cached
git commit -m "Prepare Railway deployment"
git push origin main
```

Do not stage local `.env` files, backup env files, service-account JSON files, `repo_tree.txt`, or local test documents.

## 4. Deploy On Railway

1. Create a new Railway project from the private GitHub repository.
2. Deploy from the repository root.
3. Let Railway use the root `Dockerfile`.
4. Add the environment variables below.
5. Deploy and open the generated Railway URL.

Railway injects `PORT`; do not hardcode it.

## 5. Railway Variables

Runtime variables:

```bash
NODE_ENV=production
GROQ_API_KEY=
GROQ_CHAT_MODEL=openai/gpt-oss-20b
XAI_API_KEY=
XAI_API_KEY_2=
FIREBASE_SERVICE_ACCOUNT_BASE64=
FIREBASE_STORAGE_BUCKET=
FIREBASE_DATABASE_URL=
FRONTEND_URL=https://your-app.up.railway.app
CORS_ORIGIN=https://your-app.up.railway.app
```

Prefer `FIREBASE_SERVICE_ACCOUNT_BASE64` for Railway. Encode the full Firebase service-account JSON as base64 and paste the result as one line.

React build-time variables:

```bash
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
```

For the one-service Railway deployment, do not set `REACT_APP_BACKEND_URL`. The frontend should call same-origin `/api`.

## 6. Firebase Configuration

After Railway provides the public URL:

1. Add the Railway domain to Firebase Authentication authorized domains.
2. Confirm Firestore and Storage production rules are applied.
3. Confirm the Firebase service account used by Railway has the required permissions.

## 7. Production Checks

After deployment:

```bash
curl https://your-app.up.railway.app/health
curl https://your-app.up.railway.app/api/health
```

Then test:

- Home page and route refreshes.
- Register, login, logout, and protected pages.
- Dashboard, courses, videos, flashcards, quiz flows.
- Firebase reads and writes.
- DocBuddy chatbot through `/api/ai/chat`.
- Railway logs for Firebase parsing, CORS, CSP, and AI provider errors.

## 8. Rollback

Use Railway deployment history to roll back to the previous successful deployment.
