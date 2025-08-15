const admin = require('../config/firebase');
const db = admin.db;

class Flashcard {
  static collection = db.collection('flashcards');

  static async create(data) {
    try {
      const flashcardData = {
        question: data.question,
        answer: data.answer,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const docRef = await this.collection.add(flashcardData);
      return { id: docRef.id, ...flashcardData };
    } catch (error) {
      throw new Error(`Erreur création flashcard : ${error.message}`);
    }
  }

  static async getById(flashcardId) {
    try {
      const doc = await this.collection.doc(flashcardId).get();
      if (!doc.exists) return false;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Erreur récupération flashcard : ${error.message}`);
    }
  }

  static async getAll() {
    try {
      const snapshot = await this.collection.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Erreur récupération flashcards : ${error.message}`);
    }
  }

  static async update(flashcardId, updates) {
    try {
      const docRef = this.collection.doc(flashcardId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.update(updates);
      return true;
    } catch (error) {
      throw new Error(`Erreur mise à jour flashcard : ${error.message}`);
    }
  }

  static async delete(flashcardId) {
    try {
      const docRef = this.collection.doc(flashcardId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.delete();
      return true;
    } catch (error) {
      throw new Error(`Erreur suppression flashcard : ${error.message}`);
    }
  }
}

module.exports = Flashcard;