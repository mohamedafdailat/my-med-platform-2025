import { auth } from './src/config/firebase.js';
import { db } from './src/config/firebase.js';

async function addUser(email, password, displayName, role = 'student', semester = null) {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      disabled: false,
    });

    // Définir les Custom Claims
    await auth.setCustomUserClaims(userRecord.uid, { role });
    console.log(`✅ Custom claim 'role' set to ${role} for UID: ${userRecord.uid}`);

    // Ajouter l'utilisateur dans Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: userRecord.displayName,
      role,
      ...(role === 'student' && { semester, level: semester }), // semester uniquement pour les étudiants
      createdAt: new Date().toISOString(),
      subscriptionStatus: role === 'student' ? 'paid' : null,
      ...(role === 'student' && {
        subscription: {
          type: 'annual',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          paymentMethod: 'credit_card',
          lastPayment: new Date().toISOString(),
          amount: 299.99,
        },
      }),
      // ... (autres champs comme stats, progress, etc. pour étudiants)
    });

    if (role === 'student') {
      const historyRef = db.collection('userProgress').doc(userRecord.uid).collection('history');
      const historyData = [
        { coursesCompleted: 12, quizzesTaken: 45, studyHours: 89, timestamp: new Date() },
        // ... (autres entrées)
      ];
      for (let data of historyData) await historyRef.add(data);
    }

    console.log(`✅ User created successfully: ${displayName} (UID: ${userRecord.uid}, Role: ${role})`);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  }
}

async function main() {
  await addUser('admin_1@medplatform.com', 'AdminPassword123!', 'Admin User', 'admin');
  await addUser('mohamed_student1@medplatform.com', 'StudentPassword123!', 'Mohamed Alami', 'student', 'S1');
  console.log('\n✅ User creation process completed!');
}

main();