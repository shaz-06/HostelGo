const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const DeliveryServiceZone = require("./models/DeliveryServiceZone");
const Address = require("./models/Address");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const zones = await DeliveryServiceZone.find({});
  console.log("=== ALL SERVICE ZONES ===");
  console.log(JSON.stringify(zones, null, 2));

  const addresses = await Address.find({});
  console.log("=== ALL ADDRESSES ===");
  console.log(JSON.stringify(addresses, null, 2));

  await mongoose.connection.close();
}

run().catch(console.error);
