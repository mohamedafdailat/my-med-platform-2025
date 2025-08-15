const admin = require('../config/firebase');
const db = admin.db;

const getDocument = async (collection, docId) => {
  try {
    const doc = await db.collection(collection).doc(docId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    throw new Error(`Erreur récupération document ${collection}/${docId} : ${error.message}`);
  }
};

const getCollection = async (collection) => {
  try {
    const snapshot = await db.collection(collection).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Erreur récupération collection ${collection} : ${error.message}`);
  }
};

const createDocument = async (collection, data) => {
  try {
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    throw new Error(`Erreur création document dans ${collection} : ${error.message}`);
  }
};

const updateDocument = async (collection, docId, updates) => {
  try {
    const docRef = db.collection(collection).doc(docId);
    await docRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    throw new Error(`Erreur mise à jour document ${collection}/${docId} : ${error.message}`);
  }
};

const deleteDocument = async (collection, docId) => {
  try {
    await db.collection(collection).doc(docId).delete();
    return true;
  } catch (error) {
    throw new Error(`Erreur suppression document ${collection}/${docId} : ${error.message}`);
  }
};

module.exports = {
  getDocument,
  getCollection,
  createDocument,
  updateDocument,
  deleteDocument,
};