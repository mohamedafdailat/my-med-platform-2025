const admin = require('../config/firebase');
const db = admin.db;

class Video {
  static collection = db.collection('videos');

  static async create(data) {
    try {
      const videoData = {
        title: data.title,
        url: data.url,
        thumbnail: data.thumbnail || '',
        createdAt: new Date(),
      };
      const docRef = await this.collection.add(videoData);
      return { id: docRef.id, ...videoData };
    } catch (error) {
      throw new Error(`Erreur création vidéo : ${error.message}`);
    }
  }

  static async getById(videoId) {
    try {
      const doc = await this.collection.doc(videoId).get();
      if (!doc.exists) return false;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Erreur récupération vidéo : ${error.message}`);
    }
  }

  static async getAll() {
    try {
      const snapshot = await this.collection.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Erreur récupération vidéos : ${error.message}`);
    }
  }

  static async update(videoId, updates) {
    try {
      const docRef = this.collection.doc(videoId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.update(updates);
      return true;
    } catch (error) {
      throw new Error(`Erreur mise à jour vidéo : ${error.message}`);
    }
  }

  static async delete(videoId) {
    try {
      const docRef = this.collection.doc(videoId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.delete();
      return true;
    } catch (error) {
      throw new Error(`Erreur suppression vidéo : ${error.message}`);
    }
  }
}

module.exports = Video;