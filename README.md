# MedPlatform

MedPlatform is an educational platform for medical students. It includes a React frontend, an Express/Firebase backend, and AI-assisted study features such as DocBuddy.

## Project Structure

```text
my-med-platform/
  backend/          Express API and Firebase Admin integration
  frontend/         React application
  database/         Seed data and database helpers
  docs/             Setup, deployment, and API documentation
  Dockerfile        Single-service Railway deployment
```

## Local Development

Install backend dependencies:

```bash
cd backend
npm install
npm run dev
```

Install frontend dependencies in another terminal:

```bash
cd frontend
npm install
npm start
```

The frontend runs at `http://localhost:3000` and the backend runs at `http://localhost:5000`.

## Environment Files

Use local `.env` files only on your machine:

- `backend/.env`
- `frontend/.env`

Never commit real `.env` files, Firebase service-account JSON, backup env files, or API keys. Use the `.env.example` files as templates.

## Deployment

Production is designed as one Railway service from the repository root:

- Railway builds with the root `Dockerfile`.
- The Docker build compiles `frontend/build`.
- `backend/server.js` serves both `/api` and the compiled frontend.

See `docs/DEPLOYMENT.md` for the complete release checklist.

## Verification

```bash
node --check backend/server.js
npm --prefix frontend run build
```

After deployment, verify `/health`, `/api/health`, authentication, Firebase content, and DocBuddy chat.
