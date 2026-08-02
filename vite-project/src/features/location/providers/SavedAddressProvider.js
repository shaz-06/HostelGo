import { addressRepository } from "../repositories/addressRepository";

export const SavedAddressProvider = {
  /**
   * Search within saved addresses.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async search(query) {
    if (!query || query.trim() === "") return [];
    const normalizedQuery = query.toLowerCase().trim();
    
    const res = await addressRepository.getSavedAddresses();
    if (res.success && res.data) {
      return res.data.filter(addr => {
        const line = (addr.addressLine || "").toLowerCase();
        const label = (addr.label || addr.addressType || "").toLowerCase();
        const landmark = (addr.landmark || "").toLowerCase();
        
        return line.includes(normalizedQuery) || 
               label.includes(normalizedQuery) || 
               landmark.includes(normalizedQuery);
      }).map(addr => ({
        ...addr,
        source: "saved"
      }));
    }
    return [];
  }
};
