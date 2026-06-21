const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");

let initialized = false;

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    initialized = true;
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Firebase Admin cert:", err.message);
  }
} else {
  console.warn("WARNING: backend/serviceAccountKey.json not found. Push notifications will be mocked/skipped.");
}

module.exports = {
  admin: initialized ? admin : null,
  isFirebaseEnabled: initialized
};
