/**
 * Rider Simulator Service
 * Provides mock rider profiles for simulated delivery tracking.
 */

/**
 * Returns a simulated rider profile for a given order.
 * Uses a deterministic selection if needed, or defaults to a high-quality delivery partner profile.
 *
 * @param {string} orderId The Order ID
 * @returns {object} Mock rider profile
 */
function getSimulatedRider(orderId) {
  return {
    name: "Rahul Kumar",
    rating: 4.9,
    vehicleType: "Electric Scooter",
    plateNumber: "KA-03-EG-7742",
    phone: "9876543210",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop"
  };
}

module.exports = {
  getSimulatedRider
};
