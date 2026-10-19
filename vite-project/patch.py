import re

with open('/Users/shashankshetty/Documents/HostelGo/vite-project/backend/routes/paymentRoutes.js', 'r') as f:
    content = f.read()

# 1. Strict coordinate validation
coords_old = """  const customerCoords = extractCoordinates({ latitude, longitude });
  if (!customerCoords) {
    console.warn("⚠️ Invalid/missing customer coordinates. Checking default zone...");
    const defaultZone = await DeliveryServiceZone.findOne({ active: true }).lean();
    if (!defaultZone) {
      console.error("❌ No active delivery zones available for default fallback.");
      return null;
    }
    const defaultCoords = extractCoordinates(defaultZone) || { latitude: defaultZone.latitude, longitude: defaultZone.longitude };
    return {
      storeId: String(defaultZone._id),
      storeName: defaultZone.name,
      latitude: defaultCoords.latitude,
      longitude: defaultCoords.longitude,
      radiusKm: Number(defaultZone.radiusKm)
    };
  }"""
coords_new = """  const customerCoords = extractCoordinates({ latitude, longitude });
  if (!customerCoords) {
    console.warn("⚠️ Invalid/missing customer coordinates. Returning null.");
    return null;
  }"""
if coords_old in content:
    content = content.replace(coords_old, coords_new)
    print("Patched coordinates")
else:
    print("Could not find coords_old")


with open('/Users/shashankshetty/Documents/HostelGo/vite-project/backend/routes/paymentRoutes.js', 'w') as f:
    f.write(content)
