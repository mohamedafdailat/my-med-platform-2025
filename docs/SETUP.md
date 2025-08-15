Setup Instructions - MedPlatform Maroc
Prerequisites

Node.js (v18 or later)
npm (v9 or later)
Firebase project with Firestore, Storage, and Authentication enabled
Gmail account for email notifications
OpenAI API key for AI features
Git

Backend Setup

Clone the repository:
git clone <repository-url>
cd backend


Install dependencies:
npm install


Configure environment variables:Create a .env file in backend/ with the following:
PORT=5000
FRONTEND_URL=http://localhost:3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
OPENAI_API_KEY=your-openai-api-key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
FIREBASE_STORAGE_BUCKET=your-storage-bucket


Obtain EMAIL_PASS from Google (App Passwords).
Get FIREBASE_SERVICE_ACCOUNT from Firebase Console > Project Settings > Service Accounts.
Get OPENAI_API_KEY from OpenAI dashboard.


Run the server:

Development (with auto-reload):npm run dev


Production:npm start





Frontend Setup

Navigate to frontend directory:
cd ../frontend


Install dependencies:
npm install


Configure environment variables:Create a .env file in frontend/ with:
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id


Run the frontend:
npm start

Access at http://localhost:3000.


Firebase Configuration

Create a Firebase project at console.firebase.google.com.
Enable Firestore, Storage, and Authentication (Email/Password provider).
Set Firestore rules:rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.role == 'admin';
      allow read: if request.auth.uid == userId;
    }
    match /videos/{videoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['teacher', 'admin'];
    }
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['teacher', 'admin'];
    }
    match /flashcards/{flashcardId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['teacher', 'admin'];
    }
    match /progress/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}


Set Storage rules:service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['teacher', 'admin'];
    }
  }
}



Database Seeding

Seed initial data:node database/seed.js

This populates Firestore with data from database/seeds/sampleUsers.json and sampleContent.json.

Testing

Run backend tests:npm test



Troubleshooting

Firebase errors: Ensure FIREBASE_SERVICE_ACCOUNT is correctly formatted in .env.
Email errors: Verify EMAIL_USER and EMAIL_PASS are correct.
CORS issues: Check FRONTEND_URL matches the frontend's URL.

