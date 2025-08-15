const admin = require('../config/firebase');
const storage = admin.storage;

const uploadFile = async (file, destination) => {
  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `${destination}/${fileName}`;
    const fileUpload = storage.file(filePath);

    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2030',
    });

    return { url, filePath };
  } catch (error) {
    throw new Error(`Erreur upload fichier : ${error.message}`);
  }
};

const deleteFile = async (filePath) => {
  try {
    const file = storage.file(filePath);
    await file.delete();
    return { success: true };
  } catch (error) {
    throw new Error(`Erreur suppression fichier : ${error.message}`);
  }
};

module.exports = { uploadFile, deleteFile };