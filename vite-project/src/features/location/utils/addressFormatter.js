/**
 * Formats address parts into a single normalized display string.
 * @param {object} address
 * @returns {string}
 */
export function formatAddressLine(address) {
  if (!address) return "";
  const parts = [];
  
  if (address.addressLine) parts.push(address.addressLine);
  if (address.landmark) parts.push(address.landmark);
  if (address.roomNumber) parts.push(`Room/Flat: ${address.roomNumber}`);
  if (address.city) parts.push(address.city);
  if (address.pincode) parts.push(address.pincode);

  return parts.join(", ");
}
