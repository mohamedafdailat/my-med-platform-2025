const dotenv = require('dotenv');

dotenv.config();

const environment = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  openaiApiKey: process.env.OPENAI_API_KEY,
  firebase: {
    serviceAccount: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  },
};

module.exports = environment;