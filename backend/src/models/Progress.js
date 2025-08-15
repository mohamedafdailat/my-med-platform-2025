const admin = require('../config/firebase');
const db = admin.db;

class Progress {
  static collection = db.collection('progress');

  static async create(userId, data) {
    try {
      const progressData = {
        userId,
        courses: data.courses || 0,
        videos: data.videos || 0,
        quizzes: data.quizzes || 0,
        flashcards: data.flashcards || 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const docRef = await this.collection.doc(userId).set(progressData);
      return { id: userId, ...progressData };
    } catch (error) {
      throw new Error(`Erreur création progrès : ${error.message}`);
    }
  }

  static async getByUserId(userId) {
    try {
      const doc = await this.collection.doc(userId).get();
      if (!doc.exists) return false;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Erreur récupération progrès : ${error.message}`);
    }
  }

  static async update(userId, updates) {
    try {
      const docRef = this.collection.doc(userId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    } catch (error) {
      throw new Error(`Erreur mise à jour progrès : ${error.message}`);
    }
  }

  static async delete(userId) {
    try {
      const docRef = this.collection.doc(userId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.delete();
      return true;
    } catch (error) {
      throw new Error(`Erreur suppression progrès : ${error.message}`);
    }
  }
}

module.exports = Progress;