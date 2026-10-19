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

  // Optimize Cloudinary URLs
  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/upload/")) {
    const parts = imageUrl.split("/upload/");
    if (parts.length === 2) {
      const leftPart = parts[0] + "/upload";
      let rightPart = parts[1];

      // Map size query to high-density appropriate widths
      let width = 480; // default medium
      if (size === 'thumbnail') width = 240;
      if (size === 'small') width = 320;
      if (size === 'full') width = 1000;

      const segments = rightPart.split("/");
      const firstSegment = segments[0];

      let transformations = [];
      let isVersionOrPublicId = false;

      if (/^v\d+$/.test(firstSegment)) {
        isVersionOrPublicId = true;
      } else if (segments.length === 1) {
        isVersionOrPublicId = true;
      }

      if (isVersionOrPublicId) {
        transformations.push(`w_${width}`);
        transformations.push("q_auto");
        transformations.push("f_auto");
      } else {
        const existingTx = firstSegment.split(",");
        const filteredTx = existingTx.filter(tx => !tx.startsWith("w_") && !tx.startsWith("q_") && !tx.startsWith("f_"));
        filteredTx.push(`w_${width}`);
        filteredTx.push("q_auto");
        filteredTx.push("f_auto");
        transformations = filteredTx;
        segments.shift();
      }

      return `${leftPart}/${transformations.join(",")}/${segments.join("/")}`;
    }
  }

  // Return original for non-unsplash images
  return imageUrl;
}

/**
 * Returns native responsive image props (src, srcSet, sizes) for optimal HTML preload scanning.
 */
export function getResponsiveImageProps(url, product = null) {
  const imageUrl = url || getFallbackImage(product);
  
  if (imageUrl.includes("images.unsplash.com")) {
    const getUnsplashSrc = (w) => {
      try {
        const urlObj = new URL(imageUrl);
        urlObj.searchParams.set("w", String(w));
        urlObj.searchParams.set("auto", "format");
        urlObj.searchParams.set("fit", "crop");
        urlObj.searchParams.set("q", "80");
        return urlObj.toString();
      } catch (e) {
        return imageUrl.replace(/w=\d+/, `w=${w}`);
      }
    };
    return {
      src: getUnsplashSrc(480),
      srcSet: `${getUnsplashSrc(240)} 240w, ${getUnsplashSrc(320)} 320w, ${getUnsplashSrc(480)} 480w, ${getUnsplashSrc(1000)} 1000w`,
      sizes: "(max-width: 768px) 50vw, 200px"
    };
  }

  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/upload/")) {
    const parts = imageUrl.split("/upload/");
    if (parts.length === 2) {
      const leftPart = parts[0] + "/upload";
      const rightPart = parts[1];
      const segments = rightPart.split("/");
      const firstSegment = segments[0];

      let isVersionOrPublicId = false;
      if (/^v\d+$/.test(firstSegment) || segments.length === 1) {
        isVersionOrPublicId = true;
      }

      const getCloudinarySrc = (w) => {
        let transformations = [];
        let curSegments = [...segments];
        if (isVersionOrPublicId) {
          transformations.push(`w_${w}`, "q_auto", "f_auto");
        } else {
          const existingTx = firstSegment.split(",");
          const filteredTx = existingTx.filter(tx => !tx.startsWith("w_") && !tx.startsWith("q_") && !tx.startsWith("f_"));
          filteredTx.push(`w_${w}`, "q_auto", "f_auto");
          transformations = filteredTx;
          curSegments.shift();
        }
        return `${leftPart}/${transformations.join(",")}/${curSegments.join("/")}`;
      };

      return {
        src: getCloudinarySrc(480),
        srcSet: `${getCloudinarySrc(240)} 240w, ${getCloudinarySrc(320)} 320w, ${getCloudinarySrc(480)} 480w, ${getCloudinarySrc(1000)} 1000w`,
        sizes: "(max-width: 768px) 50vw, 200px"
      };
    }
  }

  return {
    src: imageUrl,
    srcSet: undefined,
    sizes: undefined
  };
}
