# Deployment - MedPlatform

This project deploys as one Railway service:

- `backend/server.js` serves the API under `/api`.
- The Docker build compiles the React app into `frontend/build`.
- The backend serves the compiled React app from the same public Railway URL.
- The multi-stage Docker image uses Node.js 22 and runs as the unprivileged `node` user.
- Only public Firebase web configuration is supplied to the frontend build. Server credentials are runtime variables.

## Existing Railway Target

- GitHub: `mohamedafdailat/my-med-platform-2025`, branch `main`.
- Project: `happy-forgiveness` (`c09e9625-3b44-46fc-8f51-968af4fdeb21`).
- Environment: `production` (`72ae5847-f479-4fef-839c-d817655393b7`).
- Service: `my-med-platform-2025` (`a15226ef-835b-4f2c-a074-5de18f7ddf4d`).
- Public URL: https://my-med-platform-2025-production-e53b.up.railway.app
- Repository root: `/`; Dockerfile: `/Dockerfile`.
- Start command: `node backend/server.js`.
- Health check: `/health`, timeout 120 seconds.

The service is connected to GitHub. Push reviewed changes to `main` to deploy.

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

1. Open the existing Railway service above.
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
XAI_CHAT_MODEL=grok-3-mini
FIREBASE_SERVICE_ACCOUNT_BASE64=
FIREBASE_STORAGE_BUCKET=
FIREBASE_DATABASE_URL=
FRONTEND_URL=https://your-app.up.railway.app
CORS_ORIGIN=https://your-app.up.railway.app
```

Prefer `FIREBASE_SERVICE_ACCOUNT_BASE64` for Railway. Encode the full Firebase service-account JSON as base64 and paste the result as one line.

Use the existing `backend/serviceAccountKey.json` only as the local source for this value; never commit or upload that file in the Docker build context. When using the CLI, pass secret values through `railway variable set KEY --stdin --skip-deploys`, not command-line arguments, and do not print variable-list output. Apply all required variables before triggering a deployment.

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

The Dockerfile declares these public variables with `ARG`, as required by [Railway's Dockerfile build documentation](https://docs.railway.com/builds/dockerfiles). It fails the build if required Firebase configuration is missing. Changes to these variables require a new build.

For the one-service Railway deployment, do not set `REACT_APP_BACKEND_URL`, `REACT_APP_API_URL`, or `REACT_APP_CHATBOT_URL`. The frontend calls same-origin `/api`. Local `.env` files retain their localhost values and are excluded from the image.

## 6. Firebase Configuration

After Railway provides the public URL:

1. Add the Railway domain to Firebase Authentication authorized domains.
2. Confirm Firestore and Storage production rules are applied.
3. Confirm the Firebase service account used by Railway has the required permissions.

The domain `my-med-platform-2025-production-e53b.up.railway.app` is authorized in the existing Firebase project. Existing authorized domains are preserved.

## 7. Production Checks

After deployment:

```bash
curl https://my-med-platform-2025-production-e53b.up.railway.app/health
curl https://my-med-platform-2025-production-e53b.up.railway.app/api/health
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
