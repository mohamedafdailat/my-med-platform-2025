Deployment Instructions - MedPlatform Maroc
Backend Deployment (Vercel)

Prepare the backend:

Ensure server.js is configured to use process.env.PORT.
Update package.json with a start script:"start": "node server.js"




Push to GitHub:

Create a GitHub repository for the backend.
Push the backend/ directory:git init
git add .
git commit -m "Initial backend commit"
git remote add origin <github-repo-url>
git push -u origin main




Deploy to Vercel:

Log in to Vercel.
Import the GitHub repository.
Configure environment variables in Vercel dashboard (same as .env):
PORT, FRONTEND_URL, EMAIL_USER, EMAIL_PASS, OPENAI_API_KEY, FIREBASE_SERVICE_ACCOUNT, FIREBASE_STORAGE_BUCKET.


Set the root directory to backend/.
Deploy the project.


Verify deployment:

Access the deployed API at the Vercel-provided URL (e.g., https://your-backend.vercel.app/api).
Test endpoints using Postman or cURL.



Frontend Deployment (Vercel)

Prepare the frontend:

Ensure frontend/package.json has a build script:"build": "react-scripts build"


Update API endpoints in frontend/src/services/api.js to use the backend's deployed URL.


Push to GitHub:

Create a separate GitHub repository for the frontend.
Push the frontend/ directory:cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin <github-repo-url>
git push -u origin main




Deploy to Vercel:

Import the frontend repository in Vercel.
Configure environment variables (REACT_APP_FIREBASE_*).
Set the root directory to frontend/.
Deploy the project.


Verify deployment:

Access the frontend at the Vercel-provided URL (e.g., https://your-frontend.vercel.app).
Test login, content access, and AI features.



Firebase Configuration

Ensure Firestore and Storage rules are applied (see SETUP.md).
Update FRONTEND_URL in backend .env to the deployed frontend URL.
Monitor Firebase usage in the Firebase Console to avoid exceeding quotas.

CI/CD

Vercel automatically deploys on git push to the main branch.
Set up GitHub Actions for linting/tests if needed:name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm install
      - run: npm test



Scaling Considerations

Firebase: Upgrade to Blaze plan for higher quotas if needed.
Vercel: Consider Pro plan for increased bandwidth or custom domains.
Monitoring: Use Firebase Analytics and Vercel Logs for debugging.

Rollback

Revert to a previous deployment in Vercel dashboard if issues arise.
Maintain backups of Firestore data using Firebase Export.

