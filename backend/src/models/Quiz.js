const admin = require('../config/firebase');
const db = admin.db;

class Quiz {
  static collection = db.collection('quizzes');

  static async create(data) {
    try {
      const quizData = {
        title: data.title,
        questions: data.questions || [],
        createdAt: new Date(),
      };
      const docRef = await this.collection.add(quizData);
      return { id: docRef.id, ...quizData };
    } catch (error) {
      throw new Error(`Erreur création quiz : ${error.message}`);
    }
  }

  static async getById(quizId) {
    try {
      const doc = await this.collection.doc(quizId).get();
      if (!doc.exists) return false;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Erreur récupération quiz : ${error.message}`);
    }
  }

  static async getAll() {
    try {
      const snapshot = await this.collection.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Erreur récupération quiz : ${error.message}`);
    }
  }

  static async update(quizId, updates) {
    try {
      const docRef = this.collection.doc(quizId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.update(updates);
      return true;
    } catch (error) {
      throw new Error(`Erreur mise à jour quiz : ${error.message}`);
    }
  }

  static async delete(quizId) {
    try {
      const docRef = this.collection.doc(quizId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.delete();
      return true;
    } catch (error) {
      throw new Error(`Erreur suppression quiz : ${error.message}`);
    }
  }
}

module.exports = Quiz;