const { getCollection, getDocument, createDocument } = require('../utils/database');
const { storage } = require('../config/firebase');

const getVideos = async (req, res) => {
  try {
    const videos = await getCollection('videos');
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await getDocument('videos', videoId);
    if (!video) return res.status(404).json({ message: 'Vidéo non trouvée' });
    res.status(200).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadVideo = async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const fileName = `${Date.now()}-${file.originalname}`;
    const fileUpload = storage.file(`videos/${fileName}`);
    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    const [url] = await fileUpload.getSignedUrl({ action: 'read', expires: '03-01-2030' });
    const video = await createDocument('videos', { title, url });
    res.status(201).json({ message: 'Vidéo chargée', video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getVideos, getVideo, uploadVideo };