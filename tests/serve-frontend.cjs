const { spawn } = require('node:child_process');
const path = require('node:path');
// All Firebase settings use a fictitious demo project and local emulator ports.
const env = {
  ...process.env,
  PORT: '3180', HOST: '127.0.0.1', BROWSER: 'none',
  REACT_APP_USE_EMULATORS: 'true',
  REACT_APP_AUTH_EMULATOR_PORT: '19099',
  REACT_APP_FIRESTORE_EMULATOR_PORT: '18080',
  REACT_APP_STORAGE_EMULATOR_PORT: '19199',
  REACT_APP_FIREBASE_API_KEY: 'demo-key',
  REACT_APP_FIREBASE_AUTH_DOMAIN: 'demo-medplatform-audit.firebaseapp.com',
  REACT_APP_FIREBASE_PROJECT_ID: 'demo-medplatform-audit',
  REACT_APP_FIREBASE_STORAGE_BUCKET: 'demo-medplatform-audit.appspot.com',
  REACT_APP_FIREBASE_APP_ID: 'demo-app',
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  REACT_APP_FIREBASE_MEASUREMENT_ID: '',
  REACT_APP_BACKEND_URL: 'http://127.0.0.1:5180',
  REACT_APP_API_URL: 'http://127.0.0.1:5180',
};
const child = spawn(process.execPath, ['node_modules/react-scripts/scripts/start.js'], {
  cwd: path.resolve(__dirname, '../frontend'), env, stdio: 'inherit',
});
child.on('exit', (code) => { process.exitCode = code || 0; });
