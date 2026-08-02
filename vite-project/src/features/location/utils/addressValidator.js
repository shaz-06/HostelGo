/**
 * Validates address parameters.
 * @param {object} address
 * @returns {{isValid: boolean, error?: string}}
 */
export function validateAddress(address) {
  if (!address) {
    return { isValid: false, error: "Address data is empty" };
  }
  if (!address.fullName || address.fullName.trim() === "") {
    return { isValid: false, error: "Full Name is required" };
  }
  if (!address.phone || address.phone.trim().length < 10) {
    return { isValid: false, error: "Phone number must be at least 10 digits" };
  }
  if (!address.addressLine || address.addressLine.trim() === "") {
    return { isValid: false, error: "Address line details are required" };
  }
  if (address.latitude === undefined || address.latitude === null ||
      address.longitude === undefined || address.longitude === null) {
    return { isValid: false, error: "Coordinates are required to pin this address" };
  }
  return { isValid: true };
}
