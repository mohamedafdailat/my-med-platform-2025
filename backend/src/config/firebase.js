// C:\my-med-platform\backend\src\config\firebase.js
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

// Synchronously read the service account JSON file
const serviceAccountPath = new URL('./serviceAccountKey.json', import.meta.url);
const serviceAccountContent = await readFile(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountContent);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://medplatform-maroc.firebaseio.com" // Adjust to your project
});

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };