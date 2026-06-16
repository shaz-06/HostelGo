/**
 * Optimizes image URLs by appending/modifying width parameters for supported platforms (e.g. Unsplash).
 * @param {string} url - The original image URL.
 * @param {'thumbnail' | 'medium' | 'full'} size - Target size bucket.
 */
export function getOptimizedImageUrl(url, size = 'medium') {
  if (!url) return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500";

  // Check if it's an Unsplash URL
  if (url.includes("images.unsplash.com")) {
    // Determine target width
    let width = 400; // default medium
    if (size === 'thumbnail') width = 150;
    if (size === 'full') width = 1000;

    // Clean existing width parameters if any
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("w", String(width));
      urlObj.searchParams.set("auto", "format");
      urlObj.searchParams.set("fit", "crop");
      urlObj.searchParams.set("q", size === 'thumbnail' ? "60" : "80");
      return urlObj.toString();
    } catch (e) {
      // Fallback simple string replace if invalid URL object
      return url.replace(/w=\d+/, `w=${width}`);
    }
  }

  // Return original for non-unsplash images
  return url;
}
