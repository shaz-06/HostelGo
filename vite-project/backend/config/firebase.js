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
    console.log("✅ Firebase Admin initialized");
  } else {
    console.warn(
      "⚠️ Firebase environment variables are missing. Push notifications are disabled."
    );
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error);
}

module.exports = {
  admin,
  isFirebaseEnabled,
};
