// C:\my-med-platform\frontend\clean.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDY_l4HbA2tkmTjl8Q9D5oUrqC-NMDxzPw",
  authDomain: "medplatform-maroc.firebaseapp.com",
  projectId: "medplatform-maroc",
  storageBucket: "medplatform-maroc.firebasestorage.app",
  messagingSenderId: "1083925602007",
  appId: "1:1083925602007:web:a7bee366271cb4b108da92",
  measurementId: "G-LGGYKLZFV6"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

const cleanFirestoreDecks = async () => {
  try {
    // Authenticate with a user (replace with your test user credentials)
    const email = "your-test-user@example.com"; // Replace with a valid user email
    const password = "your-password"; // Replace with the user's password
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Authenticated as:', auth.currentUser.email);

    console.log('🚀 Starting Firestore cleanup for flashcards collection...');
    const q = query(collection(db, 'flashcards'), where('ownerId', '==', 'I0AuFH4Mhoa2jioTmuP7JJ4U5RL2'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('ℹ️ No decks found for ownerId: I0AuFH4Mhoa2jioTmuP7JJ4U5RL2');
      return;
    }

    let updatedCount = 0;
    let deletedCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      console.log(`📄 Processing deck ${docSnapshot.id}:`, data.title || 'Untitled');

      // Convert deprecated 'cards' to 'flashcards'
      if (data.cards && !data.flashcards) {
        console.log(`🔄 Updating deck ${docSnapshot.id} to use flashcards field`);
        await updateDoc(doc(db, 'flashcards', docSnapshot.id), {
          flashcards: data.cards,
          cards: null // Remove deprecated field
        });
        updatedCount++;
      }

      // Delete decks with no valid flashcards
      if (!data.flashcards || !Array.isArray(data.flashcards) || data.flashcards.length === 0) {
        console.log(`🗑️ Deleting invalid deck ${docSnapshot.id}: No valid flashcards`);
        await deleteDoc(doc(db, 'flashcards', docSnapshot.id));
        deletedCount++;
      } else {
        // Validate flashcards
        const validFlashcards = data.flashcards.filter(card => 
          (card.question && card.answer && typeof card.question === 'string' && typeof card.answer === 'string') ||
          (card.front && card.back && typeof card.front === 'string' && typeof card.back === 'string')
        );
        if (validFlashcards.length === 0) {
          console.log(`🗑️ Deleting deck ${docSnapshot.id}: No valid cards after validation`);
          await deleteDoc(doc(db, 'flashcards', docSnapshot.id));
          deletedCount++;
        } else if (validFlashcards.length < data.flashcards.length) {
          console.log(`🔄 Updating deck ${docSnapshot.id} with valid flashcards only`);
          await updateDoc(doc(db, 'flashcards', docSnapshot.id), {
            flashcards: validFlashcards
          });
          updatedCount++;
        }
      }
    }

    console.log(`✅ Cleanup completed: ${updatedCount} decks updated, ${deletedCount} decks deleted`);
  } catch (error) {
    console.error('❌ Error during Firestore cleanup:', error);
  } finally {
    // Sign out to avoid leaving the session open
    await auth.signOut();
    console.log('🔑 Signed out');
  }
};

cleanFirestoreDecks().then(() => {
  console.log('🏁 Cleanup script finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error in cleanup script:', error);
  process.exit(1);
});