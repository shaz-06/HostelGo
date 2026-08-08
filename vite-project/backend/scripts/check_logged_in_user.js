const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const name = col.name;
    const doc = await db.collection(name).findOne({ _id: new mongoose.Types.ObjectId("6a1802c4b030af5183cf61a0") });
    if (doc) {
      console.log(`FOUND IN COLLECTION "${name}":`, JSON.stringify(doc, null, 2));
    }
    const docStr = await db.collection(name).findOne({ _id: "6a1802c4b030af5183cf61a0" });
    if (docStr) {
      console.log(`FOUND IN COLLECTION "${name}" (String ID):`, JSON.stringify(docStr, null, 2));
    }
  }
  await mongoose.disconnect();
}

run().catch(console.error);
