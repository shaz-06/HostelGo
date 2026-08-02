export const PlacesProvider = {
  /**
   * Search Nominatim OSM Places API.
   * @param {string} query
   * @param {AbortSignal} signal
   * @returns {Promise<Array>}
   */
  async search(query, signal) {
    if (!query || query.trim().length < 3) return [];
    
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;
      const res = await fetch(url, { signal });
      
      if (res.ok) {
        const data = await res.json();
        return data.map(item => ({
          id: "place_" + item.place_id,
          addressLine: item.display_name,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
          source: "places"
        }));
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("[PlacesProvider] Place search failed:", err);
      }
    }
    return [];
  }
};
