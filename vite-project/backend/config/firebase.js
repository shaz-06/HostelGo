const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

let isFirebaseEnabled = false;

try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  isFirebaseEnabled = true;
} catch (err) {
  console.error("Firebase admin initialization failed:", err);
}

module.exports = {
  admin,
  isFirebaseEnabled
};
