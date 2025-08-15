import { db, auth } from './src/config/firebase.js';

async function addStudentUser(email, password, displayName, semester = 'S1') {
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      disabled: false
    });

    // Create user document in Firestore with all required data
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: 'student',
      semester: semester,
      level: semester,
      createdAt: new Date().toISOString(),
      subscriptionStatus: 'paid', // Root level for ProtectedRoute
      subscription: {
        type: 'annual',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'credit_card',
        lastPayment: new Date().toISOString(),
        amount: 299.99
      },
      stats: {
        coursesCompleted: 12,
        quizzesTaken: 45,
        flashcardsMastered: 234,
        videosWatched: 67,
        studyHours: 89
      },
      progress: {
        weekly: [8, 6, 9, 7, 10],
        monthly: [32, 28, 35, 30],
        categories: {
          anatomy: 65,
          physiology: 78,
          pharmacology: 52
        }
      },
      academic: {
        university: 'Université Mohammed V',
        faculty: 'Faculté de Médecine et de Pharmacie',
        currentSemester: semester,
        academicYear: '2024-2025',
        gpa: 3.7
      },
      preferences: {
        language: 'fr',
        studyReminders: true,
        emailNotifications: true,
        difficulty: 'intermediate'
      },
      profile: {
        avatar: null,
        bio: `Étudiant en médecine - ${semester}`,
        dateOfBirth: null,
        phone: null,
        city: 'Rabat',
        country: 'Morocco'
      }
    });

    // Create initial progress history for the evolution chart
    // Using Admin SDK syntax for subcollections
    const historyRef = db.collection('userProgress').doc(userRecord.uid).collection('history');
    const historyData = [
      { coursesCompleted: 10, quizzesTaken: 40, studyHours: 85, timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) },
      { coursesCompleted: 10, quizzesTaken: 41, studyHours: 86, timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { coursesCompleted: 11, quizzesTaken: 42, studyHours: 87, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { coursesCompleted: 11, quizzesTaken: 43, studyHours: 87, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
      { coursesCompleted: 11, quizzesTaken: 43, studyHours: 88, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { coursesCompleted: 12, quizzesTaken: 44, studyHours: 88, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { coursesCompleted: 12, quizzesTaken: 44, studyHours: 88, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { coursesCompleted: 12, quizzesTaken: 45, studyHours: 89, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { coursesCompleted: 12, quizzesTaken: 45, studyHours: 89, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { coursesCompleted: 12, quizzesTaken: 45, studyHours: 89, timestamp: new Date() }
    ];

    for (let i = 0; i < historyData.length; i++) {
      await historyRef.add(historyData[i]);
      console.log(`   ✓ Added history entry ${i + 1}/10`);
    }

    console.log(`✅ Student user created successfully:`);
    console.log(`   Name: ${displayName}`);
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Semester: ${semester}`);
    console.log(`   Subscription: Active (Annual)`);
    console.log(`   Role: student`);
  } catch (error) {
    console.error('❌ Error creating student user:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
  }
}

// Helper function to create multiple students
async function createTestStudents() {
  const students = [
    { email: 'student.s1_test@medplatform.com', name: 'Ahmed Benali', semester: 'S1' },
    { email: 'student.s3_test@medplatform.com', name: 'Fatima Alaoui', semester: 'S3' },
    { email: 'student.s6_test@medplatform.com', name: 'Youssef Kadiri', semester: 'S6' },
  ];

  for (const student of students) {
    await addStudentUser(student.email, 'TestPassword123!', student.name, student.semester);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting user creation process...\n');
    await addStudentUser('mohamed123student@medplatform.com', 'StudentPassword123!', 'Mohamed Alami', 'S1');
    // await createTestStudents();
    console.log('\n✅ User creation process completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();