const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const DeliveryServiceZone = require("./models/DeliveryServiceZone");
const Address = require("./models/Address");

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const zones = await DeliveryServiceZone.find({ active: true }).lean();
  const addresses = await Address.find({}).lean();

  console.log("Zones:", zones.map(z => ({ name: z.name, lat: z.latitude, lng: z.longitude, radiusKm: z.radiusKm })));
  console.log("\nCalculating distances:");

  for (const addr of addresses) {
    console.log(`\nAddress: "${addr.label}" (Lat: ${addr.latitude}, Lng: ${addr.longitude})`);
    for (const zone of zones) {
      const dist = haversineDistance(addr.latitude, addr.longitude, zone.latitude, zone.longitude);
      const isInside = dist <= zone.radiusKm;
      console.log(`  Zone: "${zone.name}"`);
      console.log(`    Distance: ${dist.toFixed(4)} km`);
      console.log(`    Radius: ${zone.radiusKm} km`);
      console.log(`    Inside: ${isInside}`);
    }
  }

  await mongoose.connection.close();
}

run().catch(console.error);
