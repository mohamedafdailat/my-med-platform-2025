const admin = require('../config/firebase');
const db = admin.db;

class User {
  static collection = db.collection('users');

  static async create(data) {
    try {
      const userData = {
        name: data.name,
        email: data.email,
        role: data.role || 'student',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const docRef = await this.collection.add(userData);
      return { id: docRef.id, ...userData };
    } catch (error) {
      throw new Error(`Erreur création utilisateur : ${error.message}`);
    }
  }

  static async getById(userId) {
    try {
      const doc = await this.collection.doc(userId).get();
      if (!doc.exists) return false;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Erreur récupération utilisateur : ${error.message}`);
    }
  }

  static async getAll() {
    try {
      const snapshot = await this.collection.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Erreur récupération utilisateurs : ${error.message}`);
    }
  }

  static async update(userId, updates) {
    try {
      const docRef = this.collection.doc(userId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.update(updates);
      return true;
    } catch (error) {
      throw new Error(`Erreur mise à jour utilisateur : ${error.message}`);
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
      throw new Error(`Erreur suppression utilisateur : ${error.message}`);
    }
  }
}

module.exports = User;