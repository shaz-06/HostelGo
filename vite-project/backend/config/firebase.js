const admin = require("firebase-admin");

let isFirebaseEnabled = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    isFirebaseEnabled = true;
    console.log("✅ Firebase Admin initialized via Env");
  } else {
    // Fallback to serviceAccountKey.json
    const path = require("path");
    const fs = require("fs");
    const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      isFirebaseEnabled = true;
      console.log("✅ Firebase Admin initialized via serviceAccountKey.json");
    } else {
      console.warn(
        "⚠️ Firebase environment variables and serviceAccountKey.json are missing. Push notifications are disabled."
      );
    }
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error);
}

module.exports = {
  admin,
  isFirebaseEnabled,
};
