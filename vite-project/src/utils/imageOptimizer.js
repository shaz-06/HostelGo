import { getFallbackImage } from "./categoryImages";

/**
 * Optimizes image URLs by appending/modifying width parameters for supported platforms (e.g. Unsplash).
 * @param {string} url - The original image URL.
 * @param {'thumbnail' | 'medium' | 'full'} size - Target size bucket.
 * @param {object} product - Optional product object to resolve category fallbacks.
 */
export function getOptimizedImageUrl(url, size = 'medium', product = null) {
  const imageUrl = url || getFallbackImage(product);

  // Check if it's an Unsplash URL
  if (imageUrl.includes("images.unsplash.com")) {
    // Determine target width
    let width = 400; // default medium
    if (size === 'thumbnail') width = 150;
    if (size === 'full') width = 1000;

    // Clean existing width parameters if any
    try {
      const urlObj = new URL(imageUrl);
      urlObj.searchParams.set("w", String(width));
      urlObj.searchParams.set("auto", "format");
      urlObj.searchParams.set("fit", "crop");
      urlObj.searchParams.set("q", size === 'thumbnail' ? "60" : "80");
      return urlObj.toString();
    } catch (e) {
      // Fallback simple string replace if invalid URL object
      return imageUrl.replace(/w=\d+/, `w=${width}`);
    }
  }

  // Return original for non-unsplash images
  return imageUrl;
}
