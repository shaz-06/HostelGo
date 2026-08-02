import { useState, useEffect, useRef } from "react";
import { SavedAddressProvider } from "../providers/SavedAddressProvider";
import { RecentSearchProvider } from "../providers/RecentSearchProvider";
import { PlacesProvider } from "../providers/PlacesProvider";

const DEFAULT_PROVIDERS = [
  SavedAddressProvider,
  RecentSearchProvider,
  PlacesProvider
];

export function useAddressSearch(query, providers = DEFAULT_PROVIDERS) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // If query is empty, load recents immediately
    if (!query || query.trim() === "") {
      setLoading(true);
      RecentSearchProvider.search("").then(recents => {
        setResults(recents);
        setLoading(false);
      });
      return;
    }

    setLoading(true);

    // Cancel previous search requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const debounceTimeout = setTimeout(async () => {
      try {
        const resultsArray = await Promise.all(
          providers.map(async provider => {
            try {
              return await provider.search(query, controller.signal);
            } catch (e) {
              return [];
            }
          })
        );

        if (controller.signal.aborted) return;

        // Flatten search results
        const merged = resultsArray.flat();

        // Deduplicate by addressLine or ID
        const seen = new Set();
        const deduplicated = merged.filter(item => {
          const key = (item.addressLine || "").toLowerCase().trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Rank by source priority (Saved -> Recent -> Places)
        const sorted = deduplicated.sort((a, b) => {
          const priority = { saved: 0, recent: 1, places: 2 };
          return (priority[a.source] ?? 9) - (priority[b.source] ?? 9);
        });

        setResults(sorted);
      } catch (err) {
        console.warn("[useAddressSearch] Search pipeline failed:", err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(debounceTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, providers]);

  return { results, loading };
}
