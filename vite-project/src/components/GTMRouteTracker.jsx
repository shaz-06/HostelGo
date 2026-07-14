import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/gtm";

/**
 * Route tracker component for Google Tag Manager.
 * Listens to React Router location changes and sends page_view events.
 */
const GTMRouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Small delay to allow document.title to update if set by page components dynamically
    const handle = setTimeout(() => {
      trackPageView(location.pathname + location.search, document.title || "Buyto");
    }, 100);

    return () => clearTimeout(handle);
  }, [location]);

  return null;
};

export default GTMRouteTracker;
