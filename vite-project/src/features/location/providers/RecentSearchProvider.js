export const RecentSearchProvider = {
  /**
   * Search within recent search records.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async search(query) {
    const raw = localStorage.getItem("buyto_recent_addresses");
    if (!raw) return [];
    
    try {
      const recents = JSON.parse(raw);
      if (!query || query.trim() === "") {
        return recents.map(r => ({ ...r, source: "recent" }));
      }
      
      const normalizedQuery = query.toLowerCase().trim();
      return recents.filter(addr => {
        const line = (addr.addressLine || "").toLowerCase();
        return line.includes(normalizedQuery);
      }).map(r => ({ ...r, source: "recent" }));
    } catch (e) {
      return [];
    }
  }
};
