import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export default function SEO({ title, description, image, isHome = false }) {
  const location = useLocation();

  // Construct the full page title
  const displayTitle = isHome
    ? "Buyto – Instant Grocery & Daily Essentials Delivery"
    : `${title} • Buyto`;

  // Default SEO fallbacks
  const defaultDesc = "Buyto is a quick-commerce platform delivering groceries, electronics, fashion, daily essentials and more in minutes.";
  const defaultImage = "https://www.buyto.co.in/logo.png";

  const metaDesc = description || defaultDesc;
  const metaImage = image || defaultImage;

  // Construct canonical URL
  const canonicalUrl = `https://www.buyto.co.in${location.pathname === "/" ? "" : location.pathname}`;

  return (
    <Helmet>
      {/* Title */}
      <title>{displayTitle}</title>

      {/* Meta Description */}
      <meta name="description" content={metaDesc} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={displayTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
}
