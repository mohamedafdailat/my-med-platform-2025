const express = require('express');
const router = express.Router();
const { getVideos, getVideo, uploadVideo } = require('../controllers/videoController');
const verifyToken = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, getVideos);
router.get('/:videoId', verifyToken, getVideo);
router.post('/', verifyToken, upload.single('video'), uploadVideo);

module.exports = router;