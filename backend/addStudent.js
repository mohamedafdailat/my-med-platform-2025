const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Chemin vers le fichier de clé de service téléchargé
const serviceAccount = require('./serviceAccountKey.json'); // Ajuste le chemin si nécessaire

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();
const auth = admin.auth();

async function addStudent() {
  try {
    // Créer l'utilisateur dans Firebase Authentication
    const userRecord = await auth.createUser({
      email: "t.afdailat@gmail.com",
      password: "Mohamed2002@@",
      displayName: "Mohamed AFDAILAT",
    });
    const uid = userRecord.uid;
    console.log("Utilisateur créé avec UID:", uid);

    // Ajouter les données dans Firestore avec l'UID
    const studentData = {
      name: "Mohamed AFDAILAT",
      email: "t.afdailat@gmail.com",
      role: "student",
      subscriptionStatus: "paid",
      subscriptionPlan: "annuel",
      subscriptionExpiry: "2026-06-25T20:50:00Z"
    };

    await db.collection('users').doc(uid).set(studentData);
    console.log("Étudiant ajouté avec succès dans Firestore !");
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'étudiant :", error);
  }
}

addStudent();