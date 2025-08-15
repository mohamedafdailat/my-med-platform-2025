const admin = require('./backend/src/config/firebase');
const storage = admin.storage;
const fs = require('fs').promises;
const path = require('path');

const uploadFileToStorage = async (filePath, destination) => {
  try {
    const fileName = path.basename(filePath);
    const storagePath = `${destination}/${fileName}`;
    const file = storage.file(storagePath);
    const fileBuffer = await fs.readFile(filePath);

    await file.save(fileBuffer, {
      metadata: { contentType: filePath.endsWith('.mp4') ? 'video/mp4' : 'application/pdf' },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2030',
    });

    console.log(`Uploaded ${fileName} to ${storagePath}: ${url}`);
    return { url, storagePath };
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error.message);
    throw error;
  }
};

const uploadAssets = async () => {
  try {
    // Upload sample videos
    const videoDir = path.join(__dirname, 'assets/videos/samples');
    const videos = await fs.readdir(videoDir);
    for (const video of videos) {
      if (video.endsWith('.mp4')) {
        const videoPath = path.join(videoDir, video);
        await uploadFileToStorage(videoPath, 'videos');
      }
    }

    // Upload sample documents
    const docDir = path.join(__dirname, 'assets/documents/templates');
    const docs = await fs.readdir(docDir);
    for (const doc of docs) {
      if (doc.endsWith('.pdf')) {
        const docPath = path.join(docDir, doc);
        await uploadFileToStorage(docPath, 'documents');
      }
    }

    console.log('All assets uploaded successfully');
  } catch (error) {
    console.error('Error uploading assets:', error.message);
  }
};

uploadAssets();