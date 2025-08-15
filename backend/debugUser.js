// C:\my-med-platform\backend\debugUser.js
import { db } from './src/config/firebase.js';
import { doc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';

async function debugUserData(uid) {
  try {
    console.log(`🔍 Debugging user data for UID: ${uid}\n`);
    
    // Check main user document
    console.log('1. Checking main user document...');
    const userDoc = doc(db, 'users', uid);
    const userSnap = await getDoc(userDoc);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('✅ User document found:');
      console.log('   - Email:', userData.email);
      console.log('   - Display Name:', userData.displayName);
      console.log('   - Role:', userData.role);
      console.log('   - Subscription Status:', userData.subscriptionStatus);
      console.log('   - Stats:', JSON.stringify(userData.stats, null, 2));
      console.log('   - Progress:', JSON.stringify(userData.progress, null, 2));
    } else {
      console.log('❌ User document not found!');
      return;
    }
    
    // Check progress history
    console.log('\n2. Checking progress history...');
    const evolutionRef = collection(db, 'userProgress', uid, 'history');
    const q = query(evolutionRef, orderBy('timestamp', 'desc'));
    
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log('⚠️  No progress history found');
      } else {
        console.log(`✅ Found ${querySnapshot.size} progress history entries:`);
        querySnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   Entry ${index + 1}:`, {
            id: doc.id,
            coursesCompleted: data.coursesCompleted,
            quizzesTaken: data.quizzesTaken,
            studyHours: data.studyHours,
            timestamp: data.timestamp?.toDate?.() || data.timestamp
          });
        });
      }
    } catch (historyError) {
      console.log('❌ Error fetching progress history:', historyError.message);
    }
    
    // Check Firestore rules
    console.log('\n3. Testing Firestore permissions...');
    try {
      await getDoc(userDoc);
      console.log('✅ Read permission for user document: OK');
    } catch (permError) {
      console.log('❌ Read permission error:', permError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test with the user we created
async function main() {
  // Replace with the actual UID from the user creation
  const testUID = process.argv[2];
  
  if (!testUID) {
    console.log('Usage: node debugUser.js <USER_UID>');
    console.log('Example: node debugUser.js abc123xyz789');
    process.exit(1);
  }
  
  await debugUserData(testUID);
  process.exit(0);
}

main();